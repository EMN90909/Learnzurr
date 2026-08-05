import { type FormEvent, useEffect, useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { api, type ClassroomSummary } from "../../lib/api";
import { supabase } from "../../lib/supabase";

type Child = { id: string; full_name: string };
type Payment = { id: string; paystack_reference: string; amount_kes: number; status: string; paid_at: string | null; created_at: string };

export function PaystackCheckout() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("1500");
  const [classes, setClasses] = useState<ClassroomSummary[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sign in to manage payments");
    setEmail(auth.user.email ?? "");
    const [{ classes: classRows }, { data: links }, { data: paymentRows, error: paymentError }] = await Promise.all([
      api.classes(),
      supabase.from("guardian_students").select("student_id,profiles!guardian_students_student_id_fkey(id,full_name)").eq("guardian_id", auth.user.id),
      supabase.from("payments").select("id,paystack_reference,amount_kes,status,paid_at,created_at").eq("payer_id", auth.user.id).order("created_at", { ascending: false }),
    ]);
    if (paymentError) throw paymentError;
    const childRows = (links ?? []).map((link: any) => ({ id: link.student_id, full_name: link.profiles?.full_name || "Learner" }));
    setClasses(classRows);
    setChildren(childRows);
    setPayments((paymentRows ?? []) as Payment[]);
    setClassId((current) => current || classRows[0]?.id || "");
    setStudentId((current) => current || childRows[0]?.id || "");
  }

  useEffect(() => {
    void load().catch((error: Error) => setStatus(error.message));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("Opening secure Paystack checkout…");
    try {
      if (!classId || !studentId) throw new Error("Select a child and class");
      const result = await api.initializePayment({
        email,
        amount: Number(amount),
        classId,
        studentId,
      });
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Payment could not be initialized");
      setBusy(false);
    }
  }

  return <div>
    <div className="page-head"><div><p className="eyebrow">Guardian / parent workspace</p><h1>Payments</h1></div></div>
    <div className="split">
      <form className="panel form-panel" onSubmit={submit}>
        <h2><CreditCard size={21}/> Pay for learning</h2>
        <p>Checkout is initialized by the Express backend. The Paystack secret key never enters the browser.</p>
        <label>Parent email<input readOnly value={email}/></label>
        <label>Child<select required value={studentId} onChange={(event) => setStudentId(event.target.value)}>{children.map((child) => <option key={child.id} value={child.id}>{child.full_name}</option>)}</select></label>
        <label>Class<select required value={classId} onChange={(event) => setClassId(event.target.value)}>{classes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label>Amount (KES)<input required type="number" min="10" step="1" value={amount} onChange={(event) => setAmount(event.target.value)}/></label>
        <button className="button primary wide" disabled={busy || !children.length || !classes.length}>{busy ? "Opening checkout…" : "Continue to Paystack"}</button>
        <p className="form-message">{status}</p>
        <small className="secure"><ShieldCheck size={15}/>Successful webhooks create the configured teacher commission splits.</small>
      </form>
      <section className="panel table-wrap">
        <h2>Payment history</h2>
        <table><thead><tr><th>Reference</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td>{payment.paystack_reference}</td><td>KES {Number(payment.amount_kes).toLocaleString()}</td><td><span className="status-chip">{payment.status}</span></td><td>{new Date(payment.paid_at ?? payment.created_at).toLocaleString()}</td></tr>)}</tbody></table>
        {!payments.length && <p className="empty-state">No payments have been started from this guardian account.</p>}
      </section>
    </div>
  </div>;
}
