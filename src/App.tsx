import { useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, CreditCard, ShieldCheck, Sparkles, Users } from "lucide-react";

const features = [
  [BookOpen, "Focused learning", "Lessons, resources, and progress in one clear workspace."],
  [Users, "Designed for every role", "Learners, parents, teachers, and organisations get purpose-built flows."],
  [ShieldCheck, "Reliable by design", "Typed APIs, validated requests, secure checkout, and accessible motion."],
] as const;

export default function App() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("1500");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount: Number(amount), currency: "KES" }),
      });
      const result = await response.json() as { authorizationUrl?: string; error?: string };
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error ?? "Unable to start payment");
      window.location.assign(result.authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payment could not be started");
      setBusy(false);
    }
  }

  return <main>
    <nav className="nav shell"><a className="brand" href="#top"><span>L</span>Learnzurr</a><div className="navlinks"><a href="#platform">Platform</a><a href="#payments">Payments</a><a href="#about">About</a></div><a className="button ghost" href="#payments">Get started</a></nav>
    <section id="top" className="hero shell"><div className="orb orb-one"/><div className="orb orb-two"/>
      <div className="hero-copy reveal"><p className="eyebrow"><Sparkles size={16}/> Modern learning, beautifully connected</p><h1>Make every learning moment <em>move forward.</em></h1><p className="lead">Learnzurr brings classes, resources, progress, and secure payments into one fast experience for learners, families, and educators.</p><div className="actions"><a className="button primary" href="#payments">Start learning <ArrowRight size={18}/></a><a className="button secondary" href="#platform">Explore platform</a></div><div className="trust"><span><CheckCircle2/>TypeScript end to end</span><span><CheckCircle2/>Express + Node.js</span><span><CheckCircle2/>Paystack checkout</span></div></div>
      <div className="hero-card float"><div className="card-head"><span>Learning pulse</span><span className="live">Live</span></div><div className="score"><small>Weekly progress</small><strong>84%</strong><div className="bar"><i/></div></div><div className="mini-grid"><article><small>Lessons</small><b>12</b></article><article><small>Streak</small><b>9 days</b></article></div><div className="lesson"><div className="lesson-icon"><BookOpen/></div><div><small>Up next</small><b>Algebra foundations</b></div><ArrowRight/></div></div>
    </section>
    <section id="platform" className="section shell"><p className="eyebrow">One coherent platform</p><h2>Less friction. More meaningful progress.</h2><div className="feature-grid">{features.map(([Icon,title,text],index)=><article className="feature reveal" style={{animationDelay:`${index*120}ms`}} key={title}><div className="icon"><Icon/></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section id="payments" className="payment-section shell"><div><p className="eyebrow"><CreditCard size={16}/> Secure checkout</p><h2>Pay for learning with Paystack.</h2><p className="lead small">Your Paystack secret key stays on the Express server. Transactions are initialized securely and can be verified by reference.</p></div><form className="pay-card" onSubmit={pay}><label>Email<input required type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com"/></label><label>Amount (KES)<input required min="10" step="1" type="number" value={amount} onChange={event=>setAmount(event.target.value)}/></label><button className="button primary wide" disabled={busy}>{busy?"Opening checkout…":"Continue to Paystack"}<ArrowRight size={18}/></button>{error&&<p className="error" role="alert">{error}</p>}<small className="secure"><ShieldCheck size={15}/>Payment details are handled by Paystack.</small></form></section>
    <footer id="about" className="footer shell"><a className="brand" href="#top"><span>L</span>Learnzurr</a><p>React + Vite frontend. TypeScript + Express backend.</p></footer>
  </main>;
}
