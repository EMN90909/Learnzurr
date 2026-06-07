import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "src/features/provider/pages/ProviderAccountSetup.tsx");
if (!fs.existsSync(file)) process.exit(0);
let src = fs.readFileSync(file, "utf8");

src = src.replace("linkSent: boolean; linkConfirmed: boolean;", "linkSent: boolean; linkConfirmed: boolean; code: string;");
src = src.replace("linkSent: false, linkConfirmed: false,", "linkSent: false, linkConfirmed: false, code: \"\",");
src = src.replace(/const passwordStrength = strength\(form\.password\);\n/g, "");
src = src.replace(/<div className="rounded-2xl border border-\[var\(--clay-border\)\][\s\S]*?<li>✓ 1 special character<\/li><\/ul><\/div>/g, "");
src = src.replace(/\n\s*else if \(!\/\[\^A-Za-z0-9\]\/\.test\(form\.password\)\) next\.password = "Password must include at least one special character\.";/g, "");
src = src.replace(/if \(target === 2 && !form\.linkConfirmed\) next\.linkConfirmed = "[^"]*";/g, "if (target === 2) { if (!/^\\d{6}$/.test(form.code || \"\")) next.code = \"Enter the 6-digit verification code sent to your email.\"; else if (!form.linkConfirmed) next.linkConfirmed = \"Verify the code before continuing.\"; }");

src = src.replace(/React\.useEffect\(\(\) => \{\n\s*const confirmSession = async \(\) => \{[\s\S]*?\n\s*\}, \[\]\);\n/g, "");

src = src.replace(/const send(LoginLink|Otp) = async \(\) => \{[\s\S]*?\n\s*\};\n\n\s*const goNext =/m, `const sendOtp = async () => {
    if (!validate(1)) return;
    setLoading(true);
    try {
      const email = form.accountEmail.trim().toLowerCase();
      const response = await fetch("/api/auth/provider-account/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: form.password, providerType }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not create account.");
      update({ accountEmail: email, contactEmail: email, linkSent: true, linkConfirmed: false, code: "" });
      setResendSeconds(60);
      setStep(2);
      showSuccess("Account created. We sent a 6-digit verification code to your email.");
    } catch (error: any) {
      const raw = String(error?.message || "Could not create account.").replace(/Auth/gi, "").trim();
      showError(\`Error: \${raw}\`);
      console.error("[Provider email verification error]", error);
      update({ linkSent: false, linkConfirmed: false });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\\d{6}$/.test(form.code || "")) {
      setErrors({ code: "Enter the 6-digit verification code sent to your email." });
      return;
    }
    setLoading(true);
    try {
      const email = form.accountEmail.trim().toLowerCase();
      const response = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "signup", code: form.code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not verify code.");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: form.password });
      if (signInError) throw signInError;
      update({ linkConfirmed: true });
      showSuccess("Email verified successfully.");
    } catch (error: any) {
      const raw = String(error?.message || "Could not verify code.").replace(/Auth/gi, "").trim();
      showError(\`Error: \${raw}\`);
    } finally {
      setLoading(false);
    }
  };

  const goNext =`);

src = src.replace(/\.replace\(\/\/gi, ""\)\.replace\(\/Auth\/gi, ""\)/g, '.replace(/Auth/gi, "")');
src = src.replaceAll("sendLoginLink", "sendOtp");
src = src.replaceAll("Send Login Link", "Send OTP");
src = src.replaceAll("Resend Link", "Resend OTP");
src = src.replaceAll("Check your email", "Verify your email");
src = src.replaceAll("Supabase sent", "We sent");
src = src.replaceAll("Supabase Auth mailer error:", "Error:");
src = src.replaceAll("Supabase Auth OTP error:", "Error:");
src = src.replaceAll("[Supabase magic link error]", "[Provider email verification error]");
src = src.replaceAll("Open the Supabase login link first so your account session exists.", "Verify your email code first so your account session exists.");
src = src.replaceAll("Open the Supabase login link, then confirm here.", "Verify the code before continuing.");
src = src.replaceAll("Supabase sends the login link through your Supabase Auth SMTP/email settings.", "We send a 6-digit verification code using Struta email.");
src = src.replaceAll("secure login link", "6-digit verification code");
src = src.replaceAll("login link", "verification code");
src = src.replaceAll("magic link", "verification code");

src = src.replace(/\{step === 2 && <section className="max-w-2xl mx-auto text-center space-y-5">[\s\S]*?<\/section>\}/, `{step === 2 && <section className="max-w-2xl mx-auto text-center space-y-5"><MailCheck className="w-16 h-16 text-[var(--gold)] mx-auto" /><h2 className="text-3xl font-black text-[var(--ink)] dark:text-[#f6efe4]">Verify your email</h2><p className="font-bold text-[var(--muted)] dark:text-[#c8bda9]">Enter the 6-digit code sent to <strong className="text-[var(--ink)] dark:text-[#f6efe4]">{form.accountEmail}</strong>.</p><Input className="setup-input h-16 rounded-2xl text-center text-3xl font-black tracking-[0.35em]" inputMode="numeric" maxLength={6} value={form.code || ""} onChange={(e) => update({ code: e.target.value.replace(/\\D/g, '').slice(0, 6), linkConfirmed: false })} placeholder="000000" /><FieldError message={errors.code || errors.linkConfirmed} />{form.linkConfirmed && <div className="flex items-center justify-center gap-2 rounded-2xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 p-3 text-green-700 dark:text-green-300 font-black"><CheckCircle2 className="w-5 h-5" /> Email verified</div>}<div className="grid sm:grid-cols-2 gap-3"><Button className="btn-struta-primary" type="button" onClick={verifyOtp} disabled={loading || form.linkConfirmed}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : form.linkConfirmed ? "Verified" : "Verify Code"}</Button><Button type="button" variant="outline" className="rounded-full font-black" onClick={sendOtp} disabled={loading || resendSeconds > 0}>{resendSeconds > 0 ? \`Resend in \${resendSeconds}s\` : "Resend OTP"}</Button></div><div className="flex justify-between pt-3"><Button type="button" variant="outline" className="rounded-full" disabled><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button><Button type="button" className="btn-struta-gold" onClick={goNext} disabled={!form.linkConfirmed}>Continue</Button></div></section>}`);

fs.writeFileSync(file, src);
