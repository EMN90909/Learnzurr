import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const readableReason = (reason: string) => reason.replace(/^paystack_/, "").replace(/_/g, " ") || "payment verification failed";

export default function PaymentError() {
  const [params] = useSearchParams();
  const reason = params.get("reason") || "payment_verification_failed";
  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-6">
      <Card className="max-w-xl w-full rounded-3xl border-[var(--border)] shadow-sm">
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-9 w-9" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--ink)]">Payment could not be verified</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              The Paystack callback or webhook could not complete activation because: <strong>{readableReason(reason)}</strong>. Try again from Billing or contact support with this reason.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="btn-struta-primary"><Link to="/operations/billing">Back to billing</Link></Button>
            <Button asChild variant="outline"><Link to="/contact">Contact support</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
