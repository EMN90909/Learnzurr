"use client";

import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-[var(--paper)] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-sm font-bold text-[var(--gold)] mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold)] mb-3">Struta Legal</p>
            <h1 className="text-4xl font-black text-[var(--ink)]">Terms of Use</h1>
          </div>
          <Link to="/terms" className="text-sm font-bold text-[var(--gold)] hover:underline">
            View Terms and Conditions
          </Link>
        </div>

        <div className="prose prose-slate max-w-none text-[var(--muted)] space-y-6">
          <p><strong>Effective Date:</strong> May 30, 2026</p>
          <p>These Terms of Use explain how you may access and use Struta, including the family portal, funeral home portal, vendor marketplace, staff tools, memorial pages, payments, messaging, notifications, and ERP features.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">1. Acceptance of Use</h2>
          <p>By creating an account, signing in, browsing, submitting requests, managing staff, creating memorials, or using any Struta tool, you agree to use the platform responsibly, lawfully, and in line with our Terms and Conditions, Privacy Policy, and any payment or provider rules shown inside the platform.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">2. Who May Use Struta</h2>
          <p>You must be at least 18 years old or have legal capacity to enter into agreements. If you use Struta for a funeral home, vendor, or organization, you confirm that you are allowed to act for that organization.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">3. Account Responsibilities</h2>
          <p>You are responsible for keeping your login details secure, using accurate account information, and ensuring that staff members only access the areas they are allowed to use. Notify us quickly if you suspect unauthorized access.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">4. Acceptable Use</h2>
          <p>You agree not to misuse Struta. This includes not posting unlawful content, impersonating others, harassing users, uploading malware, attempting to bypass access controls, scraping data, attacking the platform, submitting false requests, or interfering with payment or booking systems.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">5. Family, Funeral Home, Vendor, and Staff Use</h2>
          <p>Families may use Struta to plan, request services, communicate, and create memorial pages. Funeral homes and vendors may use Struta to receive requests, manage operations, coordinate staff, and process bookings. Staff accounts must be used only for assigned work and authorized organization activity.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">6. Memorial and User Content</h2>
          <p>You remain responsible for text, images, documents, messages, and other content you upload. You must have the right to upload that content and must not upload anything abusive, misleading, private without permission, copyrighted without authority, or harmful.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">7. Payments and Subscriptions</h2>
          <p>Some features may require payment or subscription. You agree to provide accurate payment information and understand that cancelled paid plans may continue until the paid period ends, after which access may return to the free tier unless renewed.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">8. Platform Availability</h2>
          <p>We aim to keep Struta reliable, but we do not guarantee uninterrupted access. Features may change, pause, or be removed for security, maintenance, legal, operational, or product reasons.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">9. Security and Enforcement</h2>
          <p>We may monitor for abuse, rate-limit suspicious activity, block unsafe uploads, suspend accounts, restrict access, or remove content where needed to protect families, providers, staff, the platform, or the public.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">10. Contact</h2>
          <p>
            Emmanuel Nasong&apos;o<br />
            Founder of Emtra and builder of Struta<br />
            Email: info@emtra.top<br />
            Phone: configured support line<br />
            Office: Digital workspace at emtra.top
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
