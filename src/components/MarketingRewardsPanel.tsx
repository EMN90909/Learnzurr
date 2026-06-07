import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

export function MarketingRewardsPanel() {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("gamification_rules")
        .select("*")
        .eq("is_enabled", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("reward_days", { ascending: false })
        .limit(5);
      if (!error) setCampaigns(data || []);
    };
    void load();
  }, []);

  if (!campaigns.length) return null;

  return (
    <Card className="mb-6 border-[var(--gold)]/30 bg-[var(--gold-bg)]">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--gold)]" />
          <p className="text-sm font-bold text-[var(--ink)]">Active Pro reward campaigns</p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-lg border bg-white/70 p-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-slate-900">{campaign.title}</p>
                <Badge variant="outline">{campaign.reward_days} Pro days</Badge>
              </div>
              <p className="text-slate-500 mt-1">{campaign.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
