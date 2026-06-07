"use client";

import React, { useEffect, useState } from "react";
import { Building2, Loader2, MapPin, Mail, Phone, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocationDetection } from "@/hooks/use-location";
import { showError } from "@/utils/toast";

type FuneralHome = {
  id: string;
  full_name?: string | null;
  home_name?: string | null;
  email?: string | null;
  phone?: string | null;
  county?: string | null;
  sub_county?: string | null;
  town?: string | null;
  address?: string | null;
};

type NearbyHomesSectionProps = {
  onSelectHome?: (home: FuneralHome) => void;
};

const NearbyHomesSection = ({ onSelectHome }: NearbyHomesSectionProps) => {
  const { location, message } = useLocationDetection("bereaved-search");

  const [homes, setHomes] = useState<FuneralHome[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const [manualCounty, setManualCounty] = useState("");
  const [manualSubCounty, setManualSubCounty] = useState("");

  const detectedCounty = location?.county || "";
  const detectedSubCounty = location?.sub_county || "";

  const searchHomes = async (county: string, subCounty?: string) => {
    if (!county.trim()) {
      setManualMode(true);
      showError("Could not detect your county. Please search manually.");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      let results: FuneralHome[] = [];

      if (subCounty?.trim()) {
        const exact = await supabase
          .from("user_profiles")
          .select(
            "id, full_name, home_name, email, phone, county, sub_county, town, address"
          )
          .eq("is_home", true)
          .eq("role", "operations")
          .or("active.is.null,active.eq.true")
          .ilike("county", county.trim())
          .ilike("sub_county", subCounty.trim())
          .range(0, 49);

        if (exact.error) throw exact.error;
        results = exact.data || [];
      }

      if (results.length === 0) {
        const countyOnly = await supabase
          .from("user_profiles")
          .select(
            "id, full_name, home_name, email, phone, county, sub_county, town, address"
          )
          .eq("is_home", true)
          .eq("role", "operations")
          .or("active.is.null,active.eq.true")
          .ilike("county", county.trim())
          .range(0, 49);

        if (countyOnly.error) throw countyOnly.error;
        results = countyOnly.data || [];
      }

      setHomes(results);
    } catch (error) {
      console.error("Nearby homes search error:", error);
      showError("Could not load funeral homes near you.");
      setHomes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searched && detectedCounty) {
      searchHomes(detectedCounty, detectedSubCounty);
    }
  }, [searched, detectedCounty, detectedSubCounty]);

  const handleManualSearch = () => {
    searchHomes(manualCounty, manualSubCounty);
  };

  return (
    <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <span className="section-tag">Nearby Homes</span>
          <h2 className="text-2xl font-bold text-[var(--ink)] mt-2">
            Funeral homes near you
          </h2>
          <p className="text-sm text-[var(--muted)] mt-2">
            We use your detected county and sub-county to show nearby registered funeral homes.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => searchHomes(detectedCounty, detectedSubCounty)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4 flex items-start gap-3">
        <MapPin className="w-5 h-5 text-[var(--gold)] mt-1" />
        <div className="flex-1">
          <p className="font-bold text-[var(--ink)]">Detected location</p>
          <p className="text-sm text-[var(--muted)]">
            {detectedCounty
              ? `${detectedCounty}${detectedSubCounty ? `, ${detectedSubCounty}` : ""}`
              : "Detecting your location..."}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">{message}</p>
        </div>

        <Button variant="ghost" onClick={() => setManualMode((v) => !v)}>
          {manualMode ? "Hide manual search" : "Change"}
        </Button>
      </div>

      {manualMode && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="County"
            value={manualCounty}
            onChange={(e) => setManualCounty(e.target.value)}
          />

          <Input
            placeholder="Sub-county"
            value={manualSubCounty}
            onChange={(e) => setManualSubCounty(e.target.value)}
          />

          <Button onClick={handleManualSearch} disabled={loading}>
            Search manually
          </Button>
        </div>
      )}

      {loading && (
        <div className="p-6 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--muted)]">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Finding funeral homes near you...
        </div>
      )}

      {!loading && searched && homes.length === 0 && (
        <div className="p-8 rounded-xl border border-[var(--border)] text-center">
          <Building2 className="w-10 h-10 mx-auto text-[var(--muted)] mb-3" />
          <p className="font-bold text-[var(--ink)]">No funeral homes found</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            No funeral homes found near your location yet.
          </p>
        </div>
      )}

      {!loading && homes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {homes.map((home) => (
            <div
              key={home.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-5 flex flex-col"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--gold-bg)] flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5 text-[var(--gold)]" />
              </div>

              <h3 className="font-bold text-lg text-[var(--ink)]">
                {home.home_name || home.full_name || "Funeral Home"}
              </h3>

              <div className="mt-3 space-y-2 flex-1">
                <p className="text-sm text-[var(--muted)] flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {home.county || "Unknown county"}
                  {home.sub_county ? `, ${home.sub_county}` : ""}
                  {home.town ? `, ${home.town}` : ""}
                </p>

                {home.email && (
                  <p className="text-sm text-[var(--muted)] flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {home.email}
                  </p>
                )}

                {home.phone && (
                  <p className="text-sm text-[var(--muted)] flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {home.phone}
                  </p>
                )}
              </div>

              <Button
                className="w-full btn-struta-primary mt-5"
                onClick={() => onSelectHome?.(home)}
              >
                Request Service
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default NearbyHomesSection;