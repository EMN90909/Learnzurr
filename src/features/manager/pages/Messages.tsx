import React, { useEffect, useMemo, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import ResponsiveChatHub from "@/components/ResponsiveChatHub";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showError, showSuccess } from "@/utils/toast";

type StaffMember = { id: string; user_id?: string; name?: string; email?: string; role?: string };
type StaffMessage = { id: string; sender_staff_id?: string; recipient_staff_id?: string; message: string; created_at: string };

export default function ManagerMessagesPage() {
  const { profile } = useAuth();
  const portalType = profile?.role === "marketplace" || profile?.staff_business_type === "vendor" ? "marketplace" : "operations";
  const organizationId = profile?.organization_id || profile?.business_id || profile?.manager_id || profile?.id;
  const isStaffSession = Boolean(profile?.is_staff_session);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [recipient, setRecipient] = useState<string>("team");
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState(isStaffSession ? "staff" : "client");

  const currentStaffId = profile?.id;
  const staffMap = useMemo(() => new Map(staff.flatMap((s) => [[s.id, s], ...(s.user_id ? [[s.user_id, s] as const] : [])])), [staff]);

  const loadStaffChat = async () => {
    if (!organizationId || !currentStaffId) return;
    try {
      const { data, error } = await supabase.rpc("erp_get_staff_chat", { staff_id_input: currentStaffId, organization_id_input: organizationId });
      if (error) throw error;
      const payload = data as any;
      if (!payload?.success) throw new Error(payload?.error || "Could not load staff chat.");
      setStaff(payload.staff || []);
      setMessages(payload.messages || []);
    } catch (error: any) {
      showError(error.message || "Could not load staff chat.");
    }
  };

  useEffect(() => {
    void loadStaffChat();
    if (!organizationId) return;
    const timer = window.setInterval(() => void loadStaffChat(), 5000);
    return () => window.clearInterval(timer);
  }, [organizationId, currentStaffId]);

  const send = async () => {
    if (!organizationId || !currentStaffId || !text.trim()) return;
    try {
      const { data, error } = await supabase.rpc("erp_send_staff_message", {
        sender_staff_id_input: currentStaffId,
        organization_id_input: organizationId,
        recipient_staff_id_input: recipient === "team" ? null : recipient,
        message_input: text.trim(),
      });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error || "Could not send staff message.");
      setText("");
      showSuccess("Message sent.");
      await loadStaffChat();
    } catch (error: any) {
      showError(error.message || "Could not send staff message.");
    }
  };

  const StaffChat = (
    <Card className="border-[var(--border)] shadow-sm">
      <CardHeader>
        <CardTitle>Staff chat</CardTitle>
        <CardDescription>Message the whole team or a specific staff member/manager in this home/vendor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-96 overflow-y-auto border border-[var(--border)] bg-[var(--cream)] p-0 space-y-0">
          {messages.map((msg) => {
            const sender = staffMap.get(msg.sender_staff_id || "");
            const target = msg.recipient_staff_id ? staffMap.get(msg.recipient_staff_id) : null;
            return <div key={msg.id} className="max-w-[24rem] bg-[var(--surface)] border-y border-[var(--border)] p-3 leading-7 [overflow-wrap:anywhere]"><p className="text-xs font-bold text-[var(--gold)]">{sender?.name || sender?.email || "Staff"} {target ? `→ ${target.name || target.email}` : "→ Team"}</p><p className="text-sm mt-1 max-w-[32ch]">{msg.message}</p><p className="text-[10px] text-[var(--muted)] mt-1">{new Date(msg.created_at).toLocaleString()}</p></div>;
          })}
          {!messages.length && <p className="text-sm text-[var(--muted)] text-center py-10">No staff messages yet.</p>}
        </div>
        <div className="grid md:grid-cols-[190px_1fr_auto] gap-2">
          <Select value={recipient} onValueChange={setRecipient}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="team">Whole team</SelectItem>{staff.filter((s) => s.id !== currentStaffId && s.user_id !== currentStaffId).map((s) => <SelectItem key={s.id} value={s.id}>{s.name || s.email} — {s.role || "staff"}</SelectItem>)}</SelectContent></Select>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." onKeyDown={(e) => { if (e.key === "Enter") void send(); }} />
          <Button onClick={send}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PortalLayout portalType={portalType as "operations" | "marketplace"}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-[var(--ink)]">Chats</h2>
          <p className="text-[var(--muted)]">{isStaffSession ? "Internal staff messages for this organization." : "Client conversations and internal team messages for this organization."}</p>
        </div>
        {isStaffSession ? StaffChat : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList><TabsTrigger value="client">Client chats</TabsTrigger><TabsTrigger value="staff">Staff chat</TabsTrigger></TabsList>
            <TabsContent value="client"><Card className="border-[var(--border)] shadow-sm"><CardHeader><CardTitle>Client request chats</CardTitle><CardDescription>Open client conversations linked to service requests.</CardDescription></CardHeader><CardContent><ResponsiveChatHub mode="provider" /></CardContent></Card></TabsContent>
            <TabsContent value="staff">{StaffChat}</TabsContent>
          </Tabs>
        )}
      </div>
    </PortalLayout>
  );
}
