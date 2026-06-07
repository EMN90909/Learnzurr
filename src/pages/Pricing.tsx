import { Link } from "react-router-dom";
import { CheckCircle2, HeartHandshake, Home, Store, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StrutaLogo } from "@/components/StrutaLogo";

const plans = [
  {
    icon: HeartHandshake,
    name: "Families",
    price: "Free",
    note: "For bereaved families coordinating a loved one's send-off.",
    cta: "Start as Family",
    href: "/signup/bereaved",
    features: ["Create memorial pages", "Share pages on WhatsApp", "Find funeral homes and vendors", "Track requests and messages", "AI-assisted obituary drafts"],
  },
  {
    icon: Home,
    name: "Funeral Homes",
    price: "$12.37",
    suffix: "/ month",
    note: "For funeral homes that need requests, staff, cases, and operations tools.",
    cta: "Join as Funeral Home",
    href: "/signup/home",
    popular: true,
    features: ["Operations dashboard", "Request and case management", "Staff ERP access", "Inventory and reports", "Paystack payment activation"],
  },
  {
    icon: Store,
    name: "Vendors",
    price: "$9.27",
    suffix: "/ month",
    note: "For tents, flowers, food, transport, music, printing, and other support vendors.",
    cta: "Join as Vendor",
    href: "/signup/vendor",
    features: ["Marketplace profile", "Catalog and order management", "Staff and inventory tools", "Family request tracking", "Paystack payment activation"],
  },
];

export default function Pricing() {
  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--paper)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3"><StrutaLogo size="small" /><span className="font-black tracking-tight">Struta</span></Link>
          <nav className="hidden items-center gap-6 text-sm font-bold text-[var(--muted)] md:flex">
            <Link to="/about" className="hover:text-[var(--ink)]">About</Link>
            <Link to="/pricing" className="text-[var(--gold)]">Pricing</Link>
            <Link to="/contact" className="hover:text-[var(--ink)]">Contact</Link>
          </nav>
          <Button asChild className="btn-struta-primary"><Link to="/login">Sign in</Link></Button>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 py-20">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_12%,rgba(200,146,58,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(12,11,8,0.05),transparent_30%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">Simple pricing</p>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">A calm platform for families, funeral homes, and vendors.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-[var(--muted)]">
            Families can start free. Providers can unlock Struta Pro tools for managing requests, teams, payments, inventory, and daily operations.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-20 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card key={plan.name} className={`relative rounded-[2rem] border-[var(--border)] bg-[var(--surface)] shadow-sm ${plan.popular ? "ring-2 ring-[var(--gold)]" : ""}`}>
              {plan.popular && <div className="absolute right-5 top-5 rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-black text-[var(--ink)]">Popular</div>}
              <CardContent className="flex h-full flex-col p-7">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--gold-bg)] text-[var(--gold)]"><Icon className="h-7 w-7" /></div>
                <h2 className="mt-6 text-2xl font-black">{plan.name}</h2>
                <p className="mt-2 min-h-[4rem] text-sm font-semibold leading-6 text-[var(--muted)]">{plan.note}</p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  {plan.suffix && <span className="pb-1 text-sm font-bold text-[var(--muted)]">{plan.suffix}</span>}
                </div>
                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm font-bold text-[var(--ink)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />{feature}</li>)}
                </ul>
                <Button asChild className="btn-struta-gold mt-8 w-full"><Link to={plan.href}>{plan.cta}</Link></Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24">
        <div className="grid gap-5 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm md:grid-cols-3">
          <div className="flex gap-4"><ShieldCheck className="h-6 w-6 shrink-0 text-[var(--gold)]" /><div><h3 className="font-black">Secure by default</h3><p className="mt-1 text-sm font-semibold text-[var(--muted)]">Email OTP, role-aware access, and provider billing controls.</p></div></div>
          <div className="flex gap-4"><Sparkles className="h-6 w-6 shrink-0 text-[var(--gold)]" /><div><h3 className="font-black">Free for families</h3><p className="mt-1 text-sm font-semibold text-[var(--muted)]">No family should be blocked from basic coordination tools during grief.</p></div></div>
          <div className="flex gap-4"><CheckCircle2 className="h-6 w-6 shrink-0 text-[var(--gold)]" /><div><h3 className="font-black">Built for East Africa</h3><p className="mt-1 text-sm font-semibold text-[var(--muted)]">A workflow for funeral homes, vendors, and families across the region.</p></div></div>
        </div>
      </section>
    </main>
  );
}
