import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ReceiptText } from "lucide-react";

const dashboardForPlan = (plan: string) => {
  if (plan.includes("vendor")) return "/marketplace";
  if (plan.includes("home")) return "/operations";
  return "/family";
};

const billingForPlan = (plan: string) => {
  if (plan.includes("vendor")) return "/marketplace/billing";
  if (plan.includes("home")) return "/operations/billing";
  return "/family";
};

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const plan = params.get("plan") || "pro";
  const provider = params.get("provider") || "paystack";
  const orderId = params.get("orderId") || params.get("token") || "";
  const dashboard = dashboardForPlan(plan);
  const billing = billingForPlan(plan);

  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-6">
      <Card className="max-w-xl w-full rounded-3xl border-[var(--border)] shadow-sm">
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--gold-bg)] text-[var(--gold)]">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold)]">{provider} callback confirmed</p>
            <h1 className="mt-2 text-3xl font-black text-[var(--ink)]">Payment received</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Your {plan.replace(/_/g, " ")} access has been activated. Paystack events, transaction verification, subscription updates, billing plan updates, and disputes are managed by the server webhook/callback flow.
            </p>
            {orderId && <p className="mt-3 text-xs text-slate-400">Order reference: {orderId}</p>}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="btn-struta-primary"><Link to={dashboard}>Go to dashboard</Link></Button>
            <Button asChild variant="outline"><Link to={billing}><ReceiptText className="mr-2 h-4 w-4" />View billing</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
