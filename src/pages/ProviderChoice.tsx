import { Link } from "react-router-dom";
import { Building2, Store, ArrowRight } from "lucide-react";
import { StrutaLogo } from "@/components/StrutaLogo";

const ProviderChoice = () => {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5"><StrutaLogo size="big" /></div>
          <p className="section-tag">Provider Registration</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">What are you registering?</h1>
          <p className="text-[var(--muted)] mt-4 max-w-2xl mx-auto">Choose the path that matches your organisation so Struta can set up the right tools for you.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/signup/home" className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm hover:border-[var(--gold)] transition-all">
            <div className="w-14 h-14 rounded-2xl bg-[var(--gold-bg)] text-[var(--gold)] flex items-center justify-center mb-6"><Building2 className="w-7 h-7" /></div>
            <h2 className="text-3xl font-black mb-3">Funeral Home</h2>
            <p className="text-[var(--muted)] mb-8">For funeral homes, mortuaries, parlours, and care providers managing cases, staff, inventory, transport, and family requests.</p>
            <span className="inline-flex items-center font-black text-[var(--gold)]">Register Funeral Home <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></span>
          </Link>
          <Link to="/signup/vendor" className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm hover:border-[var(--gold)] transition-all">
            <div className="w-14 h-14 rounded-2xl bg-[var(--gold-bg)] text-[var(--gold)] flex items-center justify-center mb-6"><Store className="w-7 h-7" /></div>
            <h2 className="text-3xl font-black mb-3">Vendor</h2>
            <p className="text-[var(--muted)] mb-8">For service providers offering tents, chairs, catering, flowers, transport, printing, sound, photography, and other funeral support.</p>
            <span className="inline-flex items-center font-black text-[var(--gold)]">Register Vendor <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></span>
          </Link>
        </div>
        <div className="text-center mt-8"><Link to="/" className="text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)]">Back to home</Link></div>
      </div>
    </div>
  );
};

export default ProviderChoice;
