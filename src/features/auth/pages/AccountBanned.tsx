import { Mail, HelpCircle, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect } from "react";
import { StrutaLogo } from "@/components/StrutaLogo";
import DominoLoader from "@/components/DominoLoader";

export default function AccountBanned() {
  const { signOut, profile, user, loading } = useAuth();

  useEffect(() => {
    document.body.style.backgroundColor = "var(--paper)";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  if (loading) return <DominoLoader message="Checking account status..." fullscreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile && !profile.is_banned) return <Navigate to="/" replace />;

  const displayName = profile?.home_name || profile?.business_name || profile?.full_name || user?.email || "this user";
  const reason = profile?.ban_reason || "policy-related activity connected to this account";
  const until = profile?.banned_until ? new Date(profile.banned_until) : null;
  const daysLeft = until ? Math.max(0, Math.ceil((until.getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="p-6 md:p-8 border-b border-[var(--border)] flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <StrutaLogo size="normal" />
            <span className="font-head text-2xl font-black text-[var(--ink)]">Struta<span className="text-[var(--gold)]">.</span></span>
          </Link>
          <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest border border-red-100">Restricted</span>
        </div>

        <div className="min-h-[430px] flex items-center justify-center p-6 md:p-12 text-center">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <p className="section-tag mx-auto w-fit bg-red-50 text-red-700 border-red-100">Account restricted</p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--ink)]">Access restricted by Struta</h1>
            </div>

            <div className="rounded-3xl bg-[var(--cream)] border border-[var(--border)] p-5 md:p-6 space-y-3">
              <p className="text-base md:text-lg leading-relaxed text-[var(--ink)] font-semibold">
                Service <span className="font-black text-red-700">{displayName}</span> account has been restricted by Struta due to {reason}.
              </p>
              {daysLeft !== null && <p className="text-sm font-bold text-red-700">Time remaining: {daysLeft} day{daysLeft === 1 ? "" : "s"}</p>}
            </div>

            <p className="text-sm md:text-base text-[var(--muted)] leading-relaxed">
              Can contact us to get help in <a href="mailto:info@emtra.top" className="font-black text-[var(--gold)] hover:underline">info@emtra.top</a> or see our help page.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button asChild className="btn-struta-gold h-12 rounded-2xl font-black gap-2"><a href="mailto:info@emtra.top"><Mail className="w-4 h-4" />Contact Us</a></Button>
              <Button asChild variant="outline" className="h-12 rounded-2xl font-black gap-2"><Link to="/help"><HelpCircle className="w-4 h-4" />Help Page</Link></Button>
            </div>

            <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-2xl font-bold" onClick={async () => signOut()}><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
