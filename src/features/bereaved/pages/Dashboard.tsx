"use client";

import React, { useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Globe, Share2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { showSuccess } from "@/utils/toast";
import MySentRequests from "@/components/MySentRequests";

const FamilyDashboard = () => {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyReferral = async () => {
    const referralCode = user?.id || profile?.referral_code || "struta";
    const referralLink = `${window.location.origin}/signup/bereaved?ref=${encodeURIComponent(referralCode)}`;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showSuccess("Tracked Struta referral link copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PortalLayout portalType="family">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[var(--ink)]">Welcome, {profile?.full_name || "Back"}</h2>
            <p className="text-[var(--muted)] mt-1">{profile?.county ? "Family services near " + (profile.town || "your town") + ", " + profile.county : "Find a funeral home, manage requests, and preserve memorials."}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild><Link to="/family/memorials/create"><Globe className="w-4 h-4 mr-2" />Create Memorial</Link></Button>
            <Button className="btn-struta-gold" asChild><Link to="/family/search"><Plus className="w-4 h-4 mr-2" />Find a Home</Link></Button>
          </div>
        </div>
        <Card className="border-[var(--gold)]/30 bg-[var(--gold-bg)] shadow-sm">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1"><h3 className="font-bold text-lg text-[var(--ink)] flex items-center gap-2"><Share2 className="w-5 h-5 text-[var(--gold)]" />Share Struta with other families</h3><p className="text-sm text-[var(--muted)]">This link tracks referral visits and successful signups in Admin Reports.</p></div>
            <Button onClick={handleCopyReferral} className="btn-struta-gold shrink-0">{copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}{copied ? "Copied!" : "Copy Referral Link"}</Button>
          </CardContent>
        </Card>
        <MySentRequests />
      </div>
    </PortalLayout>
  );
};

export default FamilyDashboard;
