"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PortalLayout from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { showError, showSuccess } from "@/utils/toast";
import { addNotification } from "@/utils/notifications";
import { CreditCard, Loader2, Send } from "lucide-react";

type ServiceRequest = {
  id: string;
  requester_id?: string | null;
  requester_email?: string | null;
  provider_id: string;
  provider_type?: string | null;
  request_title: string;
  request_details?: string | null;
  notes?: string | null;
  status: string;
  created_at: string;
};

const parseNotes = (notes?: string | null) => {
  try {
    return notes ? JSON.parse(notes) : {};
  } catch {
    return {};
  }
};

export default function FreeProviderDashboard() {
  const { user, profile } = useAuth();
  const portalType = profile?.role === "marketplace" ? "marketplace" : "operations";
  const providerName = profile?.home_name || profile?.business_name || profile?.full_name || "Provider";
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [message, setMessage] = useState("");
  const [planning, setPlanning] = useState({ summary: "", scope: "", total: "", currency: "KES" });

  const requestLimit = profile?.request_limit || 5;
  const selectedNotes = useMemo(() => parseNotes(selected?.notes), [selected?.notes]);
  const messages = selectedNotes.chat_messages || [];

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [requestRes, countRes] = await Promise.all([
        supabase.from("service_requests").select("*").eq("provider_id", user.id).order("created_at", { ascending: false }).range(0, 99),
        supabase.rpc("get_provider_active_request_count", { provider_user_id: user.id }),
      ]);
      if (requestRes.error) throw requestRes.error;
      setRequests((requestRes.data || []) as ServiceRequest[]);
      setActiveCount(Number(countRes.data || 0));
    } catch (error: any) {
      showError(error.message || "Could not load incoming service requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user?.id]);

  const saveNotes = async (patch: any, status?: string) => {
    if (!selected) return;
    const nextNotes = JSON.stringify({ ...selectedNotes, ...patch });
    const { error } = await supabase
      .from("service_requests")
      .update({ notes: nextNotes, status: status || selected.status, updated_at: new Date().toISOString() })
      .eq("id", selected.id);
    if (error) throw error;
    setSelected({ ...selected, notes: nextNotes, status: status || selected.status });
    await loadData();
  };

  const sendMessage = async () => {
    if (!selected || !message.trim()) return;
    try {
      const nextMessage = {
        id: crypto.randomUUID(),
        sender: "provider",
        text: message.trim(),
        timestamp: new Date().toISOString(),
        sender_name: providerName,
      };
      await saveNotes({ chat_messages: [...messages, nextMessage] });
      if (selected.requester_id) {
        await addNotification(selected.requester_id, {
          userId: selected.requester_id,
          title: `New message from ${providerName}`,
          message,
          type: "chat",
          link: "/family/chats",
        });
      }
      setMessage("");
      showSuccess("Message sent.");
    } catch (error: any) {
      showError(error.message || "Could not send message.");
    }
  };

  const sendPlanning = async () => {
    if (!selected) return;
    try {
      const board = {
        work_summary: planning.summary,
        scope_details: planning.scope,
        final_total: Number(planning.total || 0),
        currency: planning.currency,
        status: "submitted_for_approval",
        submitted_at: new Date().toISOString(),
      };
      await saveNotes({ planning_board: board, payment_requested: true, payment_amount: board.final_total, payment_currency: board.currency }, "planning_completed");
      if (selected.requester_id) {
        await addNotification(selected.requester_id, {
          userId: selected.requester_id,
          title: "Planning board submitted",
          message: `${providerName} sent a planning proposal.`,
          type: "planning",
          link: "/family/requests",
        });
      }
      showSuccess("Planning board sent to client.");
    } catch (error: any) {
      showError(error.message || "Could not send planning board.");
    }
  };

  const sendInvoice = async () => {
    if (!selected) return;
    const amount = Number(planning.total || selectedNotes.payment_amount || 0);
    if (!amount) return showError("Enter invoice amount first.");
    try {
      const { error } = await supabase.from("invoices").insert({
        request_id: selected.id,
        provider_id: selected.provider_id,
        provider_type: selected.provider_type || portalType,
        payer_user_id: selected.requester_id || null,
        payer_email: selected.requester_email || null,
        title: `Invoice for ${selected.request_title}`,
        amount,
        total_amount: amount,
        currency: planning.currency || "KES",
        status: "sent",
        ledger_status: "awaiting_payment",
      });
      if (error) throw error;
      if (selected.requester_id) {
        await addNotification(selected.requester_id, {
          userId: selected.requester_id,
          title: "Invoice sent",
          message: `${providerName} sent an invoice.`,
          type: "payment",
          link: "/family/requests",
        });
      }
      showSuccess("Invoice sent.");
    } catch (error: any) {
      showError(error.message || "Could not send invoice.");
    }
  };

  return (
    <PortalLayout portalType={portalType as "operations" | "marketplace"}>
      <div className="space-y-8 pb-28 md:pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="section-tag">FREE TIER</span>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--ink)] mt-2">{providerName}</h1>
            <p className="text-[var(--muted)]">Incoming requests, planning, chat, invoices, billing, and settings. Full ERP unlocks on Pro.</p>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
            <Button asChild className="btn-struta-gold w-full sm:w-auto"><Link to={`/${portalType}/billing`}>Billing / Upgrade</Link></Button>
            <Button asChild variant="outline" className="w-full sm:w-auto"><Link to={`/${portalType}/settings`}>Settings</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><p className="text-xs text-slate-500">Active Requests</p><p className="text-2xl font-black">{activeCount}/{requestLimit}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-xs text-slate-500">Tier</p><p className="text-2xl font-black">Free</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-xs text-slate-500">Pro Unlocks</p><p className="text-sm font-bold">Full ERP, AI reports, obituaries, secretary tools, unlimited staff and requests.</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Incoming Service Requests</CardTitle>
            <CardDescription>Tap any request to open the mobile-friendly planning center.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : requests.map((request) => (
              <button
                type="button"
                key={request.id}
                onClick={() => setSelected(request)}
                className="w-full text-left rounded-2xl border p-4 hover:border-[var(--gold)] hover:bg-[var(--gold-bg)]/30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="font-black">Funeral Service Request: {request.request_title}</p>
                    <p className="text-xs text-slate-500 break-all">{request.requester_email || "No email"}</p>
                  </div>
                  <Badge variant="outline" className="w-fit">{request.status}</Badge>
                </div>
              </button>
            ))}
            {!loading && !requests.length && <p className="text-center py-10 text-sm text-[var(--muted)]">No incoming requests yet.</p>}
          </CardContent>
        </Card>

        <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-5xl max-h-[calc(100dvh-1rem)] overflow-y-auto p-4 sm:p-6 pb-28 sm:pb-6 z-[100]">
            <DialogHeader className="pr-8">
              <DialogTitle className="text-lg sm:text-xl">Funeral Service Request: {selected?.request_title}</DialogTitle>
              <DialogDescription>{selected?.status}</DialogDescription>
            </DialogHeader>

            {selected && (
              <Tabs defaultValue="overview" className="w-full">
                <div className="-mx-4 sm:mx-0 overflow-x-auto px-4 sm:px-0 pb-2">
                  <TabsList className="inline-flex min-w-max h-auto gap-1">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    <TabsTrigger value="planning">Planning Board</TabsTrigger>
                    <TabsTrigger value="invoice">Invoices</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="pt-4 space-y-3">
                  <p className="text-sm"><b>Client:</b> <span className="break-all">{selected.requester_email || "Not provided"}</span></p>
                  <p className="text-sm whitespace-pre-wrap rounded-xl border bg-slate-50 p-4">{selected.request_details || "No details."}</p>
                </TabsContent>

                <TabsContent value="chat" className="pt-4 space-y-3">
                  <div className="h-[45dvh] min-h-64 overflow-y-auto rounded-xl border p-3 bg-slate-50 space-y-2">
                    {messages.map((m: any) => (
                      <div key={m.id} className={`rounded-xl p-3 text-sm break-words ${m.sender === "provider" ? "bg-[var(--gold)] text-white ml-auto max-w-[90%] sm:max-w-[80%]" : "bg-white border max-w-[90%] sm:max-w-[80%]"}`}>{m.text}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-stretch">
                    <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Talk to client..." className="min-h-12" />
                    <Button onClick={sendMessage} aria-label="Send message"><Send className="w-4 h-4" /></Button>
                  </div>
                </TabsContent>

                <TabsContent value="planning" className="pt-4 space-y-3">
                  <Input value={planning.summary} onChange={(e) => setPlanning({ ...planning, summary: e.target.value })} placeholder="Work summary" />
                  <Textarea value={planning.scope} onChange={(e) => setPlanning({ ...planning, scope: e.target.value })} placeholder="Planning details" className="min-h-40" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input type="number" value={planning.total} onChange={(e) => setPlanning({ ...planning, total: e.target.value })} placeholder="Total" />
                    <Input value={planning.currency} onChange={(e) => setPlanning({ ...planning, currency: e.target.value.toUpperCase() })} placeholder="Currency" />
                  </div>
                  <Button className="btn-struta-gold w-full sm:w-auto" onClick={sendPlanning}>Send Planning Board to Client</Button>
                </TabsContent>

                <TabsContent value="invoice" className="pt-4 space-y-3">
                  <Input type="number" value={planning.total} onChange={(e) => setPlanning({ ...planning, total: e.target.value })} placeholder="Invoice amount" />
                  <Button className="btn-struta-gold w-full sm:w-auto" onClick={sendInvoice}><CreditCard className="w-4 h-4 mr-2" />Send Invoice</Button>
                </TabsContent>

                <TabsContent value="actions" className="pt-4 grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                  <Button onClick={() => saveNotes({}, "accepted")}>Approve</Button>
                  <Button variant="outline" onClick={() => saveNotes({}, "completed")}>Mark Complete</Button>
                  <Button asChild className="btn-struta-gold"><Link to={`/${portalType}/billing`}>Billing</Link></Button>
                  <Button asChild variant="outline"><Link to={`/${portalType}/settings`}>Settings</Link></Button>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
}