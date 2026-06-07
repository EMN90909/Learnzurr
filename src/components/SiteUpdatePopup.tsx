"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, X } from "lucide-react";

type SiteUpdate = {
  id: string;
  title: string;
  body: string;
  image_url?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  audience?: string | null;
};

export default function SiteUpdatePopup() {
  const { profile, user, loading } = useAuth();
  const [update, setUpdate] = useState<SiteUpdate | null>(null);
  const [open, setOpen] = useState(false);
  const role = profile?.role;

  const localSeenKey = useMemo(() => update && user?.id ? `struta_seen_update_${user.id}_${update.id}` : "", [update, user?.id]);

  useEffect(() => {
    let cancelled = false;

    const loadUpdate = async () => {
      if (loading || !user?.id || !role) return;

      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("site_update_popups")
          .select("id,title,body,image_url,cta_label,cta_url,audience")
          .eq("active", true)
          .or(`audience.eq.all,audience.eq.${role}`)
          .lte("starts_at", now)
          .or(`ends_at.is.null,ends_at.gt.${now}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data || cancelled) return;
        if (localStorage.getItem(`struta_seen_update_${user.id}_${data.id}`) === "1") return;

        setUpdate(data as SiteUpdate);
        setOpen(true);
      } catch {
        // Do not block page loading because of update popups.
      }
    };

    void loadUpdate();
    return () => {
      cancelled = true;
    };
  }, [loading, role, user?.id]);

  const markSeen = async () => {
    if (!update || !user?.id) return;
    if (localSeenKey) localStorage.setItem(localSeenKey, "1");
    setOpen(false);

    try {
      await supabase.from("site_update_popup_views").insert({
        popup_id: update.id,
        user_id: user.id,
        visitor_key: null,
      });
    } catch {
      // Local seen state is enough to avoid showing again on this browser.
    }
  };

  if (!update || !user?.id) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) void markSeen(); }}>
      <DialogContent className="max-w-lg overflow-hidden rounded-3xl p-0" aria-describedby="site-update-description">
        {update.image_url && <img src={update.image_url} alt="Struta update" className="h-56 w-full object-cover" loading="lazy" />}
        <div className="p-6 space-y-5">
          <DialogHeader>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--gold-bg)] text-[var(--gold)] mb-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <DialogTitle className="text-2xl font-black text-[var(--ink)]">{update.title}</DialogTitle>
            <DialogDescription id="site-update-description">Latest Struta update for your account.</DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-[var(--muted)] whitespace-pre-wrap">{update.body}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            {update.cta_url && update.cta_label && (
              <Button className="btn-struta-gold flex-1" asChild onClick={() => void markSeen()}>
                <a href={update.cta_url}>{update.cta_label}</a>
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={() => void markSeen()}>
              <X className="h-4 w-4 mr-2" />
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
