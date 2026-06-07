"use client";

import React from 'react';
import PortalLayout from '@/components/layout/PortalLayout';
import MySentRequests from '@/components/MySentRequests';

const FamilyRequests = () => {
  return (
    <PortalLayout portalType="family">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-[var(--ink)]">Service Requests</h2>
          <p className="text-[var(--muted)]">Track, pay, and manage your active planning and coordination.</p>
        </div>

        <MySentRequests />
      </div>
    </PortalLayout>
  );
};

export default FamilyRequests;