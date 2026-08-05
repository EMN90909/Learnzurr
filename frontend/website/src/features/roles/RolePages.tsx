import { type FormEvent, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { api, type AssignmentSummary, type ClassroomSummary } from "../../lib/api";
import { supabase, type AppRole } from "../../lib/supabase";

type Row = Record<string, any>;
type Metric = { label: string; value: string | number; detail: string };
type PageData = { metrics: Metric[]; rows: Row[]; note?: string };

const titles: Record<AppRole, Record<string, string>> = {
  teacher: { students: "Students", payments: "Payments", reports: "Reports" },
  learner: { dashboard: "Dashboard", classes: "My classes", assignments: "Assignments", lessons: "Lessons", progress: "Progress", questions: "Q&A", calendar: "Calendar" },
  guardian: { dashboard: "Dashboard", children: "Children", classes: "Classes", progress: "Progress", payments: "Payments", teachers: "Teachers", messages: "Messages" },
  admin: { dashboard: "Dashboard", users: "Users", classes: "Classes", payments: "Payments", teams: "Teacher teams", reports: "Reports", content: "Content" },
};

export function RoleDataPage({ role, slug }: { role: AppRole; slug: string }) {
  const [data, setData] = useState<PageData>({ metrics: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sign in to open this page");
      setData(await loadPage(role, slug, auth.user.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Page data could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void reload(); }, [role, slug]);

  if (role === "learner" && slug === "questions") {
    return <QuestionsPage data={data} loading={loading} error={error} reload={reload}/>;
  }

  return <div>
    <div className="page-head"><div><p className="eyebrow">{role === "guardian" ? "guardian / parent" : role} workspace</p><h1>{titles[role][slug] ?? "Workspace"}</h1></div><button className="button secondary" onClick={() => void reload()}>Refresh</button></div>
    {error && <p className="error">{error}</p>}
    {loading && <p className="form-message">Loading current platform data…</p>}
    {data.metrics.length > 0 && <MetricCards items={data.metrics}/>} 
    {data.note && <p className="page-note">{data.note}</p>}
    <DataView role={role} slug={slug} rows={data.rows}/>
  </div>;
}

function MetricCards({ items }: { items: Metric[] }) {
  return <div className="stats">{items.map((item) => <article key={item.label}><small>{item.label}</small><strong>{item.value}</strong><span>{item.detail}</span></article>)}</div>;
}

function DataView({ role, slug, rows }: { role: AppRole; slug: string; rows: Row[] }) {
  if (!rows.length) return <section className="panel empty-state"><h2>No records yet</h2><p>New activity will appear here as Learnzurr is used.</p></section>;

  if (slug === "calendar") return <div className="timeline">{rows.map((row) => <article className="panel" key={String(row.id)}><time>{formatDate(row.starts_at)}</time><div><h2>{String(row.name ?? "Live class")}</h2><p>{formatDateTime(row.starts_at)} – {formatTime(row.ends_at)}</p></div><a className="button primary" href={`/live/${String(row.id)}`}>Join</a></article>)}</div>;

  if (slug === "progress") return <div className="list-grid">{rows.map((row, index) => <article className="panel" key={String(row.class_id ?? index)}><h2>{String(row.class_title ?? "Class progress")}</h2><div className="progress-bar"><i style={{ width: `${Number(row.completion_percent ?? 0)}%` }}/></div><p>{Number(row.completion_percent ?? 0)}% complete · Quiz average {Number(row.quiz_average ?? 0)}%</p></article>)}</div>;

  if (slug === "payments") return <div className="panel table-wrap"><table><thead><tr><th>Reference</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{rows.map((row) => <tr key={String(row.id ?? row.paystack_reference)}><td>{String(row.paystack_reference ?? "—")}</td><td>KES {Number(row.amount_kes ?? 0).toLocaleString()}</td><td><span className="status-chip">{String(row.status ?? "pending")}</span></td><td>{formatDateTime(row.paid_at ?? row.created_at)}</td></tr>)}</tbody></table></div>;

  if (["users", "students", "teachers", "children"].includes(slug)) return <div className="panel table-wrap"><table><thead><tr><th>Name</th><th>Role / relationship</th><th>Last login</th><th>Status</th></tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)}><td>{String(row.full_name ?? row.email ?? "Unnamed user")}</td><td>{String(row.role ?? row.relationship ?? "learner")}</td><td>{formatDateTime(row.last_login_at)}</td><td><span className="status-chip">{String(row.status ?? "active")}</span></td></tr>)}</tbody></table></div>;

  return <div className="list-grid">{rows.map((row, index) => <article className="panel" key={String(row.id ?? index)}><div className="section-title"><span className="status-chip">{String(row.kind ?? row.status ?? role)}</span><small>{formatDateTime(row.starts_at ?? row.due_at ?? row.created_at)}</small></div><h2>{String(row.title ?? row.name ?? row.class_title ?? "Learnzurr item")}</h2><p>{String(row.description ?? row.question ?? row.teacher_response ?? row.body_text ?? row.message ?? "Open this item for its full details.")}</p>{Boolean(row.id) && slug === "classes" && role === "learner" && <a className="button secondary" href="/learner/calendar">View live schedule</a>}</article>)}</div>;
}

