import { FormEvent, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BookOpen, CalendarDays, CheckCircle2, ClipboardList, CreditCard, LayoutDashboard, LogOut, Menu, MessageSquare, Settings, ShieldCheck, Users, Video, WalletCards } from "lucide-react";
import { supabase, type AppRole } from "./lib/supabase";
import { api } from "./lib/api";
import { LiveClassroom } from "./features/live/LiveClassroom";
import { TeacherClasses, TeacherDashboard, TeacherTeam } from "./features/teacher/TeacherPages";

const pages: Record<AppRole, { slug: string; label: string; icon: typeof LayoutDashboard }[]> = {
  teacher: [
    { slug: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { slug: "team", label: "Team", icon: Users },
    { slug: "classes", label: "Classes", icon: Video }, { slug: "assignments", label: "Assignments", icon: ClipboardList },
    { slug: "students", label: "Students", icon: BookOpen }, { slug: "payments", label: "Payments", icon: WalletCards },
    { slug: "reports", label: "Reports", icon: CheckCircle2 }, { slug: "settings", label: "Settings", icon: Settings },
  ],
  learner: [
    { slug: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { slug: "classes", label: "My classes", icon: Video },
    { slug: "assignments", label: "Assignments", icon: ClipboardList }, { slug: "lessons", label: "Lessons", icon: BookOpen },
    { slug: "progress", label: "Progress", icon: CheckCircle2 }, { slug: "questions", label: "Q&A", icon: MessageSquare },
    { slug: "calendar", label: "Calendar", icon: CalendarDays }, { slug: "settings", label: "Settings", icon: Settings },
  ],
  guardian: [
    { slug: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { slug: "children", label: "Children", icon: Users },
    { slug: "classes", label: "Classes", icon: Video }, { slug: "progress", label: "Progress", icon: CheckCircle2 },
    { slug: "payments", label: "Payments", icon: CreditCard }, { slug: "teachers", label: "Teachers", icon: BookOpen },
    { slug: "messages", label: "Messages", icon: MessageSquare }, { slug: "settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { slug: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { slug: "users", label: "Users", icon: Users },
    { slug: "classes", label: "Classes", icon: Video }, { slug: "payments", label: "Payments", icon: WalletCards },
    { slug: "teams", label: "Teacher teams", icon: ShieldCheck }, { slug: "reports", label: "Reports", icon: CheckCircle2 },
    { slug: "content", label: "Content", icon: BookOpen }, { slug: "settings", label: "Settings", icon: Settings },
  ],
};

function AuthPage({ mode, role }: { mode: "signin" | "signup"; role?: AppRole }) {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const invitedEmail = search.get("email");
  const invitedTeam = search.get("team");
  const isTeacherInvite = mode === "signup" && role === "teacher" && Boolean(invitedEmail && invitedTeam);
  const [form, setForm] = useState({ name: "", email: invitedEmail ?? "", password: "", phone: "", school: "", childName: "", organisation: "" });
  const [message, setMessage] = useState(isTeacherInvite ? "Invitation recognized. Add your name and choose a password." : "");

  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage("Working…");
    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) return setMessage(error.message);
      if (!data.user?.email_confirmed_at) return setMessage("Verify your email before signing in.");
      navigate(`/${(data.user.user_metadata.role ?? "learner") as AppRole}/dashboard`);
      return;
    }
    const metadata = { role, full_name: form.name, phone: form.phone, school: form.school, child_name: form.childName, organisation: form.organisation, team_id: invitedTeam ?? undefined };
    if (isTeacherInvite) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return setMessage("Open this page from the secure invitation email so the invitation session can be verified.");
      const { error: updateError } = await supabase.auth.updateUser({ password: form.password, data: metadata });
      if (updateError) return setMessage(updateError.message);
      const { error: acceptanceError } = await supabase.rpc("accept_teacher_invite");
      if (acceptanceError) return setMessage(acceptanceError.message);
      navigate("/teacher/dashboard");
      return;
    }
    const { error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { emailRedirectTo: `${location.origin}/signin?verified=1`, data: metadata } });
    setMessage(error ? error.message : "Verification email sent. Open the link, then return to the shared sign-in page.");
  }

  return <div className="auth-shell"><section className="auth-copy"><a className="brand" href="/"><span>L</span>Learnzurr</a><h1>{mode === "signin" ? "Welcome back" : isTeacherInvite ? "Complete teacher signup" : `Create your ${role} account`}</h1><p>{mode === "signin" ? "One secure sign-in for teachers, learners, guardians, and administrators." : isTeacherInvite ? `Create your password to join the teaching team. Your invited email and revenue share are already attached.` : "This form is tailored to your role. Email verification is required before dashboard access."}</p></section><form className="auth-card" onSubmit={submit}>
    {mode === "signup" && <label>Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label>}
    <label>Email<input required type="email" readOnly={Boolean(invitedEmail)} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/></label>
    {mode === "signup" && role === "teacher" && !isTeacherInvite && <label>School or team<input value={form.school} onChange={(event) => setForm({ ...form, school: event.target.value })}/></label>}
    {mode === "signup" && role === "guardian" && <label>Child name<input value={form.childName} onChange={(event) => setForm({ ...form, childName: event.target.value })}/></label>}
    {mode === "signup" && role === "learner" && <label>Guardian phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })}/></label>}
    {mode === "signup" && role === "admin" && <label>Organisation<input value={form.organisation} onChange={(event) => setForm({ ...form, organisation: event.target.value })}/></label>}
    <label>{isTeacherInvite ? "Create password" : "Password"}<input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })}/></label>
    <button className="button primary wide">{mode === "signin" ? "Sign in" : isTeacherInvite ? "Complete signup" : "Create account"}</button><p className="form-message">{message}</p>
    {mode === "signin" ? <p>New here? <a href="/signup">Choose account type</a></p> : <p>Already registered? <a href="/signin">Sign in</a></p>}
  </form></div>;
}

