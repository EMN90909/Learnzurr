"use client";

import React, { useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Building2, Store, ArrowRight, LogOut, LayoutDashboard, Loader2, CheckCircle2, ShieldCheck, Smartphone, Globe, CreditCard, MapPin, Search, Users, Calendar, Truck, Camera, Utensils, Flower2, Music, Hammer, ScrollText, UserCheck, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StrutaLogo } from "@/components/StrutaLogo";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePWA } from "../hooks/use-pwa";
import { showSuccess } from "@/utils/toast";

const Index = () => {
  const { session, profile, loading, signOut } = useAuth();
  const { isInstallable, installApp } = usePWA();
  const navigate = useNavigate();

  const getDashboardPath = useCallback(() => {
    if (!profile?.role) return "/";
    const paths: Record<string, string> = { family: "/family", operations: "/operations", marketplace: "/marketplace", admin: "/admin" };
    return paths[profile.role] || "/family";
  }, [profile]);

  useEffect(() => {
    if (!loading && session && profile) navigate(getDashboardPath(), { replace: true });
  }, [session, profile, loading, navigate, getDashboardPath]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) showSuccess("Struta installed successfully!");
  };

  const services = [
    { name: "Funeral Homes", icon: Building2 }, { name: "Mortuaries", icon: ShieldCheck }, { name: "Tent Hire", icon: Hammer }, { name: "Chairs & Tables", icon: Users }, { name: "Florists", icon: Flower2 }, { name: "Catering", icon: Utensils }, { name: "Transport & Hearse", icon: Truck }, { name: "Photography", icon: Camera }, { name: "Sound Systems", icon: Music }, { name: "Coffin Makers", icon: Hammer }, { name: "Burial Services", icon: MapPin }, { name: "Clergy Support", icon: ScrollText }, { name: "Printing", icon: ScrollText }, { name: "Ushering", icon: UserCheck }, { name: "Embalming", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <nav className="nav-struta">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2"><StrutaLogo size="normal" /><span className="font-head text-2xl font-black text-[var(--ink)]">Struta<em className="not-italic text-[var(--gold)]">.</em></span></Link>
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[9px] font-bold hidden sm:inline-flex">Beta v0.4</Badge>
        </div>
        <div className="flex items-center gap-4">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-[var(--muted)]" /> : session ? <div className="flex items-center gap-4"><Button variant="ghost" onClick={() => navigate(getDashboardPath())} className="font-bold"><LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard</Button><Button variant="ghost" onClick={signOut} className="text-[var(--muted)]"><LogOut className="w-4 h-4 mr-2" /> Sign Out</Button></div> : <Link to="/login" className="btn-struta-primary text-sm">Sign In</Link>}
        </div>
      </nav>

      <section className="pt-40 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-8"><StrutaLogo size="big" /></div>
          <span className="section-tag">The Unified Funeral Ecosystem</span>
          <h1 className="text-[var(--ink)] mb-8 text-5xl md:text-7xl">Honouring lives with<br /><span className="italic text-[var(--gold)]">dignity & care</span></h1>
          <p className="text-xl text-[var(--muted)] max-w-3xl mx-auto mb-10">Struta connects bereaved families with verified funeral homes and service providers across East Africa — removing the chaos of scattered phone calls and last-minute confusion, so you can focus on what truly matters.</p>
          {isInstallable && <div className="flex justify-center mb-10"><Button variant="outline" size="lg" onClick={handleInstall} className="border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold-bg)] font-black rounded-full px-8 h-13 shadow-sm"><Download className="w-5 h-5 mr-2" /> Download Struta App</Button></div>}
          <div className="flex flex-col sm:flex-row justify-center gap-4"><Link to="/signup/family" className="btn-struta-gold h-14 px-8 flex items-center justify-center text-lg">Start Planning</Link><Link to="/providers" className="btn-struta-primary h-14 px-8 flex items-center justify-center text-lg">For Providers</Link></div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[var(--surface)] border-y border-[var(--border)]"><div className="max-w-7xl mx-auto"><div className="text-center mb-16"><span className="section-tag">Simple Process</span><h2 className="text-[var(--ink)] text-4xl">From request to memorial in 5 steps</h2><p className="text-[var(--muted)] mt-4">Designed for bereaved families who need to act fast without any confusion.</p></div><div className="grid grid-cols-1 md:grid-cols-5 gap-8">{[{ step: "01", title: "Create a Request", desc: "Tell us about your loved one, county, budget, and service type." }, { step: "02", title: "Get Matched", desc: "Struta matches you with nearby verified funeral homes instantly." }, { step: "03", title: "Select & Book", desc: "Compare providers, review profiles, and confirm bookings directly." }, { step: "04", title: "Coordinate", desc: "Track all arrangements in one dashboard. Plan group coordination." }, { step: "05", title: "Live Memorial", desc: "Receive a shareable memorial page with condolences and fundraising." }].map((item, i) => <div key={i} className="relative"><span className="text-4xl font-black text-[var(--gold)] opacity-20 mb-4 block">{item.step}</span><h3 className="text-lg font-bold mb-2">{item.title}</h3><p className="text-sm text-[var(--muted)]">{item.desc}</p></div>)}</div></div></section>

      <section className="py-24 px-6"><div className="max-w-7xl mx-auto"><div className="text-center mb-16"><span className="section-tag">Every Service</span><h2 className="text-[var(--ink)] text-4xl">All funeral services, one platform</h2><p className="text-sm md:text-base text-[var(--muted)] max-w-2xl mx-auto mt-3 font-semibold">Services shown depend on what each funeral home or vendor offers, so families only see relevant support options from real providers.</p><p className="text-sm md:text-base text-[var(--muted)] max-w-2xl mx-auto mt-3 font-semibold">Services shown depend on what each funeral home or vendor offers, so families only see relevant support options from real providers.</p><p className="text-sm md:text-base text-[var(--muted)] max-w-2xl mx-auto mt-3 font-semibold">Services shown depend on what each funeral home or vendor offers, so families only see relevant support options from real providers.</p></div><div className="grid grid-cols-2 md:grid-cols-5 gap-4">{services.map((s, i) => <div key={i} className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col items-center text-center hover:border-[var(--gold)] transition-colors"><s.icon className="w-8 h-8 text-[var(--gold)] mb-4" /><span className="text-sm font-bold">{s.name}</span></div>)}</div></div></section>

      <section className="py-24 px-6 bg-[var(--surface)] text-[var(--ink)] border-y border-[var(--border)]"><div className="max-w-7xl mx-auto"><div className="text-center mb-16"><span className="section-tag">Who It's For</span><h2 className="text-4xl text-[var(--ink)]">Built for everyone involved</h2><p className="text-[var(--muted)] mt-4">Choose the path that matches how you use Struta.</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-8">{[{ title: "For Families", desc: "Find verified funeral homes, compare options, book services, and coordinate everything from one calm space.", link: "/signup/family", btn: "Get Started Free" }, { title: "For Funeral Homes", desc: "Manage cases, staff, transport, and client requests from a modern operations dashboard. Grow your business.", link: "/signup/home", btn: "Register Your Home" }, { title: "For Vendors", desc: "List your services, receive quality leads from active families and funeral homes, and manage bookings easily.", link: "/signup/vendor", btn: "Join as Vendor" }].map((item, i) => <div key={i} className="p-10 rounded-3xl border border-[var(--border)] bg-[var(--paper)] shadow-sm flex flex-col"><h3 className="text-2xl font-bold mb-4 text-[var(--ink)]">{item.title}</h3><p className="text-[var(--muted)] mb-8 flex-1">{item.desc}</p><Link to={item.link} className={i === 0 ? "btn-struta-gold text-center" : "btn-struta-primary text-center"}>{item.btn}</Link></div>)}</div></div></section>

      <section className="py-24 px-6"><div className="max-w-7xl mx-auto"><div className="text-center mb-16"><span className="section-tag">Platform Features</span><h2 className="text-4xl">Everything in one place</h2></div><div className="grid grid-cols-1 md:grid-cols-3 gap-12">{[{ title: "Verified Providers", desc: "Every funeral home and vendor is verified before appearing on the platform.", icon: ShieldCheck }, { title: "Instant Matching", desc: "Smart matching by county, budget, and availability. Get results in seconds.", icon: Search }, { title: "Mobile-First", desc: "Fully responsive. Works beautifully on any phone for users in the field.", icon: Smartphone }, { title: "Memorial Pages", desc: "Beautiful shareable pages with obituary, condolences, and fundraising.", icon: Globe }, { title: "ERP Dashboard", desc: "Full operations management— cases, staff, transport, and team chat.", icon: LayoutDashboard }, { title: "Mobile Pay", desc: "Manual mobile payment details and Paystack subscription links for simple operations.", icon: CreditCard }].map((f, i) => <div key={i} className="flex gap-6"><div className="w-12 h-12 rounded-2xl bg-[var(--gold-bg)] flex items-center justify-center shrink-0"><f.icon className="w-6 h-6 text-[var(--gold)]" /></div><div><h3 className="text-lg font-bold mb-2">{f.title}</h3><p className="text-sm text-[var(--muted)]">{f.desc}</p></div></div>)}</div></div></section>

      <footer className="py-16 px-6 border-t border-[var(--border)]"><div className="max-w-7xl mx-auto"><div className="text-center mb-12"><h2 className="text-3xl font-black mb-8">Ready to bring order to grief?</h2><div className="flex flex-wrap justify-center gap-4 mb-12"><Link to="/signup/family" className="btn-struta-gold">Create Family Account</Link><Link to="/signup/home" className="btn-struta-primary">Register Funeral Home</Link><Link to="/signup/vendor" className="btn-struta-primary">Register Vendor</Link></div><div className="flex justify-center gap-8 text-sm font-bold text-[var(--muted)] mb-8"><span>Kenya</span><span>Uganda</span><span>Tanzania</span><span>Rwanda</span></div>{isInstallable && <div className="flex justify-center mb-8"><Button variant="outline" size="sm" onClick={handleInstall} className="border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold-bg)] font-bold rounded-full px-6"><Download className="w-4 h-4 mr-2" />Install App</Button></div>}<div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-6"><AlertTriangle className="w-3.5 h-3.5" /><span>Beta Mode: Under active development. Not stable until version 1.0.</span></div></div><div className="border-t border-[var(--border)] pt-8"><div className="flex flex-wrap justify-center gap-8 mb-8"><a href="/about" className="text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors font-medium">About Us</a><a href="/contact" className="text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors font-medium">Contact Us</a><a href="/help" className="text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors font-medium">Help Center</a><a href="/terms" className="text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors font-medium">Terms & Conditions</a><a href="/privacy" className="text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors font-medium">Privacy Policy</a></div><p className="text-xs text-[var(--muted)] text-center">&copy; {new Date().getFullYear()} Struta. All rights reserved.</p></div></div></footer>
    </div>
  );
};

export default Index;