function QuestionsPage({ data, loading, error, reload }: { data: PageData; loading: boolean; error: string; reload: () => Promise<void> }) {
  const [classes, setClasses] = useState<ClassroomSummary[]>([]);
  const [classId, setClassId] = useState("");
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void api.classes().then((result) => {
      setClasses(result.classes);
      setClassId(result.classes[0]?.id ?? "");
    }).catch(() => undefined);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("Sending question…");
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || !classId) throw new Error("Select an enrolled class");
      const { error: insertError } = await supabase.from("qa_threads").insert({ class_id: classId, author_id: auth.user.id, question });
      if (insertError) throw insertError;
      setQuestion("");
      setStatus("Question sent to the teaching team.");
      await reload();
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : "Question could not be sent");
    }
  }

  return <div><div className="page-head"><div><p className="eyebrow">learner workspace</p><h1>Q&A</h1></div></div>{error && <p className="error">{error}</p>}{loading && <p className="form-message">Loading questions…</p>}<div className="split"><form className="panel" onSubmit={submit}><h2>Ask a question</h2><label>Class<select required value={classId} onChange={(event) => setClassId(event.target.value)}>{classes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Question<textarea required rows={7} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Type your learning question…"/></label><button className="button primary"><Send size={17}/>Send to teacher</button><p className="form-message">{status}</p></form><section className="panel"><h2>Questions and responses</h2>{data.rows.map((row, index) => <article className="activity" key={String(row.id ?? index)}><b>{String(row.question)}</b><small>{row.teacher_response ? `Teacher: ${String(row.teacher_response)}` : "Awaiting teacher response"}</small></article>)}{!data.rows.length && <p className="empty-state">No questions yet.</p>}</section></div></div>;
}

async function loadPage(role: AppRole, slug: string, userId: string): Promise<PageData> {
  if (role === "teacher") return loadTeacherPage(slug);
  if (role === "learner") return loadLearnerPage(slug, userId);
  if (role === "guardian") return loadGuardianPage(slug, userId);
  return loadAdminPage(slug);
}

async function loadTeacherPage(slug: string): Promise<PageData> {
  const dashboard = await api.teacherDashboard();
  const classIds = dashboard.classes.map((item) => item.id);
  if (slug === "students") {
    const result = await api.students();
    return { metrics: metrics(result.students.length, classIds.length, dashboard.teachers.length, "Students", "Classes", "Teachers"), rows: result.students };
  }
  if (slug === "payments") {
    const { data, error } = classIds.length ? await supabase.from("payments").select("id,paystack_reference,amount_kes,status,paid_at,created_at").in("class_id", classIds).order("created_at", { ascending: false }) : { data: [] as Row[], error: null };
    if (error) throw error;
    return { metrics: metrics(`KES ${dashboard.revenue.toLocaleString()}`, data?.length ?? 0, dashboard.teachers.length, "Paid revenue", "Transactions", "Split recipients"), rows: data ?? [], note: "Paystack webhooks record each configured teacher commission split." };
  }
  return { metrics: metrics(dashboard.students, `KES ${dashboard.revenue.toLocaleString()}`, classIds.length, "Students", "Revenue", "Classes"), rows: dashboard.classes.map((item) => ({ ...item, kind: "class", description: "Included in this teacher report." })) };
}

