import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { Bell, CheckCircle2, ImagePlus, Link2, Loader2, Lock, Megaphone, Share2, Sparkles, UploadCloud } from "lucide-react";

type AiKind = "eulogy" | "banner" | "social_post";

const proFeatures = [
  { icon: Megaphone, title: "Priority family support", text: "Create high-priority support requests that are routed faster." },
  { icon: Share2, title: "Advanced sharing tools", text: "Generate social posts and private links for controlled sharing." },
  { icon: CheckCircle2, title: "Planning and coordination", text: "Create checklists and reminders for important tasks." },
  { icon: UploadCloud, title: "Unlimited photo uploads", text: "Upload and track memorial photos without free-plan limits." },
  { icon: Lock, title: "Private memorial", text: "Create password-protected memorial access." },
];

async function postJson(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function FamilyCreate() {
  const [loading, setLoading] = useState<string>("");
  const [aiKind, setAiKind] = useState<AiKind>("eulogy");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [checklistTitle, setChecklistTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reminderTitle, setReminderTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [privateTitle, setPrivateTitle] = useState("");
  const [privatePassword, setPrivatePassword] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [privateLink, setPrivateLink] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const aiLabel = useMemo(() => aiKind === "eulogy" ? "AI Eulogy" : aiKind === "banner" ? "Memorial Banner Text" : "Social Sharing Post", [aiKind]);

  const generateAi = async () => {
    if (!aiPrompt.trim()) return showError("Add a short prompt first.");
    setLoading("ai");
    try {
      const data = await postJson("/api/family/pro/ai-generate", { kind: aiKind, title: aiLabel, prompt: aiPrompt, context: aiContext });
      setAiOutput(data.content || data.asset?.content || "");
      showSuccess("Created and saved to your Pro assets.");
    } catch (error: any) {
      showError(error.message || "Could not generate content.");
    } finally {
      setLoading("");
    }
  };

  const createChecklist = async () => {
    if (!checklistTitle.trim()) return showError("Add a checklist item.");
    setLoading("checklist");
    try {
      await postJson("/api/family/pro/checklist", { title: checklistTitle, due_date: dueDate || null, priority: "high" });
      setChecklistTitle("");
      setDueDate("");
      showSuccess("Checklist item saved.");
    } catch (error: any) { showError(error.message || "Could not save checklist item."); }
    finally { setLoading(""); }
  };

  const createReminder = async () => {
    if (!reminderTitle.trim() || !remindAt) return showError("Add reminder title and time.");
    setLoading("reminder");
    try {
      await postJson("/api/family/pro/reminders", { title: reminderTitle, remind_at: new Date(remindAt).toISOString(), channel: "email" });
      setReminderTitle("");
      setRemindAt("");
      showSuccess("Reminder saved.");
    } catch (error: any) { showError(error.message || "Could not save reminder."); }
    finally { setLoading(""); }
  };

  const createPrivateMemorial = async () => {
    if (!privateTitle.trim() || privatePassword.length < 6) return showError("Add a title and password with at least 6 characters.");
    setLoading("private");
    try {
      const data = await postJson("/api/family/pro/private-memorial", { title: privateTitle, password: privatePassword });
      setPrivateLink(data.url || "");
      setPrivateTitle("");
      setPrivatePassword("");
      showSuccess("Private memorial created.");
    } catch (error: any) { showError(error.message || "Could not create private memorial."); }
    finally { setLoading(""); }
  };

  const createShareLink = async () => {
    setLoading("share");
    try {
      const data = await postJson("/api/family/pro/private-link", { title: privateTitle || "Private memorial link" });
      setPrivateLink(data.url || "");
      showSuccess("Private sharing link created.");
    } catch (error: any) { showError(error.message || "Could not create sharing link."); }
    finally { setLoading(""); }
  };

  const createSupportTicket = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) return showError("Add subject and message.");
    setLoading("support");
    try {
      await postJson("/api/family/pro/support", { subject: supportSubject, message: supportMessage });
      setSupportSubject("");
      setSupportMessage("");
      showSuccess("Priority support request sent.");
    } catch (error: any) { showError(error.message || "Could not send support request."); }
    finally { setLoading(""); }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold)]">Family Pro</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">Create & Coordinate</h1>
            <p className="mt-3 max-w-2xl text-[var(--muted)] font-semibold">Build memorial banners, AI eulogies, private links, checklists, reminders, photo collections, and priority support requests.</p>
          </div>
          <Button asChild className="btn-struta-gold rounded-full"><Link to="/family/billing">Manage Pro Plan</Link></Button>
        </div>

        <div className="grid md:grid-cols-5 gap-3">
          {proFeatures.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"><Icon className="w-5 h-5 text-[var(--gold)] mb-3" /><h3 className="font-black leading-tight">{title}</h3><p className="text-xs text-[var(--muted)] mt-2 font-semibold">{text}</p></div>)}
        </div>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3"><Sparkles className="w-6 h-6 text-[var(--gold)]" /><div><h2 className="text-2xl font-black">AI creation studio</h2><p className="text-sm text-[var(--muted)] font-semibold">Powered by your configured Gemini/OpenRouter API key.</p></div></div>
            <div className="grid sm:grid-cols-3 gap-2">{["eulogy", "banner", "social_post"].map((kind) => <button key={kind} onClick={() => setAiKind(kind as AiKind)} className={`rounded-full px-4 py-2 font-black border ${aiKind === kind ? "bg-[var(--gold)] text-[var(--ink)] border-[var(--gold)]" : "bg-[var(--paper)] border-[var(--border)]"}`}>{kind === "social_post" ? "Social post" : kind}</button>)}</div>
            <div><Label>Prompt</Label><Input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Example: Write a warm eulogy for my grandmother who loved church, farming, and family." /></div>
            <div><Label>Details / context</Label><Textarea value={aiContext} onChange={(e) => setAiContext(e.target.value)} placeholder="Add names, dates, tone, language, cultural or religious details, memories..." className="min-h-[160px]" /></div>
            <Button onClick={generateAi} className="btn-struta-primary w-full" disabled={loading === "ai"}>{loading === "ai" ? <Loader2 className="w-4 h-4 animate-spin" /> : `Generate ${aiLabel}`}</Button>
            {aiOutput && <div className="rounded-2xl bg-[var(--paper)] border border-[var(--border)] p-5 whitespace-pre-wrap font-semibold leading-relaxed">{aiOutput}</div>}
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-4"><div className="flex gap-3 items-center"><Megaphone className="w-5 h-5 text-[var(--gold)]" /><h2 className="text-xl font-black">Priority family support</h2></div><Input value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="Subject" /><Textarea value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} placeholder="Tell us what you need help with urgently..." /><Button onClick={createSupportTicket} disabled={loading === "support"} className="btn-struta-gold w-full">{loading === "support" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Priority Request"}</Button></section>
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-4"><div className="flex gap-3 items-center"><Link2 className="w-5 h-5 text-[var(--gold)]" /><h2 className="text-xl font-black">Private links & memorial</h2></div><Input value={privateTitle} onChange={(e) => setPrivateTitle(e.target.value)} placeholder="Memorial or link title" /><Input value={privatePassword} onChange={(e) => setPrivatePassword(e.target.value)} placeholder="Password for private memorial" type="password" /><div className="grid sm:grid-cols-2 gap-2"><Button onClick={createPrivateMemorial} disabled={loading === "private"} className="btn-struta-primary">Private Memorial</Button><Button onClick={createShareLink} disabled={loading === "share"} className="btn-struta-gold">Private Link</Button></div>{privateLink && <Input value={privateLink} readOnly onFocus={(e) => e.currentTarget.select()} />}</section>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-4"><div className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-[var(--gold)]" /><h2 className="text-xl font-black">Planning checklist</h2></div><Input value={checklistTitle} onChange={(e) => setChecklistTitle(e.target.value)} placeholder="Example: Confirm burial permit" /><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /><Button onClick={createChecklist} disabled={loading === "checklist"} className="btn-struta-primary w-full">Save Checklist Item</Button></section>
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-4"><div className="flex gap-3 items-center"><Bell className="w-5 h-5 text-[var(--gold)]" /><h2 className="text-xl font-black">Reminders</h2></div><Input value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} placeholder="Example: Call caterer" /><Input type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)} /><Button onClick={createReminder} disabled={loading === "reminder"} className="btn-struta-gold w-full">Save Reminder</Button></section>
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-4"><div className="flex gap-3 items-center"><ImagePlus className="w-5 h-5 text-[var(--gold)]" /><h2 className="text-xl font-black">Unlimited photos</h2></div><label className="block rounded-2xl border-2 border-dashed border-[var(--gold)] bg-[var(--gold-bg)] p-6 text-center cursor-pointer"><UploadCloud className="w-8 h-8 text-[var(--gold)] mx-auto mb-2" /><span className="font-black">Select memorial photos</span><input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))} /></label><p className="text-sm font-semibold text-[var(--muted)]">{photoFiles.length ? `${photoFiles.length} photos ready. They can be uploaded when attached to a memorial.` : "Pro families have no photo-count limit."}</p></section>
        </div>
      </div>
    </div>
  );
}
