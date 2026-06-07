import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "src/features/provider/pages/ProviderAccountSetup.tsx");
let src = fs.readFileSync(file, "utf8");

if (!src.includes("provider-setup-shell")) {
  src = src.replace(
    'className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff9ec_0%,#f4efe5_42%,#ebdcc7_100%)] p-4 flex items-center justify-center"',
    'className="provider-setup-shell min-h-screen lg:grid lg:grid-cols-[50%_50%] bg-[var(--paper)] text-[var(--ink)] dark:bg-[#0b0a08] dark:text-[#f6efe4]"'
  );

  src = src.replace(
    '<div className="w-full max-w-5xl clay-surface rounded-[2rem] overflow-hidden">',
    '<aside className="setup-art hidden lg:flex relative min-h-screen w-full overflow-hidden border-r border-[var(--clay-border)] items-center justify-center p-12"><div className="provider-setup-orb absolute top-20 left-16 h-40 w-40 rounded-full border border-[var(--gold)]/30 bg-[var(--gold-bg)]" /><div className="provider-setup-orb absolute bottom-20 right-16 h-56 w-56 rounded-[4rem] border border-[var(--gold)]/20 bg-[var(--gold-bg)] rotate-12" /><div className="provider-setup-building absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end gap-3 opacity-80"><span className="h-28 w-10 rounded-t-2xl bg-[var(--clay-bg)] border border-[var(--clay-border)] shadow-[var(--clay-shadow-soft)]" /><span className="h-44 w-12 rounded-t-3xl bg-[var(--clay-bg-strong)] border border-[var(--clay-border)] shadow-[var(--clay-shadow-soft)]" /><span className="h-36 w-10 rounded-t-2xl bg-[var(--clay-bg)] border border-[var(--clay-border)] shadow-[var(--clay-shadow-soft)]" /></div><div className="relative z-10 w-full max-w-lg space-y-8"><div className="inline-flex rounded-[2rem] bg-[var(--clay-bg)] border border-[var(--clay-border)] shadow-[var(--clay-shadow)] px-8 py-5 text-5xl font-black tracking-tight text-[var(--ink)] dark:text-[#f6efe4]">Struta</div><h2 className="text-5xl font-black tracking-tight text-[var(--ink)] dark:text-[#f6efe4]">Set up your {label.toLowerCase()} presence.</h2><p className="text-lg text-[var(--muted)] dark:text-[#c8bda9]">A calm guided setup for verification, services, listing images, and launch.</p><div className="grid grid-cols-3 gap-3 pt-4">{["Verify", "Describe", "Publish"].map((item) => <div key={item} className="rounded-2xl bg-[var(--clay-bg)] border border-[var(--clay-border)] shadow-[var(--clay-shadow-soft)] p-4 text-sm font-black text-center text-[var(--ink)] dark:text-[#f6efe4]">{item}</div>)}</div></div></aside><main className="min-h-screen w-full flex items-stretch justify-stretch p-0"><div className="setup-panel w-full max-w-none min-h-screen lg:rounded-none clay-surface rounded-[2rem] overflow-y-auto">'
  );

  src = src.replace(
    '        </div>\n      </div>\n    </div>\n  );\n}',
    '        </div>\n      </main>\n    </div>\n  );\n}'
  );
}

src = src.replace('className="p-5 md:p-8 transition-all duration-300 animate-in fade-in slide-in-from-right-3"', 'className="p-6 md:p-10 lg:p-14 w-full max-w-none transition-all duration-300 animate-in fade-in slide-in-from-right-3"');
src = src.replace('className="grid md:grid-cols-[1.05fr_0.95fr] gap-6"', 'className="w-full space-y-6"');
src = src.replace('className="rounded-[1.7rem] border border-[var(--clay-border)] bg-white/72 p-6 flex flex-col justify-between gap-6"', 'className="rounded-[1.7rem] border border-[var(--clay-border)] bg-[var(--clay-bg-strong)] shadow-[var(--clay-shadow-soft)] p-6 flex flex-col justify-between gap-6"');
src = src.replaceAll('bg-white/70', 'bg-[var(--clay-bg-strong)]');
src = src.replaceAll('bg-white/72', 'bg-[var(--clay-bg-strong)]');
src = src.replaceAll('bg-white/75', 'bg-[var(--clay-bg-strong)]');
src = src.replaceAll('bg-white/60', 'bg-[var(--clay-bg-strong)]');
src = src.replaceAll('text-[var(--muted)]', 'text-[var(--muted)] dark:text-[#c8bda9]');
src = src.replaceAll('text-[var(--ink)]', 'text-[var(--ink)] dark:text-[#f6efe4]');
src = src.replaceAll('bg-slate-200', 'bg-black/10 dark:bg-white/10');
src = src.replaceAll('<Input ', '<Input className="setup-input" ');
src = src.replaceAll('<Textarea ', '<Textarea className="setup-input" ');
src = src.replaceAll('className="setup-input" className="', 'className="setup-input ');

