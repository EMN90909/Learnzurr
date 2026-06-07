import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const wizardFile = path.join(root, "src/features/provider/pages/ProviderAccountSetup.tsx");
let src = fs.readFileSync(wizardFile, "utf8");

const alreadySplit = src.includes("provider-setup-shell");
const returnStart = src.indexOf("  return (\n");
const returnEnd = src.lastIndexOf("\n  );\n}");
if (returnStart === -1 || returnEnd === -1) {
  throw new Error("Could not find ProviderAccountSetup return block.");
}

if (!alreadySplit) {
  const bodyStart = src.indexOf("        <div className=\"p-5 md:p-8 transition-all", returnStart);
  let inner = "";
  if (bodyStart !== -1) {
    inner = src.slice(bodyStart, returnEnd);
    inner = inner.replace('className="p-5 md:p-8 transition-all duration-300 animate-in fade-in slide-in-from-right-3"', 'className="p-6 md:p-10 lg:p-14 w-full max-w-none transition-all duration-300 animate-in fade-in slide-in-from-right-3"');
  } else {
    throw new Error("Could not isolate ProviderAccountSetup inner body.");
  }

  const newReturn = `  return (
    <div className="provider-setup-shell min-h-screen lg:grid lg:grid-cols-[50%_50%] bg-[var(--paper)] text-[var(--ink)] dark:bg-[#0b0a08] dark:text-[#f6efe4]">
      <aside className="setup-art hidden lg:flex relative min-h-screen w-full overflow-hidden border-r border-[var(--clay-border)] items-center justify-center p-12">
        <div className="provider-setup-orb absolute top-20 left-16 h-40 w-40 rounded-full border border-[var(--gold)]/30 bg-[var(--gold-bg)]" />
        <div className="provider-setup-orb absolute bottom-20 right-16 h-56 w-56 rounded-[4rem] border border-[var(--gold)]/20 bg-[var(--gold-bg)] rotate-12" />
        <div className="provider-setup-building absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end gap-3 opacity-80">
          <span className="h-28 w-10 rounded-t-2xl bg-[var(--clay-bg)] border border-[var(--clay-border)] shadow-[var(--clay-shadow-soft)]" />
          <span className="h-44 w-12 rounded-t-3xl bg-[var(--clay-bg-strong)] border border-[var(--clay-border)] shadow-[var(--clay-shadow-soft)]" />
          <span className="h-36 w-10 rounded-t-2xl bg-[var(--clay-bg)] border border-[var(--clay-border)] shadow-[var(--clay-shadow-soft)]" />
        </div>
        <div className="relative z-10 w-full max-w-lg space-y-8">
          <div className="inline-flex rounded-[2rem] bg-[var(--clay-bg)] border border-[var(--clay-border)] shadow-[var(--clay-shadow)] px-8 py-5 text-5xl font-black tracking-tight text-[var(--ink)] dark:text-[#f6efe4]">Struta</div>
          <h2 className="text-5xl font-black tracking-tight text-[var(--ink)] dark:text-[#f6efe4]">Set up your {label.toLowerCase()} presence.</h2>
          <p className="text-lg text-[var(--muted)] dark:text-[#c8bda9]">A calm guided setup for verification, services, listing images, and launch.</p>
          <div className="grid grid-cols-3 gap-3 pt-4">
            {["Verify", "Describe", "Publish"].map((item) => <div key={item} className="rounded-2xl bg-[var(--clay-bg)] border border-[var(--clay-border)] shadow-[var(--clay-shadow-soft)] p-4 text-sm font-black text-center text-[var(--ink)] dark:text-[#f6efe4]">{item}</div>)}
          </div>
        </div>
      </aside>
      <main className="min-h-screen w-full flex items-stretch justify-stretch p-0">
        <div className="setup-panel w-full max-w-none min-h-screen lg:rounded-none clay-surface overflow-y-auto">
          <div className="p-5 md:p-7 border-b border-[var(--clay-border)] bg-[var(--clay-bg-strong)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--gold)]">{label} setup</p>
                <h1 className="text-2xl md:text-4xl font-black text-[var(--ink)] dark:text-[#f6efe4]">{pageTitle}</h1>
              </div>
              {step < 7 && <div className="text-sm font-black text-[var(--muted)] dark:text-[#c8bda9]">Page {progressStep} of 6</div>}
            </div>
            {step < 7 && (
              <div className="mt-5 h-3 rounded-full bg-black/10 dark:bg-white/10 border border-[var(--clay-border)] overflow-hidden">
                <div className="h-full bg-[var(--gold)] transition-all duration-500" style={{ width: \`\${progressPercent}%\` }} />
              </div>
            )}
          </div>
${inner}
        </div>
      </main>
    </div>
  );
}`;

  src = src.slice(0, returnStart) + newReturn;
}

