import { type FormEvent, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BookOpen, CalendarDays, CheckCircle2, ClipboardList, CreditCard, LayoutDashboard, LogOut, Menu, MessageSquare, Settings, ShieldCheck, Users, Video, WalletCards } from "lucide-react";
import { supabase, type AppRole } from "./lib/supabase";
import { api, enableWebPush } from "./lib/api";
import { LiveClassroom } from "./features/live/LiveClassroom";
import { PaystackCheckout } from "./features/payments/PaystackCheckout";
import { TeacherClasses, TeacherDashboard, TeacherTeam } from "./features/teacher/TeacherPages";
import { RoleDataPage } from "./features/roles/RolePages";

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
  const [form, setForm] = useState({ name: "", email: invitedEmail ?? "", password: "", phone: "", school: "", childName: "", guardianEmail: "", organisation: "" });
  const [message, setMessage] = useState(isTeacherInvite ? "Invitation recognized. Add your name and choose a password." : "");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("Working…");
    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        if (!data.user?.email_confirmed_at) throw new Error("Verify your email before signing in.");
        navigate(`/${(data.user.user_metadata.role ?? "learner") as AppRole}/dashboard`);
        return;
      }

      const metadata = {
        role,
        full_name: form.name,
        phone: form.phone,
        school: form.school,
        child_name: form.childName,
        guardian_email: form.guardianEmail,
        organisation: form.organisation,
        team_id: invitedTeam ?? undefined,
      };
      if (isTeacherInvite) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) throw new Error("Open this page from the secure invitation email so the invitation session can be verified.");
        const { error: updateError } = await supabase.auth.updateUser({ password: form.password, data: metadata });
        if (updateError) throw updateError;
        const { error: acceptanceError } = await supabase.rpc("accept_teacher_invite");
        if (acceptanceError) throw acceptanceError;
        navigate("/teacher/dashboard");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: `${location.origin}/signin?verified=1`, data: metadata },
      });
      if (error) throw error;
      setMessage("Verification email sent. Open the link, then return to the shared sign-in page.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-shell"><section className="auth-copy"><a className="brand" href="/"><span>L</span>Learnzurr</a><h1>{mode === "signin" ? "Welcome back" : isTeacherInvite ? "Complete teacher signup" : `Create your ${role === "guardian" ? "guardian / parent" : role} account`}</h1><p>{mode === "signin" ? "One secure sign-in for teachers, learners, guardians, and administrators." : isTeacherInvite ? "Create your password to join the teaching team. Your invited email and revenue share are already attached." : "This form is tailored to your role. Email verification is required before dashboard access."}</p></section><form className="auth-card" onSubmit={submit}>
    {mode === "signup" && <label>Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label>}
    <label>Email<input required type="email" readOnly={Boolean(invitedEmail)} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/></label>
    {mode === "signup" && role === "teacher" && !isTeacherInvite && <label>School or team<input value={form.school} onChange={(event) => setForm({ ...form, school: event.target.value })}/></label>}
    {mode === "signup" && role === "guardian" && <label>Child name<input value={form.childName} onChange={(event) => setForm({ ...form, childName: event.target.value })}/></label>}
    {mode === "signup" && role === "learner" && <><label>Guardian email<input type="email" value={form.guardianEmail} onChange={(event) => setForm({ ...form, guardianEmail: event.target.value })}/></label><label>Guardian phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })}/></label></>}
    {mode === "signup" && role === "admin" && <label>Organisation<input required value={form.organisation} onChange={(event) => setForm({ ...form, organisation: event.target.value })}/></label>}
    <label>{isTeacherInvite ? "Create password" : "Password"}<input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })}/></label>
    <button className="button primary wide" disabled={busy}>{busy ? "Working…" : mode === "signin" ? "Sign in" : isTeacherInvite ? "Complete signup" : "Create account"}</button><p className="form-message">{message}</p>
    {mode === "signin" ? <p>New here? <a href="/signup">Choose account type</a></p> : <p>Already registered? <a href="/signin">Sign in</a></p>}
  </form></div>;
}

function SignupChooser() {
  const detail: Record<AppRole, string> = {
    teacher: "Teach classes, invite staff, schedule live rooms, publish work, and receive Paystack commission splits.",
    learner: "Join classes, complete work, watch lessons, ask questions, and track progress.",
    guardian: "Connect children, follow classes and progress, communicate, and manage payments.",
    admin: "Manage users, teacher teams, classes, payments, reports, content, and settings.",
  };
  return <div className="chooser"><a className="brand" href="/"><span>L</span>Learnzurr</a><h1>How will you use Learnzurr?</h1><div className="role-grid">{(["teacher", "learner", "guardian", "admin"] as AppRole[]).map((item) => <a key={item} className="role-card" href={`/signup/${item}`}><Users/><h2>{item === "guardian" ? "Guardian / Parent" : item}</h2><p>{detail[item]}</p></a>)}</div></div>;
}

function TeacherClassesLoader() {
  const [classes, setClasses] = useState<{ id: string; title: string }[]>([]);
  const [message, setMessage] = useState("Loading classes…");
  useEffect(() => { api.teacherDashboard().then((result) => { setClasses(result.classes); setMessage(""); }).catch((error: Error) => setMessage(error.message)); }, []);
  if (message) return <p className="form-message">{message}</p>;
  return <TeacherClasses classes={classes}/>;
}

