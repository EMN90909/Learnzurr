import { FormEvent, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { BookOpen, CalendarDays, CheckCircle2, ClipboardList, CreditCard, LayoutDashboard, LogOut, Menu, MessageSquare, Settings, ShieldCheck, Users, Video, WalletCards } from "lucide-react";
import { supabase, type AppRole } from "./lib/supabase";

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
  const [form, setForm] = useState({ name: "", email: new URLSearchParams(location.search).get("email") ?? "", password: "", phone: "", school: "", childName: "" });
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage("Working…");
    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) return setMessage(error.message);
      const assignedRole = (data.user?.user_metadata.role ?? "learner") as AppRole;
      navigate(`/${assignedRole}/dashboard`);
      return;
    }
    const { error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { emailRedirectTo: `${location.origin}/signin`, data: { role, full_name: form.name, phone: form.phone, school: form.school, child_name: form.childName } } });
    setMessage(error ? error.message : "Check your email for the verification link before signing in.");
  }
  return <div className="auth-shell"><section className="auth-copy"><a className="brand" href="/"><span>L</span>Learnzurr</a><h1>{mode === "signin" ? "Welcome back" : `Create your ${role} account`}</h1><p>{mode === "signin" ? "One secure sign-in for every Learnzurr role." : "Verify your email before opening the dashboard."}</p></section><form className="auth-card" onSubmit={submit}>
    {mode === "signup" && <label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>}
    <label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
    {mode === "signup" && role === "teacher" && <label>School or team<input value={form.school} onChange={e=>setForm({...form,school:e.target.value})}/></label>}
    {mode === "signup" && role === "guardian" && <label>Child name<input value={form.childName} onChange={e=>setForm({...form,childName:e.target.value})}/></label>}
    {mode === "signup" && role === "learner" && <label>Guardian phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>}
    <label>Password<input required minLength={8} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
    <button className="button primary wide">{mode === "signin" ? "Sign in" : "Create account"}</button><p>{message}</p>
    {mode === "signin" ? <p>New here? <a href="/signup">Choose an account type</a></p> : <p>Already registered? <a href="/signin">Sign in</a></p>}
  </form></div>;
}

function SignupChooser(){return <div className="chooser"><a className="brand" href="/"><span>L</span>Learnzurr</a><h1>How will you use Learnzurr?</h1><div className="role-grid">{(["teacher","learner","guardian","admin"] as AppRole[]).map(role=><a key={role} className="role-card" href={`/signup/${role}`}><Users/><h2>{role === "guardian" ? "Guardian / Parent" : role}</h2><p>Continue with the fields and permissions designed for this role.</p></a>)}</div></div>}

function Page({role, slug}:{role:AppRole;slug:string}){const title=pages[role].find(p=>p.slug===slug)?.label??"Dashboard";return <div><div className="page-head"><div><p className="eyebrow">{role} workspace</p><h1>{title}</h1></div><button className="button primary">Quick action</button></div><div className="stats"><article><small>Active learners</small><strong>128</strong><span>+12 this month</span></article><article><small>Completion</small><strong>84%</strong><span>Across active classes</span></article><article><small>Revenue</small><strong>KES 248k</strong><span>Paystack verified</span></article></div><div className="cards"><article className="panel"><h2>Recent activity</h2><p>New learner joined a class</p><p>Assessment results published</p><p>Payment split completed</p></article><article className="panel"><h2>Quick access</h2><div className="quick"><button>Schedule class</button><button>Create task</button><button>View reports</button><button>Message team</button></div></article></div></div>}

function Dashboard(){const {role="learner",page="dashboard"}=useParams();const appRole=(role in pages?role:"learner") as AppRole;const [mobile,setMobile]=useState(false);const navigate=useNavigate();const items=useMemo(()=>pages[appRole],[appRole]);return <div className="app-shell"><aside className={mobile?"sidebar open":"sidebar"}><a className="brand" href="/"><span>L</span>Learnzurr</a><p className="role-pill">{appRole}</p><nav>{items.map(({slug,label,icon:Icon})=><button className={page===slug?"active":""} key={slug} onClick={()=>{navigate(`/${appRole}/${slug}`);setMobile(false)}}><Icon size={19}/>{label}</button>)}</nav><button className="logout" onClick={()=>supabase.auth.signOut().then(()=>navigate("/signin"))}><LogOut size={18}/>Sign out</button></aside><main className="workspace"><header><button className="menu" onClick={()=>setMobile(!mobile)}><Menu/></button><div><b>Good day</b><small>Here is what is happening in Learnzurr.</small></div><span className="avatar">L</span></header><section className="page"><Page role={appRole} slug={page}/></section></main></div>}

function AppRoutes(){return <Routes><Route path="/" element={<Navigate to="/signin" replace/>}/><Route path="/signin" element={<AuthPage mode="signin"/>}/><Route path="/signup" element={<SignupChooser/>}/>{(["teacher","learner","guardian","admin"] as AppRole[]).map(role=><Route key={role} path={`/signup/${role}`} element={<AuthPage mode="signup" role={role}/>}/>)}<Route path="/:role/:page" element={<Dashboard/>}/><Route path="*" element={<Navigate to="/signin" replace/>}/></Routes>}
export default function App(){return <BrowserRouter><AppRoutes/></BrowserRouter>}
