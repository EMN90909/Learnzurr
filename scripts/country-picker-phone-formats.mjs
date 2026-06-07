import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

const countryBlock = `const phoneCountryOptions = [
  { name: "Kenya", code: "254", label: "Kenya: +254 xxx xxx xxx" },
  { name: "Uganda", code: "256", label: "Uganda: +256 xxx xxx xxx" },
  { name: "Tanzania", code: "255", label: "Tanzania: +255 xxx xxx xxx" },
  { name: "Rwanda", code: "250", label: "Rwanda: +250 xxx xxx xxx" },
];

const getSelectedPhoneCountry = (country: string) => phoneCountryOptions.find((item) => item.name === country) || phoneCountryOptions[0];`;

function patchFamilySignup() {
  const file = "src/features/bereaved/pages/Signup.tsx";
  let src = read(file);
  if (!src) return;
  src = src.replace('Heart, MapPin, Loader2, Info, Globe, AlertTriangle, Eye, EyeOff }', 'Heart, MapPin, Loader2, Info, Globe, AlertTriangle, Eye, EyeOff, MailCheck }');
  if (!src.includes("phoneCountryOptions")) {
    src = src.replace('const isValidEmail = (email: string) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email.trim());', 'const isValidEmail = (email: string) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email.trim());\n\n' + countryBlock);
  }
  src = src.replace('const [agreedToTerms, setAgreedToTerms] = useState(false);', 'const [agreedToTerms, setAgreedToTerms] = useState(false);\n  const [step, setStep] = useState<1 | 2>(1);');
  src = src.replace('const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "" });', 'const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "", country: "Kenya", code: "" });');
  src = src.replace('const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "", country: "Kenya" });', 'const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "", country: "Kenya", code: "" });');
  src = src.replace('const formattedPhone = formatRegionalPhone(formData.phone, location.country || "Kenya");', 'const formattedPhone = formatRegionalPhone(formData.phone, formData.country);');
  src = src.replace('country: location.country || "Kenya",', 'country: formData.country,');
  src = src.replace(/<div className="flex items-center gap-1\.5 mt-2[\s\S]*?Beta Mode v0\.4[\s\S]*?<\/div>/g, "");
  src = src.replace('<div className="space-y-2"><Label htmlFor="phone" className="flex gap-1">Phone Number <Required /></Label><Input id="phone" type="tel" placeholder="+254 712 345 678" required disabled={!isSupported} value={formData.phone} onBlur={(e) => setFormData({ ...formData, phone: formatRegionalPhone(e.target.value, location.country || "Kenya") })} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /><p className="text-[10px] text-[var(--muted)] whitespace-pre-line">{getPhoneHelp()}</p></div>', '<div className="space-y-2"><Label htmlFor="country" className="flex gap-1">Country <Required /></Label><select id="country" disabled={!isSupported} value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value, phone: "" })} className="w-full h-11 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--ink)]">{phoneCountryOptions.map((country) => <option key={country.name} value={country.name}>{country.label}</option>)}</select></div><div className="space-y-2"><Label htmlFor="phone" className="flex gap-1">Phone Number <Required /></Label><Input id="phone" type="tel" placeholder={getSelectedPhoneCountry(formData.country).label} required disabled={!isSupported} value={formData.phone} onBlur={(e) => setFormData({ ...formData, phone: formatRegionalPhone(e.target.value, formData.country) })} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /><p className="text-[11px] font-bold text-[var(--gold)]">Selected: {getSelectedPhoneCountry(formData.country).label}</p></div>');
  src = src.replace(/<p className="text-\[10px\] text-\[var\(--muted\)\] whitespace-pre-line">\{getPhoneHelp\(\)\}<\/p>/g, "");
  src = src.replace('        const { error: profileError } = await supabase.from("user_profiles").upsert({ id: data.user.id, ...baseProfile, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });\n        if (profileError) throw profileError;\n        await convertStoredReferral("family");', '        const { error: profileError } = await supabase.from("user_profiles").upsert({ id: data.user.id, ...baseProfile, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });\n        if (profileError) throw profileError;\n        const otpResponse = await fetch("/api/auth/send-email-otp", {\n          method: "POST",\n          headers: { "Content-Type": "application/json" },\n          body: JSON.stringify({ email, purpose: "signup", userId: data.user.id, fullName: formData.name.trim() }),\n        });\n        const otpData = await otpResponse.json().catch(() => ({}));\n        if (!otpResponse.ok) throw new Error(otpData.error || "Could not send verification code.");');
  src = src.replace('      showSuccess("Account created successfully! Please sign in.");\n      navigate("/login", { replace: true });', '      setFormData((prev) => ({ ...prev, email }));\n      setStep(2);\n      showSuccess("Account created. We sent a verification code to your email.");');
  if (!src.includes('const handleVerifyOtp = async')) {
    src = src.replace('  };\n\n  return (', '  };\n\n  const handleVerifyOtp = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!/^\\d{6}$/.test(formData.code)) return showError("Enter the 6-digit verification code.");\n    setLoading(true);\n    try {\n      const response = await fetch("/api/auth/verify-email-otp", {\n        method: "POST",\n        headers: { "Content-Type": "application/json" },\n        body: JSON.stringify({ email: formData.email.trim().toLowerCase(), purpose: "signup", code: formData.code }),\n      });\n      const data = await response.json().catch(() => ({}));\n      if (!response.ok) throw new Error(data.error || "Could not verify code.");\n      const { error } = await supabase.auth.signInWithPassword({ email: formData.email.trim().toLowerCase(), password: formData.password });\n      if (error) throw error;\n      await convertStoredReferral("family").catch(() => null);\n      showSuccess("Email verified. Welcome to Struta.");\n      navigate("/family", { replace: true });\n    } catch (error: any) {\n      showError(error.message || "Failed to verify code.");\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  return (');
  }
  src = src.replace('<form onSubmit={handleSignup} className="space-y-4">', '{step === 1 ? <form onSubmit={handleSignup} className="space-y-4">');
  src = src.replace('        </form>\n        <p className="mt-3 text-center text-[10px] text-[var(--muted)]"><Required /> required fields. <Optional /> fields appear where available.</p>', '        </form> : <form onSubmit={handleVerifyOtp} className="space-y-4 text-center"><MailCheck className="w-14 h-14 text-[var(--gold)] mx-auto" /><div><h2 className="text-xl font-black text-[var(--ink)]">Verify your email</h2><p className="text-sm text-[var(--muted)] mt-1">Enter the 6-digit code sent to <strong>{formData.email}</strong>.</p></div><Input inputMode="numeric" maxLength={6} className="h-14 text-center text-2xl tracking-[0.35em] font-black" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\\D/g, "").slice(0, 6) })} placeholder="000000" /><Button type="submit" className="w-full btn-struta-primary" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Go to Dashboard"}</Button><Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)} disabled={loading}>Back</Button></form>}\n        <p className="mt-3 text-center text-[10px] text-[var(--muted)]"><Required /> required fields. <Optional /> fields appear where available.</p>');
  write(file, src);
}

function patchSettings(file) {
  let src = read(file);
  if (!src) return;
  src = src.replace(/<SelectItem value="Kenya">Kenya<\/SelectItem>/g, '<SelectItem value="Kenya">Kenya: +254 xxx xxx xxx</SelectItem>');
  src = src.replace(/<SelectItem value="Uganda">Uganda<\/SelectItem>/g, '<SelectItem value="Uganda">Uganda: +256 xxx xxx xxx</SelectItem>');
  src = src.replace(/<SelectItem value="Tanzania">Tanzania<\/SelectItem>/g, '<SelectItem value="Tanzania">Tanzania: +255 xxx xxx xxx</SelectItem>');
  src = src.replace(/<SelectItem value="Rwanda">Rwanda<\/SelectItem>/g, '<SelectItem value="Rwanda">Rwanda: +250 xxx xxx xxx</SelectItem>');
  src = src.replace(/placeholder="\+254 712 345 678"/g, 'placeholder="Phone number"');
  src = src.replace(/placeholder="\+254 700 000 000"/g, 'placeholder="Phone number"');
  src = src.replace(/Beta Mode v0\.4/g, "");
  write(file, src);
}

patchFamilySignup();
patchSettings("src/features/funeral-home/pages/Settings.tsx");
patchSettings("src/features/marketplace/pages/Settings.tsx");