function SignupChooser() {
  return <div className="chooser"><a className="brand" href="/"><span>L</span>Learnzurr</a><h1>How will you use Learnzurr?</h1><div className="role-grid">{(["teacher", "learner", "guardian", "admin"] as AppRole[]).map((role) => <a key={role} className="role-card" href={`/signup/${role}`}><Users/><h2>{role === "guardian" ? "Guardian / Parent" : role}</h2><p>Continue with role-specific details, permissions, and verification.</p></a>)}</div></div>;
}

function TeacherClassesLoader() {
  const [classes, setClasses] = useState<{ id: string; title: string }[]>([]);
  const [message, setMessage] = useState("Loading classes…");
  useEffect(() => { api.teacherDashboard().then((result) => { setClasses(result.classes); setMessage(""); }).catch((error) => setMessage(error.message)); }, []);
  if (message) return <p className="form-message">{message}</p>;
  return <TeacherClasses classes={classes}/>;
}

function TeacherTeamLoader({ metadataTeamId }: { metadataTeamId?: string }) {
  const [teamId, setTeamId] = useState(metadataTeamId);
  const [message, setMessage] = useState(metadataTeamId ? "" : "Loading team…");
  useEffect(() => {
    if (metadataTeamId) return;
    api.teacherDashboard().then((result: any) => { setTeamId(result.teams?.[0]?.id); setMessage(result.teams?.length ? "" : "Create a teacher team before inviting staff."); }).catch((error) => setMessage(error.message));
  }, [metadataTeamId]);
  if (!teamId && message) return <p className="form-message">{message}</p>;
  return <TeacherTeam teamId={teamId}/>;
}

function RolePage({ role, slug }: { role: AppRole; slug: string }) {
  const [userMetadata, setUserMetadata] = useState<Record<string, any>>({});
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserMetadata(data.user?.user_metadata ?? {})); }, []);
  if (role === "teacher" && slug === "dashboard") return <TeacherDashboard/>;
  if (role === "teacher" && slug === "team") return <TeacherTeamLoader metadataTeamId={userMetadata.team_id}/>;
  if (role === "teacher" && (slug === "classes" || slug === "assignments")) return <TeacherClassesLoader/>;
  if (slug === "settings") return <SettingsPage/>;
  return <GenericPage role={role} title={pages[role].find((item) => item.slug === slug)?.label ?? "Dashboard"}/>;
}

