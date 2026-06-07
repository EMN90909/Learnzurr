import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

const servicePricingUi = '<section className="space-y-4"><div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-[var(--gold)]" /><h4 className="font-black text-[var(--ink)]">Service amounts</h4></div><p className="text-xs font-semibold text-[var(--muted)]">Add the amount you charge for each selected service. These prices appear on the family listing and are used to calculate request totals.</p><div className="grid md:grid-cols-2 gap-3">{form.services.map((name) => <div key={name} className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-3"><Label className="text-xs font-black">{name}</Label><Input type="number" min="0" step="1" value={form.servicePrices[name] || ""} onChange={(e) => update({ servicePrices: { ...form.servicePrices, [name]: e.target.value } })} placeholder="Amount offered" className="mt-2" /></div>))}</div>{!form.services.length && <p className="text-sm text-[var(--muted)] rounded-2xl border border-dashed p-4">Select services above to add their prices.</p>}</section>';

function patchProviderSetupEditor() {
  const file = "src/features/provider/components/ProviderSetupEditor.tsx";
  let src = read(file);
  if (!src || src.includes("servicePrices")) return;

  src = src.replace('type SetupForm = { paymentType: string; paymentNumber: string; paybillAccount: string; businessName: string; phone: string; email: string; about: string; street: string; city: string; state: string; zip: string; listingTitle: string; services: string[]; images: string[]; coverImageUrl: string; };', 'type SetupForm = { paymentType: string; paymentNumber: string; paybillAccount: string; businessName: string; phone: string; email: string; about: string; street: string; city: string; state: string; zip: string; listingTitle: string; services: string[]; servicePrices: Record<string, string>; images: string[]; coverImageUrl: string; };');
  src = src.replace('const emptyForm: SetupForm = { paymentType: "mpesa", paymentNumber: "", paybillAccount: "", businessName: "", phone: "", email: "", about: "", street: "", city: "", state: "", zip: "", listingTitle: "", services: [], images: [], coverImageUrl: "" };', 'const emptyForm: SetupForm = { paymentType: "mpesa", paymentNumber: "", paybillAccount: "", businessName: "", phone: "", email: "", about: "", street: "", city: "", state: "", zip: "", listingTitle: "", services: [], servicePrices: {}, images: [], coverImageUrl: "" };');
  src = src.replace('function readServices(source: any) { const setupServices = source?.provider_setup?.services; if (Array.isArray(setupServices)) return setupServices.map((item: any) => typeof item === "string" ? item : item?.name).filter(Boolean); const servicesOffered = source?.services_offered; if (servicesOffered && typeof servicesOffered === "object") return Object.values(servicesOffered).map((item: any) => item?.label || item?.name).filter(Boolean); return []; }', 'function readServices(source: any) { const setupServices = source?.provider_setup?.services; if (Array.isArray(setupServices)) return setupServices.map((item: any) => typeof item === "string" ? item : item?.name).filter(Boolean); const servicesOffered = source?.services_offered; if (servicesOffered && typeof servicesOffered === "object") return Object.values(servicesOffered).map((item: any) => item?.label || item?.name).filter(Boolean); return []; }\nfunction readServicePrices(source: any) { const prices: Record<string, string> = {}; const setupServices = source?.provider_setup?.services; if (Array.isArray(setupServices)) setupServices.forEach((item: any) => { if (item?.name) prices[item.name] = String(item.price ?? item.amount ?? ""); }); const servicesOffered = source?.services_offered; if (servicesOffered && typeof servicesOffered === "object") Object.values(servicesOffered).forEach((item: any) => { const name = item?.label || item?.name; if (name) prices[name] = String(item?.price ?? item?.amount ?? ""); }); return prices; }');
  src = src.replace('services: readServices(source), images, coverImageUrl:', 'services: readServices(source), servicePrices: readServicePrices(source), images, coverImageUrl:');
  src = src.replace('const services = form.services.map((name) => ({ name, active: true })); const servicesOffered = Object.fromEntries(form.services.map((name) => [slugify(name), { enabled: true, price: 0, label: name }]));', 'const services = form.services.map((name) => ({ name, active: true, price: Number(form.servicePrices[name] || 0), amount: Number(form.servicePrices[name] || 0), currency: "KES" })); const servicesOffered = Object.fromEntries(form.services.map((name) => [slugify(name), { enabled: true, price: Number(form.servicePrices[name] || 0), amount: Number(form.servicePrices[name] || 0), currency: "KES", label: name, name }]));');
  src = src.replace('localStorage.setItem(`business_info_${providerType}_${user.id}`, JSON.stringify({ listing_images: form.images, listing_image: form.images[0] || "", services_offered: servicesOffered, payment_type: form.paymentType, payment_number: form.paymentNumber, paybill_account: form.paybillAccount }));', 'localStorage.setItem(`business_info_${providerType}_${user.id}`, JSON.stringify({ listing_images: form.images, listing_image: form.images[0] || "", services_offered: servicesOffered, service_prices: form.servicePrices, payment_type: form.paymentType, payment_number: form.paymentNumber, paybill_account: form.paybillAccount }));');
  src = src.replace('<section className="space-y-4"><div className="flex items-center gap-2"><ImagePlus', servicePricingUi + '<section className="space-y-4"><div className="flex items-center gap-2"><ImagePlus');
  write(file, src);
}

