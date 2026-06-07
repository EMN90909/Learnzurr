"use client";

import React, { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, MapPin, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { getHomeId } from "@/lib/operations";
import { showError } from "@/utils/toast";

const OperationsSchedule = () => {
  const { profile } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSchedule = async () => {
    const homeId = getHomeId(profile);
    if (!homeId) return;
    setLoading(true);
    try {
      // Query memorial_requests which has deceased_name and represents active cases
      const { data: requestsData, error } = await supabase
        .from("memorial_requests")
        .select("*")
        .eq("home_id", homeId)
        .eq("request_status", "Approved")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const rawCases = requestsData || [];

      // Fetch user profiles manually to avoid relationship errors
      const userIds = rawCases.map(c => c.user_id).filter(Boolean);
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("user_profiles")
          .select("id, full_name, phone")
          .in("id", userIds);
        if (profilesData) {
          profilesData.forEach(p => {
            profilesMap[p.id] = p;
          });
        }
      }

      const enrichedCases = rawCases.map(c => ({
        ...c,
        user_profiles: c.user_id ? profilesMap[c.user_id] : null
      }));

      setCases(enrichedCases);
    } catch (error: any) {
      showError(error.message || "Could not load schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [profile?.id, profile?.home_id]);

  return (
    <PortalLayout portalType="operations">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Service Schedule</h2>
            <p className="text-slate-500">Upcoming services are pulled from approved funeral cases.</p>
          </div>
          <Button className="bg-indigo-600" onClick={() => window.location.assign("/operations/cases")}>
            <Plus className="w-4 h-4 mr-2" /> Add Case Date
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[var(--gold)]" /></div>
            ) : cases.length ? (
              cases.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100">
                  <div className="w-16 h-16 rounded-lg bg-indigo-50 flex flex-col items-center justify-center text-indigo-600">
                    <span className="text-[10px] font-bold uppercase">{new Date(item.created_at).toLocaleString(undefined, { month: "short" })}</span>
                    <span className="text-xl font-bold">{new Date(item.created_at).getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{item.deceased_name || "Unnamed Service"}</h4>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.town || profile?.town || "Town not set"}, {item.county || profile?.county || "county not set"}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Family contact: {item.user_profiles?.full_name || "Not added"}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 border-2 border-dashed rounded-xl">
                <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No scheduled services yet. Approve a family request to populate the schedule.</p>
                <Button variant="link" onClick={() => window.location.assign("/operations/cases")}>Open cases</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default OperationsSchedule;