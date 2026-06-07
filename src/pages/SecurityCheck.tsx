import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, ShieldCheck, LockKeyhole, MailCheck, FileText, Building2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StrutaLogo } from "@/components/StrutaLogo";

const details: Record<string, { title: string; message: string; icon: any }> = {
  suspended: { title: "Account suspended", message: "This account has been suspended by an administrator. Access is blocked until an admin unblocks it.", icon: AlertTriangle },
  "password-reset": { title: "Password reset required", message: "A password reset was requested for this account. Open the email reset link and choose a new password before accessing the dashboard.", icon: LockKeyhole },
  "email-verification": { title: "Verify your email", message: "Verify your email address before opening your dashboard.", icon: MailCheck },
  terms: { title: "Accept terms of service", message: "Accept Struta's terms of service before accessing dashboard tools.", icon: FileText },
  "business-info": { title: "Business profile incomplete", message: "Add your business name, address, phone number, and PIN before accessing dashboard tools.", icon: Building2 },
  "payment-setup": { title: "Payment setup required", message: "Add payment details so invoices and family requests can show correct payment instructions.", icon: CreditCard },
  onboarding: { title: "Finish onboarding", message: "Complete account setup before accessing dashboard tools.", icon: ShieldCheck },
};

export default function SecurityCheck() {
  const [params] = useSearchParams();
  const reason = params.get("reason") || "onboarding";
  const action = params.get("action") || "/settings";
  const item = details[reason] || details.onboarding;
  const Icon = item.icon;
  return (
    <main className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-5">
      <Card className="max-w-lg w-full rounded-[2rem] border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto w-fit rounded-[1.5rem] bg-[var(--paper)] border border-[var(--border)] px-5 py-4"><StrutaLogo size="big" /></div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--gold-bg)] text-[var(--gold)]"><Icon className="h-8 w-8" /></div>
          <div><p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold)]">Security check</p><h1 className="mt-2 text-3xl font-black text-[var(--ink)]">{item.title}</h1><p className="mt-3 text-sm font-semibold leading-6 text-[var(--muted)]">{item.message}</p></div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center"><Button asChild className="btn-struta-gold"><Link to={action}>Continue</Link></Button><Button asChild variant="outline"><Link to="/login">Back to sign in</Link></Button></div>
        </CardContent>
      </Card>
    </main>
  );
}