function patchSearchListings() {
  const file = "src/features/bereaved/pages/Search.tsx";
  let src = read(file);
  if (!src || src.includes('servicePreviewEntries')) return;
  src = src.replace('type ServiceMap = Record<string, { enabled: boolean; price: number }>;','type ServiceMap = Record<string, { enabled: boolean; price: number; amount?: number; currency?: string; label?: string; name?: string }>;');
  src = src.replace('const getCurrencySymbol = (country?: string) => ({ Kenya: "KSh", Uganda: "USh", Tanzania: "TSh", Rwanda: "RWF", Other: "USD" }[country || "Kenya"] || "KSh");', 'const getCurrencySymbol = (country?: string) => ({ Kenya: "KSh", Uganda: "USh", Tanzania: "TSh", Rwanda: "RWF", Other: "USD" }[country || "Kenya"] || "KSh");\nconst getServicePrice = (service: any) => Number(service?.price ?? service?.amount ?? 0);');
  src = src.replace('const ProviderCard = ({ provider, type }: { provider: FuneralHome | Vendor; type: "home" | "vendor" }) => {\n    const name = type === "home" ? (provider as FuneralHome).home_name || provider.full_name || "Funeral Home" : (provider as Vendor).business_name || provider.full_name || "Vendor";\n    const isSuspended = provider.active === false || provider.is_banned === true;', 'const ProviderCard = ({ provider, type }: { provider: FuneralHome | Vendor; type: "home" | "vendor" }) => {\n    const name = type === "home" ? (provider as FuneralHome).home_name || provider.full_name || "Funeral Home" : (provider as Vendor).business_name || provider.full_name || "Vendor";\n    const isSuspended = provider.active === false || provider.is_banned === true;\n    const servicePreviewEntries = Object.entries(provider.services_offered || {}).filter(([, service]) => service?.enabled).slice(0, 3);\n    const currency = getCurrencySymbol(provider.country);');
  src = src.replace('<div className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]"><MapPin className="w-4 h-4" /><span>{provider.county || "Unknown county"}{provider.sub_county ? `, ${provider.sub_county}` : ""}{provider.town ? `, ${provider.town}` : ""}</span></div></div><Button', '<div className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]"><MapPin className="w-4 h-4" /><span>{provider.county || "Unknown county"}{provider.sub_county ? `, ${provider.sub_county}` : ""}{provider.town ? `, ${provider.town}` : ""}</span></div>{servicePreviewEntries.length > 0 && <div className="mt-4 space-y-1.5">{servicePreviewEntries.map(([id, service]) => <div key={id} className="flex items-center justify-between gap-2 text-xs rounded-xl bg-[var(--cream)] border border-[var(--border)] px-3 py-2"><span className="font-bold truncate">{service.label || service.name || getServiceLabel(id, type)}</span><span className="font-black text-[var(--gold)] whitespace-nowrap">{currency} {getServicePrice(service).toLocaleString()}</span></div>)}</div>}</div><Button');
  src = src.replace('Number(s.price || 0).toLocaleString()', 'getServicePrice(s).toLocaleString()');
  src = src.replace('Number(servicesList[id]?.price || 0)', 'getServicePrice(servicesList[id])');
  src = src.replace(/servicesList\[id\]\?\.price \|\| 0/g, 'getServicePrice(servicesList[id])');
  write(file, src);
}

