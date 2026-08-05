import { FormEvent, useEffect, useState } from "react";
import { api, type TeamInvite, type TeamMember } from "../../lib/api";

export function TeacherDashboard() {
  const [data, setData] = useState<{ students: number; revenue: number; classes: { id: string; title: string }[]; teachers: unknown[] } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.teacherDashboard().then(setData).catch((cause) => setError(cause.message)); }, []);
  return <div>
    <div className="page-head"><div><p className="eyebrow">Teaching workspace</p><h1>Dashboard</h1></div></div>
    {error && <p className="error">{error}</p>}
    <div className="stats">
      <article><small>All students</small><strong>{data?.students ?? "—"}</strong><span>Across active classes</span></article>
      <article><small>Money received</small><strong>KES {(data?.revenue ?? 0).toLocaleString()}</strong><span>Verified Paystack payments</span></article>
      <article><small>Teachers in teams</small><strong>{data?.teachers.length ?? "—"}</strong><span>Owners and collaborators</span></article>
    </div>
    <div className="cards">
      <article className="panel"><h2>Classes</h2>{data?.classes.map((item) => <p className="activity" key={item.id}>{item.title}<small>Open class workspace</small></p>)}</article>
      <article className="panel"><h2>Quick access</h2><div className="quick"><a href="/teacher/classes">Schedule classroom</a><a href="/teacher/assignments">Create assessment</a><a href="/teacher/team">Manage team</a><a href="/teacher/reports">View reports</a></div></article>
    </div>
  </div>;
}

export function TeacherTeam({ teamId }: { teamId?: string }) {
  const [email, setEmail] = useState("");
  const [share, setShare] = useState("10");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [status, setStatus] = useState(teamId ? "Loading team…" : "Create or select a team before inviting staff.");
  const load = () => teamId && api.team(teamId).then((result) => { setMembers(result.members); setInvites(result.invites); setStatus(""); }).catch((error) => setStatus(error.message));
  useEffect(load, [teamId]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!teamId) return;
    setStatus("Sending secure signup link…");
    try {
      const result = await api.inviteTeacher({ teamId, email, percentage: Number(share) });
      setStatus(result.message); setEmail(""); load();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Invitation failed"); }
  }
  return <div>
    <div className="page-head"><div><p className="eyebrow">Teaching workspace</p><h1>Team</h1></div></div>
    <div className="split">
      <form className="panel" onSubmit={submit}>
        <h2>Add teacher</h2><p>Supabase sends an SMTP-backed invitation. The recipient completes signup with the invited email and creates a password under your team.</p>
        <label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)}/></label>
        <label>Revenue share (%)<input required min="0" max="100" step="0.01" type="number" value={share} onChange={(event) => setShare(event.target.value)}/></label>
        <button className="button primary" disabled={!teamId}>Send signup link</button><p>{status}</p>
        {invites.length > 0 && <div className="invite-list"><h3>Pending invitations</h3>{invites.map((invite) => <p key={invite.id}>{invite.email}<small>{invite.revenue_share}% · {invite.status}</small></p>)}</div>}
      </form>
      <section className="panel"><h2>Teachers</h2>{members.length === 0 && <p>No teachers have joined this team yet.</p>}{members.map((member) => <div className="member" key={member.teacher_id}><span className="avatar">{member.profiles?.full_name?.[0] ?? "T"}</span><div><b>{member.profiles?.full_name || "Teacher"}</b><small>Last login {formatTime(member.profiles?.last_login_at)} · {member.revenue_share}% share</small></div><a href={`/teacher/reports?teacher=${member.teacher_id}`}>Report</a></div>)}</section>
    </div>
  </div>;
}

