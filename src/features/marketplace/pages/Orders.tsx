"use client";

import React from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import ProviderRequests from "@/components/ProviderRequests";

const VendorOrders = () => {
  const { profile } = useAuth();

  return (
    <PortalLayout portalType="marketplace">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Vendor Bookings</h2>
          <p className="text-slate-500">Track requested, scheduled, delivered, setup, and completed funeral bookings.</p>
        </div>

        {profile?.id && (
          <ProviderRequests
            providerId={profile.id}
            providerType="vendor"
          />
        )}
      </div>
    </PortalLayout>
  );
};

export default VendorOrders;