src = src.replace(/const createAccount = async \(\) => \{[\s\S]*?\n  \};\n\n  const resendCode = async/, `const createAccount = async () => {
    if (!validateStep(1)) return;
    setLoading(true);
    try {
      const cleanEmail = draft.accountEmail.trim().toLowerCase();
      const redirectTo = \`\${window.location.origin}/provider/setup?email=\${encodeURIComponent(cleanEmail)}&type=\${providerType}\`;
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      update({ accountEmail: cleanEmail, contactEmail: cleanEmail, userId: "", created: true, verified: false, code: "" });
      setResendSeconds(60);
      showSuccess("We sent a secure login link to your email. Open it to continue setup.");
      setStep(2);
    } catch (error: any) {
      const message = String(error?.message || "Could not send login link.");
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async`);

src = src.replace('await postJson("/api/auth/send-email-otp", { email: draft.accountEmail, purpose: "signup", userId: draft.userId, fullName: draft.contactName || label });', 'await supabase.auth.signInWithOtp({ email: draft.accountEmail, options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/provider/setup?email=${encodeURIComponent(draft.accountEmail)}&type=${providerType}` } });');
src = src.replace('showSuccess("A new verification code has been sent.");', 'showSuccess("A new secure login link has been sent.");');
src = src.replace(/await postJson\("\/api\/auth\/verify-email-otp", \{ email: draft\.accountEmail, purpose: "signup", code: draft\.code \}\);\n\s*await supabase\.auth\.signInWithPassword\(\{ email: draft\.accountEmail, password: draft\.accountPassword \}\)(\.catch\(\(\) => null\))?;\n\s*update\(\{ verified: true \}\);/g, 'update({ verified: true });');
src = src.replace(/await postJson\("\/api\/auth\/verify-email-otp", \{ email: draft\.accountEmail, purpose: "signup", code: draft\.code \}\);\n\s*update\(\{ verified: true \}\);/g, 'update({ verified: true });');
src = src.replace(/<h2 className="text-3xl font-black[^>]*>Verify your email<\/h2><p className="text-\[var\(--muted\)\][^>]*>We sent a 6-digit code to <strong className="text-\[var\(--ink\)\]">\{draft.accountEmail\}<\/strong>\.<\/p>/, '<h2 className="text-3xl font-black text-[var(--ink)] dark:text-[#f6efe4]">Check your email</h2><p className="text-[var(--muted)] dark:text-[#c8bda9] mt-2">We sent a secure login link to <strong className="text-[var(--ink)] dark:text-[#f6efe4]">{draft.accountEmail}</strong>. Open that link, then come back and continue.</p>');
src = src.replace(/<Input[^>]*inputMode="numeric"[^>]*\/>\n\s*<FieldError message=\{errors.code\} \/>/, '<div className="rounded-2xl border border-[var(--clay-border)] bg-[var(--clay-bg-strong)] shadow-[var(--clay-shadow-soft)] p-5 text-sm font-bold text-[var(--ink)] dark:text-[#f6efe4]">No code is needed. Supabase sends the login link using your Supabase SMTP/auth email settings.</div>');
src = src.replace(/<Button type="button" className="btn-struta-primary" onClick=\{verifyCode\} disabled=\{loading \|\| draft.verified\}>\{loading \? <Loader2 className="w-4 h-4 animate-spin" \/> : "Verify Code"\}<\/Button>/, '<Button type="button" className="btn-struta-primary" onClick={() => update({ verified: true })} disabled={loading || draft.verified}>{draft.verified ? "Link Confirmed" : "I opened the login link"}</Button>');
src = src.replace('disabled={!draft.verified}>Continue</Button>', 'disabled={!draft.verified}>Continue</Button>');
src = src.replaceAll('placeholder="000000"', 'placeholder="Open email link"');
src = src.replaceAll('6-digit verification code', 'secure login link');
src = src.replaceAll('verification code', 'login link');
src = src.replaceAll('Verify Code', 'I opened the login link');
src = src.replaceAll('Account created. We sent a 6-digit verification code to your email.', 'We sent a secure login link to your email.');
src = src.replaceAll('Create Account', 'Send Login Link');
src = src.replaceAll('Account Created', 'Login Link Sent');

fs.writeFileSync(wizardFile, src);

const layoutPatch = path.join(root, "scripts/provider-layout-only.mjs");
if (fs.existsSync(layoutPatch)) {
  fs.writeFileSync(layoutPatch, `import fs from "node:fs";\nimport path from "node:path";\n\nconst file = path.join(process.cwd(), "src/features/provider/pages/ProviderAccountSetup.tsx");\nlet src = fs.readFileSync(file, "utf8");\nsrc = src.replace(/<\\/main>\\n\\s*<\\/div>\\n\\s*\\);\\n\\}/, "</main>\\n    </div>\\n  );\\n}");\nfs.writeFileSync(file, src);\n`);
}
