"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[var(--paper)] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-sm font-bold text-[var(--gold)] mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <h1 className="text-4xl font-black text-[var(--ink)] mb-8">Privacy Policy</h1>
        <div className="prose prose-slate max-w-none text-[var(--muted)] space-y-6">
          <p><strong>Effective Date:</strong> May 23, 2026</p>
          <p><strong>Last Updated:</strong> May 29, 2026</p>
          <p>Struta operates a funeral services platform connecting bereaved families, funeral homes, and vendors. We understand that handling sensitive information during difficult times requires the highest standards of privacy and security. This policy explains how we collect, use, store, share, and protect your personal information.</p>
          
          <h2 className="text-xl font-bold text-[var(--ink)]">1. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, phone number, password, and account credentials</li>
            <li><strong>Profile Details:</strong> Biography, profile photos, contact information, and preferences</li>
            <li><strong>Service Request Information:</strong> Funeral service details, deceased information, service dates, location preferences, and special requests</li>
            <li><strong>Communications:</strong> Messages between users, support tickets, and correspondence</li>
            <li><strong>Billing Information:</strong> Invoice records, payment transaction data (processed securely through third-party processors)</li>
            <li><strong>Memorial Content:</strong> Obituaries, photos, videos, tributes, and remembrance posts</li>
            <li><strong>Device & Usage Data:</strong> IP address, browser type, device information, pages visited, time spent, and click patterns</li>
            <li><strong>Notification Settings:</strong> Your preferences for email, SMS, and push notifications</li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--ink)]">2. How We Use Your Information</h2>
          <p>We use your information for the following legitimate purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Manage and maintain your account</li>
            <li>Connect bereaved families with appropriate funeral homes and vendors</li>
            <li>Process service requests, payments, and transactions</li>
            <li>Send service-related emails, notifications, and updates</li>
            <li>Improve platform security, detect and prevent fraud or abuse</li>
            <li>Enhance platform quality, user experience, and service offerings</li>
            <li>Comply with legal obligations and regulatory requirements</li>
            <li>Conduct analytics and research to improve our services</li>
            <li>Provide customer support and respond to inquiries</li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--ink)]">3. How We Share Information</h2>
          <p>We share your information only in the following circumstances:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>With Service Providers:</strong> Funeral homes, vendors, and professionals involved in your service request</li>
            <li><strong>Payment Processors:</strong> Secure third-party payment processors (we do not store complete credit card numbers)</li>
            <li><strong>Communication Tools:</strong> Email service providers, SMS gateways, and notification services</li>
            <li><strong>Analytics & Hosting:</strong> Analytics partners and cloud hosting providers who assist platform operations</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with user notification)</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
          </ul>
          <p><strong>We do NOT sell, rent, or trade your personal information to third parties for marketing purposes.</strong></p>

          <h2 className="text-xl font-bold text-[var(--ink)]">4. Memorial Pages & Public Content</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Content on memorial pages may be public, private, or restricted based on your settings</li>
            <li>Information you share publicly on memorial pages can be viewed and indexed by search engines</li>
            <li><strong>Please avoid posting:</strong> Social security numbers, financial information, home addresses, or any sensitive data you don't want publicly accessible</li>
            <li>You can update privacy settings or request removal of memorial content by contacting us</li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--ink)]">5. Security Measures</h2>
          <p>We implement industry-standard security protections including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption of data in transit (TLS/SSL) and at rest</li>
            <li>Secure password hashing and authentication protocols</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and employee training on data privacy</li>
            <li>Firewalls, intrusion detection, and monitoring systems</li>
            <li>Secure third-party vendor vetting and contracts</li>
          </ul>
          <p><em>While we strive to protect your information, no method of transmission over the internet is 100% secure. We encourage you to use strong passwords and avoid sharing login credentials.</em></p>

          <h2 className="text-xl font-bold text-[var(--ink)]">6. Data Retention</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We retain personal information only as long as necessary to provide our services</li>
            <li>Account data is retained for the duration of your account plus legal compliance periods</li>
            <li>Memorial content may be retained indefinitely unless you request deletion</li>
            <li>Billing and transaction records are retained per tax and legal requirements (typically 7 years)</li>
            <li>When data is no longer needed, we securely delete or anonymize it</li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--ink)]">7. Your Rights & Choices</h2>
          <p>Depending on your location (GDPR, CCPA, or other privacy laws), you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request removal of your personal data</li>
            <li><strong>Restriction:</strong> Limit how we process your data</li>
            <li><strong>Portability:</strong> Receive your data in a portable format</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
            <li><strong>Withdraw Consent:</strong> Revoke previously given consent (where applicable)</li>
            <li><strong>File a Complaint:</strong> Contact your local data protection authority</li>
          </ul>
          <p>To exercise these rights, contact us at info@emtra.top. We will respond within 30 days.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">8. Cookies & Tracking</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We use essential cookies to enable platform functionality</li>
            <li>Analytics cookies help us understand usage patterns</li>
            <li>You can control cookie preferences through your browser settings</li>
            <li>Disabling cookies may limit some platform features</li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--ink)]">9. Children's Privacy</h2>
          <p>Our service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors. If we become aware of such data, we will delete it promptly.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">10. International Data Transfers</h2>
          <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place (standard contractual clauses, adequacy decisions) to protect your data according to this policy.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">11. Changes to This Policy</h2>
          <p>We may update this privacy policy periodically. We will notify you of significant changes via email or platform notification. Continued use after changes constitutes acceptance of the updated policy.</p>

          <h2 className="text-xl font-bold text-[var(--ink)]">12. Contact Us</h2>
          <p>For privacy questions, concerns, or to exercise your rights:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Email:</strong> info@emtra.top</li>
            <li><strong>Data Protection Officer:</strong> Available upon request</li>
            <li><strong>Response Time:</strong> Within 30 days</li>
          </ul>
          
          <div className="mt-8 p-4 bg-[var(--paper)] border border-[var(--gold)] rounded-lg">
            <p className="text-sm"><strong>Complaints:</strong> If you believe your privacy rights have been violated, you may file a complaint with your local data protection authority (e.g., ICO in the UK, FTC in the US, or your national DPAs under GDPR).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