function patchLoginCleanup() {
  const file = "src/features/auth/pages/Login.tsx";
  let src = read(file);
  if (!src) return;
  src = src.replace(/, ShieldCheck/g, "");
  src = src.replace(/\nconst OTP_PENDING_KEY = "struta_pending_signin_otp";\n/g, "\n");
  src = src.replace(/\ntype LoginStep = "credentials" \| "otp";\n/g, "\n");
  src = src.replace(/\n  const \[step, setStep\] = useState<LoginStep>\("credentials"\);/g, "");
  src = src.replace(/\n  const \[otpCode, setOtpCode\] = useState\(""\);/g, "");
  src = src.replace(/  useEffect\(\(\) => \{[\s\S]*?\n  \}, \[profile, loading, navigate\]\);/, '  useEffect(() => {\n    localStorage.removeItem("struta_pending_signin_otp");\n    if (!loading && profile) navigate(getRoleRedirectPath(profile.role, profile), { replace: true });\n  }, [profile, loading, navigate]);');
  src = src.replace(/\n  const postJson = async \(url: string, body: Record<string, unknown>\) => \{[\s\S]*?\n  \};\n\n  const sendSigninOtp = async \(cleanEmail: string, userId\?: string, fullName\?: string\) => \{[\s\S]*?\n  \};\n/g, "\n");
  src = src.replace(/\n\s*if \(step === "otp"\) return verifyEmailOtp\(e\);\n/g, "\n");
  src = src.replace(/\n\s*await sendSigninOtp\([\s\S]*?showSuccess\("OTP sent to your email\."\);/g, '\n      showSuccess("Signed in successfully!");');
  src = src.replace(/\n  const verifyEmailOtp = async \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n\n  const resendOtp = async \(\) => \{[\s\S]*?\n  \};\n\n  const resetDetails = \(\) => \{[\s\S]*?\n  \};\n/g, "\n");
  src = src.replace(/Enter your email and password\. We will ask for the OTP in the same form\./g, "Enter your email and password to open your dashboard.");
  src = src.replace(/\s+disabled=\{step === "otp" && authLoading\}/g, "");
  src = src.replace(/\n\s*\{step === "otp" && \([\s\S]*?\n\s*\)\}\n/g, "\n");
  src = src.replace(/step === "otp" \? "Verify & Open Dashboard" : "Continue"/g, '"Sign In"');
  write(file, src);
}

function patchPushRoutes() {
  const file = "server/index.ts";
  let src = read(file);
  if (!src || src.includes('/api/push/vapid-public-key')) return;
  const route = `
app.get("/api/push/vapid-public-key", (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || "" });
});

app.post("/api/push/subscribe", async (req, res) => {
  try {
    const userId = sanitizeText(req.body?.userId, 120);
    const role = sanitizeText(req.body?.role, 40);
    const subscription = req.body?.subscription;
    if (!userId || !subscription?.endpoint) return res.status(400).json({ error: "Missing push subscription." });
    const { error } = await supabaseAdmin.from("push_subscriptions").upsert({ user_id: userId, role, endpoint: subscription.endpoint, subscription, user_agent: req.headers["user-agent"] || null, updated_at: new Date().toISOString() }, { onConflict: "endpoint" });
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    console.error("[push/subscribe]", error);
    res.status(500).json({ error: "Could not save push subscription." });
  }
});

app.post("/api/push/send-to-user", async (req, res) => {
  try {
    const receiverId = sanitizeText(req.body?.receiverId, 120);
    const payload = req.body?.payload || {};
    if (!receiverId) return res.status(400).json({ error: "Missing receiver." });
    const { data, error } = await supabaseAdmin.from("push_subscriptions").select("subscription,endpoint").eq("user_id", receiverId);
    if (error) throw error;
    const webpush = await import("web-push");
    const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || "";
    const privateKey = process.env.VAPID_PRIVATE_KEY || "";
    const subject = process.env.VAPID_SUBJECT || "mailto:info@emtra.top";
    if (!publicKey || !privateKey) return res.status(200).json({ ok: false, skipped: true, reason: "VAPID not configured" });
    webpush.default.setVapidDetails(subject, publicKey, privateKey);
    const results = await Promise.allSettled((data || []).map((row: any) => webpush.default.sendNotification(row.subscription, JSON.stringify(payload))));
    res.json({ ok: true, sent: results.filter((r) => r.status === "fulfilled").length, failed: results.filter((r) => r.status === "rejected").length });
  } catch (error) {
    console.error("[push/send-to-user]", error);
    res.status(500).json({ error: "Could not send push notification." });
  }
});
`;
  src = src.replace('app.post("/api/admin/email-campaigns/send",', route + '\napp.post("/api/admin/email-campaigns/send",');
  write(file, src);
}

patchProviderSetupEditor();
patchSearchListings();
patchLoginCleanup();
patchPushRoutes();
