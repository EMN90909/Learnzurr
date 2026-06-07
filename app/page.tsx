import React from "react";

const seoSections = [
  "Verified funeral homes and vendors",
  "Family request tracking",
  "Secure Paystack provider plans",
  "Role-aware staff operations",
];

export const metadata = {
  title: "Struta | Funeral planning and provider operations",
  description: "Struta helps families, funeral homes, and vendors coordinate funeral requests, payments, staff tasks, and notifications securely.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <section className="mx-auto max-w-5xl px-6 py-24">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--gold)]">Struta</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight">A calm, secure funeral planning platform.</h1>
        <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[var(--muted)]">
          This Next.js SEO entry page is static-rendered by default and can be expanded route by route while the existing app shell is migrated.
        </p>
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {seoSections.map((section) => (
            <li key={section} className="border border-[var(--border)] bg-[var(--surface)] p-5 text-sm font-bold">
              {section}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
