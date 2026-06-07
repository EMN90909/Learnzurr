"use client";

import React, { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import ManualPaymentVerificationBoard from "@/components/ManualPaymentVerificationBoard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2, RefreshCw, Search, Trash2 } from "lucide-react";

type AdminServiceRequest = {
  id: string;
  requester_email: string;
  provider_name?: string | null;
  provider_type?: string | null;
  request_title?: string | null;
  status?: string | null;
  created_at?: string | null;
};

const AdminRequests = () => {
  const [requests, setRequests] = useState<AdminServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, requester_email, provider_name, provider_type, request_title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(150);
      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      showError(error.message || "Could not load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const deleteRequest = async (requestId: string) => {
    if (!window.confirm("Delete this request?")) return;

    setBusy((prev) => ({ ...prev, [requestId]: true }));
    try {
      const { error } = await supabase.rpc("delete_request", { request_id_input: requestId });
      if (error) throw error;
      showSuccess("Request deleted.");
      setRequests((current) => current.filter((request) => request.id !== requestId));
    } catch (error: any) {
      showError(error.message || "Could not delete request.");
    } finally {
      setBusy((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const filteredRequests = requests.filter((request) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [
      request.requester_email,
      request.provider_name,
      request.provider_type,
      request.request_title,
      request.status,
      request.id,
    ].some((value) => (value || "").toLowerCase().includes(query));
  });

  return (
    <PortalLayout portalType="admin">
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Requests</h2>
            <p className="text-slate-500">Review mobile money requests and remove completed or invalid service requests.</p>
          </div>
          <Button variant="outline" onClick={loadRequests} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>

        <ManualPaymentVerificationBoard title="Mobile Money Requests" />

        <Card>
          <CardHeader>
            <CardTitle>Service Requests</CardTitle>
            <CardDescription>Search by user, provider, request title, status, or request ID.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search user, provider, status, or request..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            {loading ? (
              <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : filteredRequests.length ? (
              filteredRequests.map((request) => (
                <div key={request.id} className="rounded-xl border p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{request.request_title || "Untitled request"}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {request.requester_email} to {request.provider_name || request.provider_type || "provider"}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline">{request.status || "pending"}</Badge>
                      <Badge variant="outline">{request.created_at ? new Date(request.created_at).toLocaleString() : "No date"}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <Button variant="destructive" disabled={busy[request.id]} onClick={() => void deleteRequest(request.id)}>
                      {busy[request.id] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-xl text-slate-500">No requests found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default AdminRequests;