export function TeacherClasses({ classes }: { classes: { id: string; title: string }[] }) {
  const [open, setOpen] = useState<"session" | "assignment" | null>(null);
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [status, setStatus] = useState("");
  const [session, setSession] = useState({ name: "", startsAt: "", endsAt: "" });
  const [assignment, setAssignment] = useState({ title: "", kind: "task", dueAt: "", html: "" });

  async function schedule(event: FormEvent) {
    event.preventDefault(); setStatus("Scheduling and notifying learners…");
    try {
      const result = await api.createSession(classId, { name: session.name, startsAt: new Date(session.startsAt).toISOString(), endsAt: new Date(session.endsAt).toISOString() });
      setStatus(`Scheduled. ${result.notified.emailsSent} emails and ${result.notified.pushesSent} push notifications sent.`);
      setOpen(null);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Session could not be scheduled"); }
  }

  async function publish(event: FormEvent) {
    event.preventDefault(); setStatus("Publishing learning work…");
    try {
      await api.createAssignment(classId, { title: assignment.title, kind: assignment.kind, dueAt: assignment.dueAt ? new Date(assignment.dueAt).toISOString() : null, body: { format: "html", html: assignment.html } });
      setStatus("Assignment published to enrolled learners."); setOpen(null);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Assignment could not be published"); }
  }

  return <div>
    <div className="page-head"><div><p className="eyebrow">Live learning</p><h1>Classes</h1></div><div className="actions"><button className="button primary" onClick={() => setOpen("session")}>Create live classroom</button><button className="button secondary" onClick={() => setOpen("assignment")}>Assign work</button></div></div>
    <label className="class-picker">Class<select value={classId} onChange={(event) => setClassId(event.target.value)}>{classes.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
    {status && <p className="form-message">{status}</p>}
    <div className="cards">{classes.map((item) => <article className="panel" key={item.id}><span className="live">Maximum 2 teachers · 50 learners</span><h2>{item.title}</h2><p>Schedule teacher-broadcast sessions, publish tasks, quizzes, exams, and assessments.</p></article>)}</div>
    {open === "session" && <div className="modal-backdrop"><form className="modal" onSubmit={schedule}><h2>Schedule live classroom</h2><label>Meeting name<input required value={session.name} onChange={(event) => setSession({ ...session, name: event.target.value })}/></label><label>Start time<input required type="datetime-local" value={session.startsAt} onChange={(event) => setSession({ ...session, startsAt: event.target.value })}/></label><label>End time<input required type="datetime-local" value={session.endsAt} onChange={(event) => setSession({ ...session, endsAt: event.target.value })}/></label><p>Enrolled learners receive a signed join link by email and web push. Only authenticated, enrolled learners can enter.</p><button className="button primary wide">Schedule and notify</button><button type="button" className="button secondary wide" onClick={() => setOpen(null)}>Cancel</button></form></div>}
    {open === "assignment" && <div className="modal-backdrop"><form className="modal editor-modal" onSubmit={publish}><h2>Create learning work</h2><label>Title<input required value={assignment.title} onChange={(event) => setAssignment({ ...assignment, title: event.target.value })}/></label><label>Type<select value={assignment.kind} onChange={(event) => setAssignment({ ...assignment, kind: event.target.value })}><option value="task">Task</option><option value="question">Question</option><option value="quiz">Quiz</option><option value="assessment">Assessment</option><option value="exam">Exam</option></select></label><label>Due date<input type="datetime-local" value={assignment.dueAt} onChange={(event) => setAssignment({ ...assignment, dueAt: event.target.value })}/></label><label>Content<div className="rich-toolbar"><button type="button" onClick={() => document.execCommand("bold")}>Bold</button><button type="button" onClick={() => document.execCommand("italic")}>Italic</button><button type="button" onClick={() => document.execCommand("insertUnorderedList")}>List</button></div><div className="rich-editor" contentEditable suppressContentEditableWarning onInput={(event) => setAssignment({ ...assignment, html: event.currentTarget.innerHTML })}/></label><button className="button primary wide">Publish</button><button type="button" className="button secondary wide" onClick={() => setOpen(null)}>Cancel</button></form></div>}
  </div>;
}

function formatTime(value?: string | null) {
  if (!value) return "never";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
