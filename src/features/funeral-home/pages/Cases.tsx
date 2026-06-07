"use client";

import React from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { getHomeId } from "@/lib/operations";
import ProviderRequests from "@/components/ProviderRequests";

const CaseManagement = () => {
  const { profile } = useAuth();
  const homeId = getHomeId(profile);

  return (
    <PortalLayout portalType="operations">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Case Management</h2>
          <p className="text-slate-500">Manage active funeral cases, planning notes, quotes, and vendor bookings.</p>
        </div>

        {homeId && (
          <ProviderRequests
            providerId={homeId}
            providerType="home"
          />
        )}
      </div>
    </PortalLayout>
  );
};

export default CaseManagement;