fs.writeFileSync(file, src);

const cssFile = path.join(root, "src/globals.css");
let css = fs.readFileSync(cssFile, "utf8");
const marker = "/* provider setup hard override */";
if (!css.includes(marker)) {
  css += `\n\n${marker}\n.provider-setup-shell { width: 100vw; min-height: 100vh; font-family: var(--font-body); }\n@media (min-width: 1024px) { .provider-setup-shell { display: grid !important; grid-template-columns: 50% 50% !important; } }\n.provider-setup-shell .setup-art { min-height: 100vh; background: radial-gradient(circle at 20% 18%, rgba(200,146,58,.20), transparent 30%), radial-gradient(circle at 78% 75%, rgba(200,146,58,.12), transparent 34%), var(--paper) !important; }\n.provider-setup-shell .setup-panel { width: 100% !important; max-width: none !important; min-height: 100vh !important; border-radius: 0 !important; background: var(--clay-bg) !important; color: var(--ink) !important; }\n.provider-setup-shell .setup-input, .provider-setup-shell input, .provider-setup-shell textarea { background: rgba(255,252,245,.98) !important; color: #0c0b08 !important; border: 1px solid rgba(12,11,8,.18) !important; box-shadow: inset 2px 2px 7px rgba(12,11,8,.08), inset -1px -1px 4px rgba(255,255,255,.34) !important; }\n.provider-setup-shell textarea { min-height: 180px; }\n.provider-setup-shell input::placeholder, .provider-setup-shell textarea::placeholder { color: #7a7163 !important; opacity: 1 !important; }\n.provider-setup-shell button, .provider-setup-shell .btn-struta-primary, .provider-setup-shell .btn-struta-gold { border-radius: 999px !important; box-shadow: 7px 8px 18px rgba(12,11,8,.12), inset 0 1px 0 rgba(255,255,255,.2) !important; }\n.provider-setup-orb { animation: providerSetupFloat 7s ease-in-out infinite; }\n.provider-setup-orb:nth-child(2) { animation-delay: -2s; }\n.provider-setup-building { animation: providerBuildingGlow 6s ease-in-out infinite; }\n@keyframes providerSetupFloat { 0%,100% { transform: translateY(0) rotate(0deg); opacity:.55; } 50% { transform: translateY(-18px) rotate(8deg); opacity:.9; } }\n@keyframes providerBuildingGlow { 0%,100% { opacity:.65; filter: blur(0); } 50% { opacity:1; filter: blur(.2px); } }\n:root[data-theme=\"dark\"] .provider-setup-shell { background: #0b0a08 !important; color: #f6efe4 !important; }\n:root[data-theme=\"dark\"] .provider-setup-shell .setup-art { background: radial-gradient(circle at 20% 18%, rgba(224,170,79,.18), transparent 30%), radial-gradient(circle at 78% 75%, rgba(224,170,79,.10), transparent 34%), #0b0a08 !important; color: #f6efe4 !important; }\n:root[data-theme=\"dark\"] .provider-setup-shell .setup-panel { background: #15130f !important; color: #f6efe4 !important; }\n:root[data-theme=\"dark\"] .provider-setup-shell h1, :root[data-theme=\"dark\"] .provider-setup-shell h2, :root[data-theme=\"dark\"] .provider-setup-shell h3, :root[data-theme=\"dark\"] .provider-setup-shell p, :root[data-theme=\"dark\"] .provider-setup-shell label, :root[data-theme=\"dark\"] .provider-setup-shell span { color: inherit; }\n:root[data-theme=\"dark\"] .provider-setup-shell .setup-input, :root[data-theme=\"dark\"] .provider-setup-shell input, :root[data-theme=\"dark\"] .provider-setup-shell textarea { background: #201d18 !important; color: #f6efe4 !important; border-color: rgba(246,239,228,.16) !important; box-shadow: inset 2px 2px 8px rgba(0,0,0,.38), inset -1px -1px 4px rgba(255,255,255,.04) !important; }\n:root[data-theme=\"dark\"] .provider-setup-shell input::placeholder, :root[data-theme=\"dark\"] .provider-setup-shell textarea::placeholder { color: #b8ad9d !important; opacity: 1 !important; }\n`;
}
fs.writeFileSync(cssFile, css);