function TeacherTeamLoader({ metadataTeamId }: { metadataTeamId?: string }) {
  const [teamId, setTeamId] = useState(metadataTeamId);
  const [message, setMessage] = useState(metadataTeamId ? "" : "Loading team…");
  useEffect(() => {
    if (metadataTeamId) return;
    void api.teacherDashboard().then((result) => { setTeamId(result.teams?.[0]?.id); setMessage(result.teams?.length ? "" : "A default teaching team is being prepared."); }).catch((error: Error) => setMessage(error.message));
  }, [metadataTeamId]);
  if (!teamId && message) return <p className="form-message">{message}</p>;
  return <TeacherTeam teamId={teamId}/>;
}

function RolePage({ role, slug }: { role: AppRole; slug: string }) {
  const [userMetadata, setUserMetadata] = useState<Record<string, unknown>>({});
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setUserMetadata(data.user?.user_metadata ?? {})); }, []);
  if (role === "teacher" && slug === "dashboard") return <TeacherDashboard/>;
  if (role === "teacher" && slug === "team") return <TeacherTeamLoader metadataTeamId={typeof userMetadata.team_id === "string" ? userMetadata.team_id : undefined}/>;
  if (role === "teacher" && (slug === "classes" || slug === "assignments")) return <TeacherClassesLoader/>;
  if (role === "guardian" && slug === "payments") return <PaystackCheckout/>;
  if (slug === "settings") return <SettingsPage/>;
  return <RoleDataPage role={role} slug={slug}/>;
}

function SettingsPage() {
  const [status, setStatus] = useState("");
  const [health, setHealth] = useState("");
  useEffect(() => { void api.health().then((result) => setHealth(`API connected · signaling ${result.signaling}`)).catch((error: Error) => setHealth(error.message)); }, []);
  async function enablePush() {
    setStatus("Requesting permission…");
    try {
      await enableWebPush();
      setStatus("Web push notifications are enabled for live-class reminders.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Push setup failed");
    }
  }
  return <div><div className="page-head"><div><p className="eyebrow">Account and device</p><h1>Settings</h1></div></div><div className="split"><section className="panel"><h2>Class notifications</h2><p>Enable browser push so scheduled classes display a join notification even when Learnzurr is not open.</p><button className="button primary" onClick={() => void enablePush()}>Enable web push</button><p className="form-message">{status}</p></section><section className="panel"><h2>Service connection</h2><p>{health || "Checking the API and signaling service…"}</p><p>Supabase authentication sessions are reused for all protected API requests.</p></section></div></div>;
}

function Dashboard() {
  const { role = "learner", page = "dashboard" } = useParams();
  const appRole = (role in pages ? role : "learner") as AppRole;
  const [mobile, setMobile] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const items = useMemo(() => pages[appRole], [appRole]);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const userRole = (data.user?.user_metadata.role ?? "") as AppRole | "";
      if (!data.user) {
        setAuthorized(false);
        navigate("/signin", { replace: true });
        return;
      }
      if (userRole !== appRole && userRole !== "admin") {
        setAuthorized(false);
        navigate(`/${userRole || "learner"}/dashboard`, { replace: true });
        return;
      }
      setAuthorized(true);
    });
  }, [appRole, navigate]);

  if (authorized !== true) return <div className="center-state">Checking your secure dashboard…</div>;
  return <div className="app-shell"><aside className={mobile ? "sidebar open" : "sidebar"}><a className="brand" href={`/${appRole}/dashboard`}><span>L</span>Learnzurr</a><p className="role-pill">{appRole === "guardian" ? "guardian / parent" : appRole}</p><nav>{items.map(({ slug, label, icon: Icon }) => <button className={page === slug ? "active" : ""} key={slug} onClick={() => { navigate(`/${appRole}/${slug}`); setMobile(false); }}><Icon size={19}/>{label}</button>)}</nav><button className="logout" onClick={() => void supabase.auth.signOut().then(() => navigate("/signin"))}><LogOut size={18}/>Sign out</button></aside><main className="workspace"><header><button className="menu" onClick={() => setMobile(!mobile)}><Menu/></button><div><b>Good day</b><small>Your role-specific Learnzurr workspace.</small></div><span className="avatar">L</span></header><section className="page"><RolePage role={appRole} slug={page}/></section></main></div>;
}

function LiveRoute() {
  const { sessionId = "" } = useParams();
  const [search] = useSearchParams();
  return <LiveClassroom sessionId={sessionId} token={search.get("token") ?? ""}/>;
}

function AppRoutes() {
  return <Routes><Route path="/" element={<Navigate to="/signin" replace/>}/><Route path="/signin" element={<AuthPage mode="signin"/>}/><Route path="/signup" element={<SignupChooser/>}/>{(["teacher", "learner", "guardian", "admin"] as AppRole[]).map((role) => <Route key={role} path={`/signup/${role}`} element={<AuthPage mode="signup" role={role}/>}/>)}<Route path="/live/:sessionId" element={<LiveRoute/>}/><Route path="/:role/:page" element={<Dashboard/>}/><Route path="*" element={<Navigate to="/signin" replace/>}/></Routes>;
}

export default function App() { return <BrowserRouter><AppRoutes/></BrowserRouter>; }
