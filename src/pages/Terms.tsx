"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
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
            <h1 className="text-4xl font-black text-[var(--ink)]">Terms and Conditions</h1>
          </div>
          <Link to="/terms-of-use" className="text-sm font-bold text-[var(--gold)] hover:underline">
            View Terms of Use
          </Link>
        </div>
        <div className="prose prose-slate max-w-none text-[var(--muted)] space-y-6">
          <p><strong>Effective Date:</strong> May 23, 2026</p>
          <p>These Terms and Conditions govern your access to and use of Struta, a funeral services platform connecting bereaved families, funeral homes, and vendors. By accessing or using Struta, you agree to these Terms and related policies, including our Privacy Policy and Terms of Use.</p>
          <p>You must be at least 18 years old (or legal majority in your country). If you use Struta on behalf of an organization, you confirm you have authority to bind that organization.</p>
          <p>Struta provides software coordination tools including requests, approvals, bookings, communications, invoices, payments, subscriptions, and memorial pages. Struta does not directly provide third-party services like transport or catering unless expressly stated.</p>
          <p>You are responsible for account confidentiality, accurate information, and activity under your account. We may suspend or terminate accounts for false information, misuse, policy violations, or user risk.</p>
          <p>Requests become active only when providers approve them. Funeral homes and vendors are responsible for their own service terms, availability, quality, and outcomes.</p>
          <p>You agree to pay applicable charges on time. Failed, reversed, or disputed payments may result in paused services. Refund handling follows provider policies and Struta platform rules.</p>
          <p>You are responsible for memorial page and message content, and must not upload unlawful or harmful content. By posting content, you grant Struta a limited license to host and display it for platform operation.</p>
          <p>You may not break laws, impersonate others, harass users, upload malicious software, scrape or reverse-engineer without permission, or perform fraudulent actions.</p>
          <p>Struta may integrate with third-party providers (payments, messaging, email, maps), each governed by their own terms. Service availability is not guaranteed at all times.</p>
          <p>To the fullest extent permitted by law, Struta is not liable for indirect or consequential losses and is not responsible for third-party provider acts or omissions.</p>
          <p>We may update these Terms. Continued use after updates means acceptance of revised Terms.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">Contact Us</h2>
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

export default Terms;