async function learnerClassIds(userId: string) {
  const { data, error } = await supabase.from("student_enrollments").select("class_id").eq("student_id", userId).eq("active", true);
  if (error) throw error;
  return (data ?? []).map((item) => item.class_id);
}

async function loadLearnerPage(slug: string, userId: string): Promise<PageData> {
  const classIds = await learnerClassIds(userId);
  if (slug === "classes") {
    const result = await api.classes();
    return { metrics: metrics(result.classes.length, 50, 2, "My classes", "Max learners", "Max teachers"), rows: result.classes };
  }
  if (slug === "assignments") {
    const result = await api.assignments();
    return { metrics: metrics(result.assignments.length, upcoming(result.assignments), assessed(result.assignments), "All work", "Upcoming", "Assessments"), rows: result.assignments.map(assignmentRow) };
  }
  if (slug === "lessons") {
    const { data, error } = classIds.length ? await supabase.from("lessons").select("id,class_id,title,video_url,metadata,published_at").in("class_id", classIds).order("published_at", { ascending: false }) : { data: [] as Row[], error: null };
    if (error) throw error;
    return { metrics: metrics(data?.length ?? 0, classIds.length, 0, "Recorded lessons", "Classes", "Downloads"), rows: (data ?? []).map((item) => ({ ...item, kind: "lesson", created_at: item.published_at, description: item.video_url ? "Recorded video available" : "Lesson materials available" })) };
  }
  if (slug === "progress") {
    const { data, error } = await supabase.from("progress").select("student_id,class_id,completion_percent,quiz_average,updated_at,classes(title)").eq("student_id", userId);
    if (error) throw error;
    const rows = (data ?? []).map((item: any) => ({ ...item, class_title: item.classes?.title }));
    return { metrics: metrics(average(rows, "completion_percent"), average(rows, "quiz_average"), rows.length, "Completion %", "Quiz average %", "Tracked classes"), rows };
  }
  if (slug === "questions") {
    const { data, error } = await supabase.from("qa_threads").select("id,class_id,question,teacher_response,created_at").eq("author_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return { metrics: metrics(data?.length ?? 0, (data ?? []).filter((item) => item.teacher_response).length, (data ?? []).filter((item) => !item.teacher_response).length, "Questions", "Answered", "Waiting"), rows: data ?? [] };
  }
  if (slug === "calendar") {
    const result = await api.liveSessions();
    return { metrics: metrics(result.sessions.length, classIds.length, 50, "Upcoming sessions", "Classes", "Room capacity"), rows: result.sessions, note: "Joining requires a valid Supabase session and active enrollment." };
  }
  const [assignmentsResult, progressResult, sessionsResult] = await Promise.all([
    api.assignments(),
    supabase.from("progress").select("completion_percent,quiz_average").eq("student_id", userId),
    api.liveSessions(),
  ]);
  return { metrics: metrics(classIds.length, average(progressResult.data ?? [], "completion_percent"), assignmentsResult.assignments.length, "My classes", "Completion %", "Assignments"), rows: sessionsResult.sessions.slice(0, 5), note: "Your dashboard combines enrollment, current work, progress, and upcoming live classes." };
}

async function guardianLinks(userId: string) {
  const { data, error } = await supabase.from("guardian_students").select("student_id,relationship").eq("guardian_id", userId);
  if (error) throw error;
  return data ?? [];
}

async function loadGuardianPage(slug: string, userId: string): Promise<PageData> {
  const links = await guardianLinks(userId);
  const studentIds = links.map((item) => item.student_id);
  if (slug === "children") {
    if (!studentIds.length) return { metrics: metrics(0, 0, 0, "Children", "Recently active", "Alerts"), rows: [] };
    const { data, error } = await supabase.from("profiles").select("id,full_name,role,last_login_at").in("id", studentIds);
    if (error) throw error;
    const rows: Row[] = (data ?? []).map((item) => ({ ...item, relationship: links.find((link) => link.student_id === item.id)?.relationship ?? "guardian" }));
    return { metrics: metrics(rows.length, rows.filter((item) => Boolean(item.last_login_at)).length, 0, "Children", "Recently active", "Alerts"), rows };
  }

  const { data: enrollments, error: enrollmentError } = studentIds.length ? await supabase.from("student_enrollments").select("class_id,student_id").in("student_id", studentIds).eq("active", true) : { data: [] as Row[], error: null };
  if (enrollmentError) throw enrollmentError;
  const classIds = [...new Set((enrollments ?? []).map((item) => String(item.class_id)))];

  if (slug === "classes") {
    if (!classIds.length) return { metrics: metrics(0, studentIds.length, 50, "Classes", "Children", "Max class size"), rows: [] };
    const { data, error } = await supabase.from("classes").select("id,title,description,capacity,created_at").in("id", classIds);
    if (error) throw error;
    return { metrics: metrics(data?.length ?? 0, studentIds.length, 50, "Classes", "Children", "Max class size"), rows: data ?? [] };
  }
  if (slug === "progress") {
    const { data, error } = studentIds.length ? await supabase.from("progress").select("student_id,class_id,completion_percent,quiz_average,updated_at,classes(title)").in("student_id", studentIds) : { data: [] as Row[], error: null };
    if (error) throw error;
    const rows = (data ?? []).map((item: any) => ({ ...item, class_title: item.classes?.title }));
    return { metrics: metrics(average(rows, "completion_percent"), average(rows, "quiz_average"), rows.length, "Completion %", "Quiz average %", "Class records"), rows };
  }
  if (slug === "payments") {
    const { data, error } = await supabase.from("payments").select("id,paystack_reference,amount_kes,status,paid_at,created_at").eq("payer_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    const total = (data ?? []).filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount_kes), 0);
    return { metrics: metrics(`KES ${total.toLocaleString()}`, data?.length ?? 0, (data ?? []).filter((item) => item.status === "pending").length, "Paid", "Transactions", "Pending"), rows: data ?? [] };
  }
  if (slug === "teachers") {
    if (!classIds.length) return { metrics: metrics(0, 0, studentIds.length, "Teachers", "Classes", "Children"), rows: [] };
    const { data: mappings, error } = await supabase.from("class_teachers").select("teacher_id").in("class_id", classIds);
    if (error) throw error;
    const ids = [...new Set((mappings ?? []).map((item) => item.teacher_id))];
    if (!ids.length) return { metrics: metrics(0, classIds.length, studentIds.length, "Teachers", "Classes", "Children"), rows: [] };
    const { data: teachers, error: teacherError } = await supabase.from("profiles").select("id,full_name,role,last_login_at").in("id", ids);
    if (teacherError) throw teacherError;
    return { metrics: metrics(ids.length, classIds.length, studentIds.length, "Teachers", "Classes", "Children"), rows: teachers ?? [] };
  }
  if (slug === "messages") {
    const { data, error } = await supabase.from("notifications").select("id,title,body,kind,action_url,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return { metrics: metrics(data?.length ?? 0, (data ?? []).filter((item) => !item.read_at).length, studentIds.length, "Messages", "Unread", "Children"), rows: (data ?? []).map((item) => ({ ...item, message: item.body })) };
  }
  const { data: progress } = studentIds.length ? await supabase.from("progress").select("completion_percent,quiz_average").in("student_id", studentIds) : { data: [] as Row[] };
  return { metrics: metrics(studentIds.length, classIds.length, average(progress ?? [], "completion_percent"), "Children", "Classes", "Completion %"), rows: [], note: "Guardian access is limited to linked learners and their learning activity." };
}

async function loadAdminPage(slug: string): Promise<PageData> {
  const [profiles, classes, payments, teams] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,role,last_login_at,created_at").order("created_at", { ascending: false }),
    supabase.from("classes").select("id,title,description,capacity,created_at").order("created_at", { ascending: false }),
    supabase.from("payments").select("id,paystack_reference,amount_kes,status,paid_at,created_at").order("created_at", { ascending: false }),
    supabase.from("teacher_teams").select("id,name,owner_id,created_at").order("created_at", { ascending: false }),
  ]);
  for (const result of [profiles, classes, payments, teams]) if (result.error) throw result.error;
  const paid = (payments.data ?? []).filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount_kes), 0);
  if (slug === "users") return { metrics: metrics(profiles.data?.length ?? 0, (profiles.data ?? []).filter((item) => item.role === "teacher").length, (profiles.data ?? []).filter((item) => item.role === "learner").length, "All users", "Teachers", "Learners"), rows: profiles.data ?? [] };
  if (slug === "classes") return { metrics: metrics(classes.data?.length ?? 0, 50, 2, "Classes", "Max learners", "Max teachers"), rows: classes.data ?? [] };
  if (slug === "payments") return { metrics: metrics(`KES ${paid.toLocaleString()}`, payments.data?.length ?? 0, (payments.data ?? []).filter((item) => item.status === "pending").length, "Paid volume", "Transactions", "Pending"), rows: payments.data ?? [] };
  if (slug === "teams") return { metrics: metrics(teams.data?.length ?? 0, (profiles.data ?? []).filter((item) => item.role === "teacher").length, classes.data?.length ?? 0, "Teaching teams", "Teachers", "Classes"), rows: (teams.data ?? []).map((item) => ({ ...item, kind: "team", description: "Teacher revenue-sharing team" })) };
  if (slug === "content") {
    const [lessons, assignments, questions] = await Promise.all([
      supabase.from("lessons").select("id,title,published_at").order("published_at", { ascending: false }),
      supabase.from("assignments").select("id,title,kind,due_at").order("due_at", { ascending: false, nullsFirst: false }),
      supabase.from("qa_threads").select("id,question,teacher_response,created_at").order("created_at", { ascending: false }),
    ]);
    return { metrics: metrics(lessons.data?.length ?? 0, assignments.data?.length ?? 0, questions.data?.length ?? 0, "Lessons", "Assignments", "Q&A threads"), rows: [...(lessons.data ?? []).map((item) => ({ ...item, kind: "lesson", created_at: item.published_at })), ...(assignments.data ?? []), ...(questions.data ?? []).map((item) => ({ ...item, title: item.question, kind: "question" }))] };
  }
  return { metrics: metrics(profiles.data?.length ?? 0, classes.data?.length ?? 0, `KES ${paid.toLocaleString()}`, "Users", "Classes", "Revenue"), rows: teams.data ?? [], note: slug === "reports" ? "Admin reports combine users, classes, teams, content, and Paystack revenue." : "Platform health and operations are available across the admin pages." };
}

function metrics(first: string | number, second: string | number, third: string | number, firstLabel: string, secondLabel: string, thirdLabel: string): Metric[] {
  return [
    { label: firstLabel, value: first, detail: "Current platform value" },
    { label: secondLabel, value: second, detail: "Updated from Supabase" },
    { label: thirdLabel, value: third, detail: "Role-scoped result" },
  ];
}
function average(rows: Row[], key: string) {
  return rows.length ? Math.round(rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0) / rows.length) : 0;
}
function upcoming(items: AssignmentSummary[]) {
  return items.filter((item) => item.due_at && new Date(item.due_at) > new Date()).length;
}
function assessed(items: AssignmentSummary[]) {
  return items.filter((item) => item.kind === "assessment" || item.kind === "exam").length;
}
function assignmentRow(item: AssignmentSummary): Row {
  return { ...item, description: item.body?.html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Open this learning work for instructions." };
}
function formatDate(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  return date && !Number.isNaN(date.valueOf()) ? date.toLocaleDateString() : "—";
}
function formatTime(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  return date && !Number.isNaN(date.valueOf()) ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
}
function formatDateTime(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  return date && !Number.isNaN(date.valueOf()) ? date.toLocaleString() : "—";
}
