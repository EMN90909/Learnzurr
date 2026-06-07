"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Building2, Loader2, MessageSquare, Send, Store, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { showError } from "@/utils/toast";

type ChatMode = "family" | "provider";
type ChatMessage = { id: string; sender: "family" | "provider"; text: string; timestamp: string; sender_name?: string; seen?: boolean };
type ChatThread = { id: string; requester_id: string | null; requester_email: string; provider_id: string; provider_type: "home" | "vendor"; request_title: string; status: string; updated_at: string; requester_name?: string; requester_phone?: string; provider_name?: string; provider_label?: string; notesObject: Record<string, any>; messages: ChatMessage[] };

const parseNotes = (notes?: string | null) => { if (!notes) return {}; try { return JSON.parse(notes); } catch { return { custom_notes: notes }; } };
const buildNotes = (notes: Record<string, any>, messages: ChatMessage[]) => JSON.stringify({ ...notes, chat_messages: messages });
const getProviderIcon = (type: string) => type === "vendor" ? <Store className="w-5 h-5" /> : <Building2 className="w-5 h-5" />;
const formatPresenceStatus = (thread: ChatThread) => {
  const updated = new Date(thread.updated_at);
  const minutes = Math.max(0, Math.round((Date.now() - updated.getTime()) / 60000));
  if (minutes < 5) return "Online now";
  if (minutes < 60) return `Active ${minutes} min ago`;
  return `Last active ${updated.toLocaleDateString()} ${updated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

export default function ResponsiveChatHub({ mode }: { mode: ChatMode }) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedThread = useMemo(() => threads.find((thread) => thread.id === selectedId) || null, [threads, selectedId]);

  useEffect(() => { const update = () => setIsMobile(window.innerWidth < 768); update(); window.addEventListener("resize", update); return () => window.removeEventListener("resize", update); }, []);

  const enrichRows = async (rows: any[]) => {
    const providerIds = [...new Set(rows.map((row: any) => row.provider_id).filter(Boolean))];
    const requesterIds = [...new Set(rows.map((row: any) => row.requester_id).filter(Boolean))];
    const idsToLookup = mode === "family" ? providerIds : requesterIds;
    const profileMap = new Map<string, any>();
    if (idsToLookup.length) {
      const { data: profiles } = await supabase.from("user_profiles").select("id, full_name, home_name, business_name, email, phone").in("id", idsToLookup);
      (profiles || []).forEach((item: any) => profileMap.set(item.id, item));
    }
    return rows.map((row: any) => {
      const notes = parseNotes(row.notes);
      const providerProfile = profileMap.get(row.provider_id);
      const requesterProfile = profileMap.get(row.requester_id);
      const providerName = providerProfile?.home_name || providerProfile?.business_name || providerProfile?.full_name || (row.provider_type === "vendor" ? "Vendor" : "Funeral Home");
      const requesterName = notes.requester_name || requesterProfile?.full_name || row.requester_email || "Client";
      return { id: row.id, requester_id: row.requester_id, requester_email: row.requester_email, provider_id: row.provider_id, provider_type: row.provider_type, request_title: row.request_title, status: row.status, updated_at: row.updated_at, requester_name: requesterName, requester_phone: notes.requester_phone || requesterProfile?.phone || "", provider_name: providerName, provider_label: row.provider_type === "vendor" ? "Vendor" : "Funeral Home", notesObject: notes, messages: Array.isArray(notes.chat_messages) ? notes.chat_messages : [] } as ChatThread;
    });
  };

  const loadThreads = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let query = supabase.from("service_requests").select("*").order("updated_at", { ascending: false });
      query = mode === "family" ? query.eq("requester_id", user.id) : query.eq("provider_id", profile?.id || user.id);
      const { data, error } = await query;
      if (error) throw error;
      const enriched = await enrichRows(data || []);
      setThreads(enriched);
      setSelectedId((current) => current || (window.innerWidth < 768 ? null : enriched[0]?.id || null));
    } catch (error: any) {
      showError(error.message || "Could not load chats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadThreads(); }, [user?.id, profile?.id, mode]);

  useEffect(() => {
    if (!user?.id) return;
    const filter = mode === "family" ? `requester_id=eq.${user.id}` : `provider_id=eq.${profile?.id || user.id}`;
    const channel = supabase.channel(`struta-chat-${mode}-${user.id}`).on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter }, async (payload: any) => {
      if (payload.eventType === "DELETE") {
        setThreads((prev) => prev.filter((thread) => thread.id !== payload.old?.id));
        if (selectedId === payload.old?.id) setSelectedId(null);
        return;
      }
      const [enriched] = await enrichRows([payload.new]);
      if (!enriched) return;
      setThreads((prev) => {
        const exists = prev.some((thread) => thread.id === enriched.id);
        const next = exists ? prev.map((thread) => thread.id === enriched.id ? { ...thread, ...enriched } : thread) : [enriched, ...prev];
        return next.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      });
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, profile?.id, mode, selectedId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [selectedThread?.messages.length]);

  const sendPush = async (thread: ChatThread, text: string) => { try { const receiverId = mode === "family" ? thread.provider_id : thread.requester_id; if (!receiverId) return; const senderName = mode === "family" ? (profile?.full_name || "Family") : (thread.provider_name || profile?.home_name || profile?.business_name || "Provider"); await fetch("/api/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: receiverId, title: `New message from ${senderName}`, body: text.slice(0, 120), url: mode === "family" ? "/operations/chats" : "/family/chats", type: "chat_message" }) }); } catch (err) { console.warn("[Chat] Push notification failed:", err); } };

  const handleSend = async () => {
    if (!selectedThread || !message.trim()) return;
    setSending(true);
    try {
      const newMessage: ChatMessage = { id: crypto.randomUUID(), sender: mode === "family" ? "family" : "provider", text: message.trim(), timestamp: new Date().toISOString(), sender_name: mode === "family" ? profile?.full_name || "Family" : profile?.home_name || profile?.business_name || profile?.full_name || "Provider", seen: false };
      const nextMessages = [...selectedThread.messages, newMessage];
      const nextNotes = buildNotes(selectedThread.notesObject, nextMessages);
      setThreads((prev) => prev.map((thread) => thread.id === selectedThread.id ? { ...thread, messages: nextMessages, notesObject: { ...thread.notesObject, chat_messages: nextMessages }, updated_at: new Date().toISOString() } : thread));
      setMessage("");
      const { error } = await supabase.from("service_requests").update({ notes: nextNotes, updated_at: new Date().toISOString() }).eq("id", selectedThread.id);
      if (error) throw error;
      await sendPush(selectedThread, newMessage.text);
    } catch (error: any) {
      showError(error.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  const displayName = (thread: ChatThread) => mode === "family" ? thread.provider_name || "Provider" : thread.requester_name || "Client";
  const subtitle = (thread: ChatThread) => mode === "family" ? `${thread.provider_label} · ${thread.request_title}` : `${thread.request_title}${thread.requester_phone ? ` · ${thread.requester_phone}` : ""}`;

  const ChatList = <div className="h-full overflow-y-auto p-3 space-y-3">{threads.length === 0 ? <Card className="border-dashed"><CardContent className="p-8 text-center text-[var(--muted)]"><MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />No chats yet. Accepted or active requests will appear here.</CardContent></Card> : threads.map((thread) => { const last = thread.messages[thread.messages.length - 1]; const active = thread.id === selectedId; return <button key={thread.id} onClick={() => setSelectedId(thread.id)} className={`w-full text-left rounded-2xl border p-4 transition-all ${active ? "border-[var(--gold)] bg-[var(--gold-bg)] shadow-sm" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--gold)]/50"}`}><div className="flex gap-3 items-start"><div className="w-11 h-11 rounded-2xl bg-[var(--cream)] flex items-center justify-center text-[var(--gold)] shrink-0">{mode === "family" ? getProviderIcon(thread.provider_type) : <User className="w-5 h-5" />}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="font-black text-[var(--ink)] truncate">{displayName(thread)}</p><Badge variant="outline" className="text-[10px] capitalize">{thread.status}</Badge></div><p className="text-xs text-[var(--muted)] truncate mt-1">{subtitle(thread)}</p><p className="text-sm text-slate-600 truncate mt-2">{last?.text || "No messages yet. Start the conversation."}</p></div></div></button>; })}</div>;

  const ChatArea = selectedThread ? <div className="h-full flex flex-col bg-[var(--surface)]"><div className="h-16 border-b border-[var(--border)] px-4 flex items-center gap-3 shrink-0">{isMobile && <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}><ArrowLeft className="w-5 h-5" /></Button>}<div className="w-10 h-10 rounded-2xl bg-[var(--gold-bg)] text-[var(--gold)] flex items-center justify-center shrink-0">{mode === "family" ? getProviderIcon(selectedThread.provider_type) : <User className="w-5 h-5" />}</div><div className="min-w-0"><h3 className="font-black text-[var(--ink)] truncate">{displayName(selectedThread)}</h3><p className="text-xs text-[var(--muted)] truncate">{subtitle(selectedThread)} · {formatPresenceStatus(selectedThread)}</p></div></div><div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--paper)]/60">{selectedThread.messages.length === 0 && <div className="h-full flex items-center justify-center text-center text-[var(--muted)]"><div><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No messages yet.</p><p className="text-sm">Send the first message to continue planning.</p></div></div>}{selectedThread.messages.map((item) => { const mine = mode === "family" ? item.sender === "family" : item.sender === "provider"; return <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-3xl px-4 py-3 shadow-sm ${mine ? "bg-[var(--gold)] text-white rounded-br-md" : "bg-white border border-[var(--border)] text-[var(--ink)] rounded-bl-md"}`}><p className="text-sm whitespace-pre-wrap leading-relaxed">{item.text}</p><p className={`text-[10px] mt-2 ${mine ? "text-white/70" : "text-[var(--muted)]"}`}>{new Date(item.timestamp).toLocaleString()}</p></div></div>; })}</div><div className="border-t border-[var(--border)] p-3 bg-[var(--surface)] shrink-0"><div className="flex gap-2 items-end"><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." className="min-h-[48px] max-h-32 resize-none" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} /><Button className="btn-struta-gold h-12 px-4" disabled={sending || !message.trim()} onClick={() => void handleSend()}>{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button></div></div></div> : null;

  if (loading) return <div className="min-h-[420px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" /></div>;
  return <div className="rounded-[2rem] overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-sm h-[calc(100vh-220px)] min-h-[560px]">{isMobile ? (selectedThread ? ChatArea : ChatList) : <div className="grid grid-cols-[360px_1fr] h-full"><aside className="border-r border-[var(--border)] bg-[var(--paper)]/80 overflow-hidden"><div className="h-16 border-b border-[var(--border)] px-5 flex items-center"><h3 className="font-black text-[var(--ink)]">Chats List</h3></div>{ChatList}</aside><main className="overflow-hidden">{ChatArea || <div className="h-full flex items-center justify-center text-[var(--muted)]">Select a chat to open messages.</div>}</main></div>}</div>;
}