function GenericPage({ role, title }: { role: AppRole; title: string }) {
  const descriptions: Record<AppRole, string> = {
    teacher: "Manage learners, classes, assessment work, revenue, and team collaboration.", learner: "Join live classes, complete assignments, review lessons, ask questions, and track progress.", guardian: "Follow each child’s classes, progress, payments, teachers, and messages.", admin: "Manage users, teacher teams, classes, payments, reports, content, and platform settings.",
  };
  return <div><div className="page-head"><div><p className="eyebrow">{role} workspace</p><h1>{title}</h1></div><button className="button primary">Quick action</button></div><div className="stats"><article><small>Active learners</small><strong>128</strong><span>Current platform data</span></article><article><small>Completion</small><strong>84%</strong><span>Across active classes</span></article><article><small>Revenue</small><strong>KES 248k</strong><span>Paystack verified</span></article></div><div className="cards"><article className="panel"><h2>{title}</h2><p>{descriptions[role]}</p></article><article className="panel"><h2>Recent activity</h2>{["New learner enrolled", "Assessment results published", "Payment commission split completed"].map((item) => <p className="activity" key={item}>{item}<small>Recently</small></p>)}</article></div></div>;
}

function SettingsPage() {
  const [status, setStatus] = useState("");
  async function enablePush() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("Push notifications are not supported in this browser");
      const registration = await navigator.serviceWorker.register("/push-worker.js");
      if (await Notification.requestPermission() !== "granted") throw new Error("Notification permission was not granted");
      const key = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
      if (!key) throw new Error("VITE_VAPID_PUBLIC_KEY is not configured");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64Key(key) });
      await api.subscribePush(subscription.toJSON());
      setStatus("Web push notifications enabled for scheduled classes.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Push setup failed"); }
  }
  return <div><div className="page-head"><div><p className="eyebrow">Account</p><h1>Settings</h1></div></div><section className="panel"><h2>Class notifications</h2><p>Enable browser push so scheduled classes can display a join notification even when Learnzurr is not open.</p><button className="button primary" onClick={enablePush}>Enable web push</button><p>{status}</p></section></div>;
}

function base64Key(value: string) {
  const raw = atob((value + "=".repeat((4 - value.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function Dashboard() {
  const { role = "learner", page = "dashboard" } = useParams();
  const appRole = (role in pages ? role : "learner") as AppRole;
  const [mobile, setMobile] = useState(false);
  const navigate = useNavigate();
  const items = useMemo(() => pages[appRole], [appRole]);
  return <div className="app-shell"><aside className={mobile ? "sidebar open" : "sidebar"}><a className="brand" href="/"><span>L</span>Learnzurr</a><p className="role-pill">{appRole}</p><nav>{items.map(({ slug, label, icon: Icon }) => <button className={page === slug ? "active" : ""} key={slug} onClick={() => { navigate(`/${appRole}/${slug}`); setMobile(false); }}><Icon size={19}/>{label}</button>)}</nav><button className="logout" onClick={() => supabase.auth.signOut().then(() => navigate("/signin"))}><LogOut size={18}/>Sign out</button></aside><main className="workspace"><header><button className="menu" onClick={() => setMobile(!mobile)}><Menu/></button><div><b>Good day</b><small>Your role-specific Learnzurr workspace.</small></div><span className="avatar">L</span></header><section className="page"><RolePage role={appRole} slug={page}/></section></main></div>;
}

function LiveRoute() {
  const { sessionId = "" } = useParams();
  const [search] = useSearchParams();
  const token = search.get("token") ?? "";
  return token ? <LiveClassroom sessionId={sessionId} token={token}/> : <Navigate to="/signin" replace/>;
}

function AppRoutes() {
  return <Routes><Route path="/" element={<Navigate to="/signin" replace/>}/><Route path="/signin" element={<AuthPage mode="signin"/>}/><Route path="/signup" element={<SignupChooser/>}/>{(["teacher", "learner", "guardian", "admin"] as AppRole[]).map((role) => <Route key={role} path={`/signup/${role}`} element={<AuthPage mode="signup" role={role}/>}/>)}<Route path="/live/:sessionId" element={<LiveRoute/>}/><Route path="/:role/:page" element={<Dashboard/>}/><Route path="*" element={<Navigate to="/signin" replace/>}/></Routes>;
}

export default function App() { return <BrowserRouter><AppRoutes/></BrowserRouter>; }
