"use client";

import React, { useEffect, useState } from "react";
import { Store, Loader2, MapPin, Mail, Phone, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocationDetection } from "@/hooks/use-location";
import { showError } from "@/utils/toast";

type Vendor = {
  id: string;
  full_name?: string | null;
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  county?: string | null;
  sub_county?: string | null;
  town?: string | null;
  address?: string | null;
  vendor_category?: string | null;
};

type NearbyVendorsSectionProps = {
  onSelectVendor?: (vendor: Vendor) => void;
};

const NearbyVendorsSection = ({ onSelectVendor }: NearbyVendorsSectionProps) => {
  const { location, message } = useLocationDetection("vendor-search");

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const [manualCounty, setManualCounty] = useState("");
  const [manualSubCounty, setManualSubCounty] = useState("");
  const [category, setCategory] = useState("");

  const detectedCounty = location?.county || "";
  const detectedSubCounty = location?.sub_county || "";

  const searchVendors = async (
    county: string,
    subCounty?: string,
    vendorCategory?: string
  ) => {
    if (!county.trim()) {
      setManualMode(true);
      showError("Could not detect your county. Please search manually.");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      let query = supabase
        .from("user_profiles")
        .select(
          "id, full_name, business_name, email, phone, county, sub_county, town, address, vendor_category"
        )
        .eq("is_vendor", true)
        .eq("role", "marketplace")
        .or("active.is.null,active.eq.true")
        .ilike("county", county.trim());

      if (subCounty?.trim()) {
        query = query.ilike("sub_county", subCounty.trim());
      }

      if (vendorCategory?.trim()) {
        query = query.ilike("vendor_category", vendorCategory.trim());
      }

      let { data, error } = await query.range(0, 49);

      if (error) throw error;

      if ((!data || data.length === 0) && subCounty?.trim()) {
        let fallback = supabase
          .from("user_profiles")
          .select(
            "id, full_name, business_name, email, phone, county, sub_county, town, address, vendor_category"
          )
          .eq("is_vendor", true)
          .eq("role", "marketplace")
          .or("active.is.null,active.eq.true")
          .ilike("county", county.trim());

        if (vendorCategory?.trim()) {
          fallback = fallback.ilike("vendor_category", vendorCategory.trim());
        }

        const fallbackResult = await fallback.range(0, 49);

        if (fallbackResult.error) throw fallbackResult.error;

        data = fallbackResult.data;
      }

      setVendors(data || []);
    } catch (error) {
      console.error("Nearby vendors search error:", error);
      showError("Could not load vendors near you.");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searched && detectedCounty) {
      searchVendors(detectedCounty, detectedSubCounty, category);
    }
  }, [searched, detectedCounty, detectedSubCounty]);

  return (
    <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <span className="section-tag">Nearby Vendors</span>
          <h2 className="text-2xl font-bold text-[var(--ink)] mt-2">
            Vendors near you
          </h2>
          <p className="text-sm text-[var(--muted)] mt-2">
            Find catering, tents, transport, flowers, sound, and other support near your location.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => searchVendors(detectedCounty, detectedSubCounty, category)}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          placeholder="Vendor category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <Button
          onClick={() =>
            searchVendors(
              manualMode ? manualCounty : detectedCounty,
              manualMode ? manualSubCounty : detectedSubCounty,
              category
            )
          }
          disabled={loading}
        >
          Search vendors
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

          <Button
            onClick={() => searchVendors(manualCounty, manualSubCounty, category)}
            disabled={loading}
          >
            Search manually
          </Button>
        </div>
      )}

      {loading && (
        <div className="p-6 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--muted)]">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Finding vendors near you...
        </div>
      )}

      {!loading && searched && vendors.length === 0 && (
        <div className="p-8 rounded-xl border border-[var(--border)] text-center">
          <Store className="w-10 h-10 mx-auto text-[var(--muted)] mb-3" />
          <p className="font-bold text-[var(--ink)]">No vendors found</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            No vendors found near your location yet.
          </p>
        </div>
      )}

      {!loading && vendors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-5 flex flex-col"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--gold-bg)] flex items-center justify-center mb-4">
                <Store className="w-5 h-5 text-[var(--gold)]" />
              </div>

              <h3 className="font-bold text-lg text-[var(--ink)]">
                {vendor.business_name || vendor.full_name || "Vendor"}
              </h3>

              {vendor.vendor_category && (
                <p className="text-xs uppercase tracking-widest font-bold text-[var(--gold)] mt-1">
                  {vendor.vendor_category}
                </p>
              )}

              <div className="mt-3 space-y-2 flex-1">
                <p className="text-sm text-[var(--muted)] flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {vendor.county || "Unknown county"}
                  {vendor.sub_county ? `, ${vendor.sub_county}` : ""}
                  {vendor.town ? `, ${vendor.town}` : ""}
                </p>

                {vendor.email && (
                  <p className="text-sm text-[var(--muted)] flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {vendor.email}
                  </p>
                )}

                {vendor.phone && (
                  <p className="text-sm text-[var(--muted)] flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {vendor.phone}
                  </p>
                )}
              </div>

              <Button
                className="w-full btn-struta-primary mt-5"
                onClick={() => onSelectVendor?.(vendor)}
              >
                Request Vendor
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default NearbyVendorsSection;