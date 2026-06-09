export function money(amount: number) { return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount); }
export function initials(name: string) { return name.split(/\s+/).slice(0,2).map((n) => n[0]?.toUpperCase()).join(''); }
export function titleCase(value: string) { return value.replace(/[-_]/g, ' ').replace(/\w/g, (m) => m.toUpperCase()); }
export function countUp(node: HTMLElement, value: number) { let start = 0; const step = Math.max(1, Math.ceil(value / 34)); const timer = setInterval(() => { start = Math.min(value, start + step); node.textContent = start.toLocaleString(); if (start >= value) clearInterval(timer); }, 26); return { destroy: () => clearInterval(timer) }; }
