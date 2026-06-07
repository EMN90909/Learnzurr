"use client";

import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import ManagerSettingsPage from "./Settings";
import OperationsSettings from "@/features/funeral-home/pages/Settings";
import VendorSettings from "@/features/marketplace/pages/Settings";

export default function ProviderSettingsGate({ portalType }: { portalType: "operations" | "marketplace" }) {
  const { profile } = useAuth();

  if (profile?.is_staff_session) {
    return <ManagerSettingsPage />;
  }

  return portalType === "marketplace" ? <VendorSettings /> : <OperationsSettings />;
}
