"use client";

import React from 'react';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/components/auth/AuthProvider';
import { MapPin, Mail, Calendar, Globe } from 'lucide-react';
import { format } from 'date-fns';

const FamilyProfile = () => {
  const { profile, user } = useAuth();

  return (
    <PortalLayout portalType="family">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-sm">
          <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-[var(--gold-bg)] text-[var(--gold)] text-4xl font-black">
              {profile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl font-black text-[var(--ink)]">{profile?.full_name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[var(--muted)]">
              <span className="flex items-center gap-1 text-sm font-medium">
                <Globe className="w-4 h-4 text-[var(--gold)]" /> {profile?.country || "Kenya"}
              </span>
              <span className="flex items-center gap-1 text-sm font-medium">
                <MapPin className="w-4 h-4 text-[var(--gold)]" /> {profile?.county || "Nairobi"}{profile?.sub_county ? `, ${profile.sub_county}` : ""}{profile?.town ? `, ${profile.town}` : ""}
              </span>
              <span className="flex items-center gap-1 text-sm font-medium">
                <Mail className="w-4 h-4 text-[var(--gold)]" /> {user?.email}
              </span>
              <span className="flex items-center gap-1 text-sm font-medium">
                <Calendar className="w-4 h-4 text-[var(--gold)]" /> Joined {profile?.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : 'Recently'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="card-struta p-0 border-none shadow-none">
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-[var(--muted)]">Account Type</span>
                <span className="font-bold capitalize">{profile?.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-[var(--muted)]">Status</span>
                <span className="text-emerald-600 font-bold">Active</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[var(--muted)]">Email Verified</span>
                <span className="text-emerald-600 font-bold">Yes</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-struta p-0 border-none shadow-none">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted)] italic text-center py-8">
                No recent activity to display.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default FamilyProfile;