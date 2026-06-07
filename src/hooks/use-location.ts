"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type DetectedLocation = {
  country?: string;
  county?: string;
  sub_county?: string;
  town?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isSupportedCountry?: boolean;
};

const ALLOWED_COUNTRIES = ["Kenya", "Uganda", "Tanzania", "Rwanda"];

export const useLocationDetection = (purpose?: string) => {
  const [location, setLocation] = useState<DetectedLocation>({});
  const [message, setMessage] = useState("Detecting location...");
  const [loading, setLoading] = useState(false);

  const detectLocation = useCallback(async (forceDetect = false) : Promise<DetectedLocation> => {
    setLoading(true);
    setMessage("Checking location...");

    try {
      // Check if user is signed in first
      const { data: { session } } = await supabase.auth.getSession();
      const isSignedIn = !!session?.user;

      // Only read saved/cached location if the user is signed in
      if (isSignedIn && !forceDetect) {
        // 1. Check localStorage cache first to avoid repeated prompts
        const cached = localStorage.getItem("struta_detected_location");
        if (cached) {
          const parsed = JSON.parse(cached);
          const isSupported = ALLOWED_COUNTRIES.includes(parsed.country || "");
          const result = { ...parsed, isSupportedCountry: isSupported };
          setLocation(result);
          setMessage(`Using saved location.`);
          setLoading(false);
          return result;
        }

        // 2. Check if user has a saved location in Supabase profile
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("county, sub_county, town, address, latitude, longitude")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.county) {
          const profileLoc = {
            country: "Kenya", // Default fallback
            county: profile.county,
            sub_county: profile.sub_county || "",
            town: profile.town || "",
            address: profile.address || "",
            latitude: profile.latitude || undefined,
            longitude: profile.longitude || undefined,
          };
          const isSupported = ALLOWED_COUNTRIES.includes(profileLoc.country);
          const result = { ...profileLoc, isSupportedCountry: isSupported };
          setLocation(result);
          localStorage.setItem("struta_detected_location", JSON.stringify(profileLoc));
          setMessage(`Using saved profile location.`);
          setLoading(false);
          return result;
        }
      }

      // 3. Try browser Geolocation
      let result: DetectedLocation = {};
      let detectedViaGps = false;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 4000,
              maximumAge: 60000,
            });
          });

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );

          const data = await response.json();
          const address = data.address || {};

          const country = address.country || "Kenya";
          const county = address.county || address.city || address.state_district || address.state || "";
          const subCounty = address.suburb || address.city_district || address.town || address.village || address.municipality || "";
          const town = address.town || address.city || address.village || address.suburb || "";

          result = {
            country,
            county,
            sub_county: subCounty,
            town,
            address: data.display_name,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          detectedViaGps = true;
        } catch (gpsError) {
          console.log("[Location] GPS detection failed or timed out, falling back to IP detection.");
        }
      }

      // 4. Fallback to IP-based location detection if GPS failed or is unsupported
      if (!detectedViaGps) {
        try {
          const ipResponse = await fetch("https://ipapi.co/json/");
          if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            result = {
              country: ipData.country_name || "Kenya",
              county: ipData.region || ipData.city || "Nairobi",
              sub_county: ipData.city || "Westlands",
              town: ipData.city || "Nairobi",
              address: `${ipData.city || "Nairobi"}, ${ipData.country_name || "Kenya"}`,
              latitude: ipData.latitude,
              longitude: ipData.longitude,
            };
          } else {
            throw new Error("IP API response not OK");
          }
        } catch (ipError) {
          // Final hardcoded fallback to Kenya if everything fails
          result = {
            country: "Kenya",
            county: "Nairobi",
            sub_county: "Westlands",
            town: "Nairobi",
            address: "Nairobi, Kenya",
          };
        }
      }

      // Validate country support
      const isSupported = ALLOWED_COUNTRIES.includes(result.country || "");
      result.isSupportedCountry = isSupported;

      setLocation(result);
      localStorage.setItem("struta_detected_location", JSON.stringify(result));
      setMessage(isSupported ? "Location detected successfully." : `Not available in your country (${result.country})`);

      // Save to user profile if logged in
      if (session?.user) {
        await supabase.from("user_profiles").update({
          county: result.county,
          sub_county: result.sub_county,
          town: result.town,
          address: result.address,
          latitude: result.latitude,
          longitude: result.longitude
        }).eq("id", session.user.id);
      }

      return result;
    } catch (error) {
      console.error("[Location] Detection error:", error);
      const fallback = {
        country: "Kenya",
        county: "Nairobi",
        sub_county: "Westlands",
        town: "Nairobi",
        address: "Nairobi, Kenya",
        isSupportedCountry: true
      };
      setLocation(fallback);
      setMessage("Could not detect location. Using default.");
      return fallback;
    } finally {
      setLoading(false);
    }
  }, [purpose]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  return { location, message, loading, detectLocation };
};