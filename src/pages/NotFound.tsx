import { Button } from "@/components/ui/button";
import { StrutaLogo } from "@/components/StrutaLogo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Home, LifeBuoy, Search, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getRoleRedirectPath } from "@/lib/auth";

const helpLinks = [
  { to: "/help", label: "Help center", tooltip: "Open support articles and common account fixes." },
  { to: "/pricing", label: "Plans", tooltip: "Compare family, funeral home, and vendor options." },
  { to: "/contact", label: "Contact", tooltip: "Reach Struta support if the missing link came from an invite or email." },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading || !session || !profile) return;
    const badPath = location.pathname === "/*" || location.pathname === "*" || location.pathname === "/auth/v1/callback";
    if (badPath) {
      const redirectPath = getRoleRedirectPath(profile.role, profile);
      navigate(redirectPath, { replace: true });
    }
  }, [loading, session, profile, location.pathname, navigate]);

  const homePath = profile ? getRoleRedirectPath(profile.role, profile) : "/";

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_12%,rgba(200,146,58,0.18),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(22,146,248,0.12),transparent_26%)]" />
      <section className="max-w-3xl w-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-7 md:p-12 text-center space-y-8">
        <div className="flex justify-center"><StrutaLogo size="big" /></div>
        <div className="space-y-4">
          <p className="section-tag">Page not found</p>
          <h1 className="font-head text-6xl md:text-7xl font-black">404</h1>
          <p className="text-[var(--muted)] max-w-2xl mx-auto text-base md:text-lg">
            We could not find this Struta page. The link may be expired, mistyped, or moved during a recent update.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr] text-left">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--cream)]/60 p-4 text-sm text-[var(--muted)] flex items-start gap-3">
            <Search className="h-5 w-5 text-[var(--gold)] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[var(--ink)]">Requested path</p>
              <p className="break-all font-mono text-xs mt-1">{location.pathname}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--gold-bg)] p-4 text-sm text-[var(--muted)] flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-[var(--gold)] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[var(--ink)]">Secure redirect ready</p>
              <p className="text-xs mt-1">Signed-in users can return to their role dashboard safely.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />Go Back
              </Button>
            </TooltipTrigger>
            <TooltipContent className="clay-tooltip">Return to the previous page in this browser tab.</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="btn-struta-gold" asChild>
                <Link to={homePath}><Home className="w-4 h-4 mr-2" />Return Home</Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="clay-tooltip">Open your safest Struta landing page.</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[var(--border)] pt-6">
          <LifeBuoy className="h-4 w-4 text-[var(--gold)]" />
          {helpLinks.map((link) => (
            <Tooltip key={link.to}>
              <TooltipTrigger asChild>
                <Link to={link.to} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-black text-[var(--muted)] transition hover:-translate-y-0.5 hover:text-[var(--ink)]">
                  {link.label}
                </Link>
              </TooltipTrigger>
              <TooltipContent className="clay-tooltip">{link.tooltip}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </section>
    </main>
  );
};

export default NotFound;
