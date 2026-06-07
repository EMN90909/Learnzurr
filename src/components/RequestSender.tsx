"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { getEnabledServices, getServiceLabel } from "@/lib/services-catalog";
import { parseServicesOffered } from "@/lib/provider-business";

type ProviderType = "home" | "vendor";

type RequestSenderProps = {
  providerId: string;
  providerType: ProviderType;
  providerName: string;
  onSuccess?: () => void;
};

type ProviderService = {
  id: string;
  label: string;
  price: number;
};

export default function RequestSender({ providerId, providerType, providerName, onSuccess }: RequestSenderProps) {
  const { user, profile } = useAuth();
  const [availableServices, setAvailableServices] = useState<ProviderService[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDetails, setRequestDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      let response = await supabase
        .from("user_profiles")
        .select("services_offered")
        .eq("id", providerId)
        .maybeSingle();

      if (response.error) {
        response = await supabase
          .from("user_profiles")
          .select("id")
          .eq("id", providerId)
          .maybeSingle();
      }

      const enabledServices = getEnabledServices(parseServicesOffered(response.data?.services_offered)).map(([id, value]) => ({
        id,
        label: getServiceLabel(id, providerType),
        price: Number(value.price || 0),
      }));

      setAvailableServices(enabledServices);
    };

    void loadServices();
  }, [providerId, providerType]);

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault();

    if (!user?.email) {
      showError("You must be logged in to send a request.");
      return;
    }

    if (!requestTitle.trim() || !requestDetails.trim()) {
      showError("Please fill in the request title and details.");
      return;
    }

    setLoading(true);

    const chosenService = availableServices.find((service) => service.id === selectedService) || null;
    const familyPhone = profile?.phone || profile?.mobile_phone || profile?.mpesa_phone || "";
    const familyName = profile?.full_name || user.user_metadata?.full_name || user.email;
    const initialAmount = Number(chosenService?.price || 0);
    const requestNotes = {
      custom_notes: notes.trim(),
      requester_name: familyName,
      requester_phone: familyPhone,
      selected_service: chosenService
        ? {
            id: chosenService.id,
            label: chosenService.label,
            price: initialAmount,
            currency: "KES",
            provider_type: providerType,
          }
        : null,
      payment_requested: initialAmount > 0,
      payment_amount: initialAmount,
      payment_currency: "KES",
      payment_status: "unpaid",
      chat_messages: [],
      planning_tasks: [],
      progress_updates: [],
      archived: false,
      status: "pending",
    };

    const contactAppendix = [
      chosenService ? `Chosen service: ${chosenService.label}${initialAmount > 0 ? ` - KES ${initialAmount.toLocaleString()}` : ""}` : "",
      familyName ? `Family representative: ${familyName}` : "",
      familyPhone ? `Family phone: ${familyPhone}` : "",
      user.email ? `Family email: ${user.email}` : "",
    ].filter(Boolean).join("\n");

    const newRequest = {
      id: crypto.randomUUID(),
      requester_id: user.id,
      requester_email: user.email,
      provider_type: providerType,
      provider_id: providerId,
      request_title: requestTitle.trim(),
      request_details: `${requestDetails.trim()}${contactAppendix ? `\n\n---\nRequest Summary\n${contactAppendix}` : ""}`,
      notes: JSON.stringify(requestNotes),
      status: "pending" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const subscriptionField = providerType === "home" ? "home_id" : "provider_id";
      const [{ data: providerSubscription }, { count: requestCount, error: countError }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("status, payment_status")
          .eq(subscriptionField, providerId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("service_requests")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", providerId)
          .eq("provider_type", providerType)
          .in("status", ["pending", "accepted", "booked", "assigned", "in_progress", "completed"]),
      ]);

      if (countError) throw countError;

      const hasUnlimitedAccess = providerSubscription?.status === "active" && providerSubscription?.payment_status === "paid";

      if (!hasUnlimitedAccess && (requestCount || 0) >= 10) {
        throw new Error(`${providerName} has reached the 10 request limit for the free trial. They need Pro Plan to receive more requests.`);
      }

      const { error } = await supabase.from("service_requests").insert(newRequest);
      if (error) throw error;

      showSuccess(`Request sent successfully to ${providerName}!`);
      setRequestTitle("");
      setSelectedService("");
      setRequestDetails("");
      setNotes("");
      onSuccess?.();
    } catch (error: any) {
      showError(error.message || "Failed to send request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={sendRequest} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="serviceType">Offered Service</Label>
        <Select
          value={selectedService}
          onValueChange={(value) => {
            setSelectedService(value);
            const match = availableServices.find((service) => service.id === value);
            if (match) setRequestTitle(match.label);
          }}
        >
          <SelectTrigger id="serviceType" className="bg-[var(--paper)] border-[var(--border)]">
            <SelectValue placeholder={availableServices.length ? "Choose a service offered by this provider" : "No enabled services available yet"} />
          </SelectTrigger>
          <SelectContent>
            {availableServices.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.label}{service.price > 0 ? ` - KES ${service.price.toLocaleString()}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="requestTitle">What do you want to request?</Label>
        <Input id="requestTitle" value={requestTitle} onChange={(e) => setRequestTitle(e.target.value)} placeholder="e.g. Full Funeral Package / Tent & Chair Hire" required className="bg-[var(--paper)] border-[var(--border)]" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="requestDetails">Explain what is needed</Label>
        <Textarea id="requestDetails" value={requestDetails} onChange={(e) => setRequestDetails(e.target.value)} placeholder="Provide details such as dates, quantities, or special requests..." required className="bg-[var(--paper)] border-[var(--border)] min-h-[100px]" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Extra Notes (Optional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any other details or contact preferences..." className="bg-[var(--paper)] border-[var(--border)] min-h-[80px]" />
      </div>

      <Button type="submit" disabled={loading} className="w-full btn-struta-gold font-bold h-12">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
        {loading ? "Sending..." : "Send Request"}
      </Button>
    </form>
  );
}
