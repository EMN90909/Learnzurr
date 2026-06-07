import type { ServicesOffered } from "@/lib/services-catalog";

export type ProviderBusinessFields = {
  services_offered?: ServicesOffered | null;
  listing_images?: string[] | null;
  business_country?: string | null;
  provider_rating?: number | null;
  reviews_count?: number | null;
};

export function parseListingImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

export function parseServicesOffered(value: unknown): ServicesOffered {
  if (!value || typeof value !== "object") return {};
  return value as ServicesOffered;
}

export function enrichProviderFromProfile<T extends Record<string, unknown>>(
  row: T,
  type: "home" | "vendor"
): T & {
  listing_images: string[];
  services_offered: ServicesOffered;
  country: string;
  rating: number;
  reviews_count: number;
} {
  const localKey = `business_info_${type === "home" ? "home" : "vendor"}_${row.id}`;
  const localRaw = typeof window !== "undefined" ? localStorage.getItem(localKey) : null;
  let local: Record<string, unknown> = {};
  if (localRaw) {
    try {
      local = JSON.parse(localRaw);
    } catch {
      local = {};
    }
  }

  const dbServices = parseServicesOffered(row.services_offered ?? local.services_offered);
  const localServices = parseServicesOffered(local.services_offered);
  const services = Object.keys(dbServices).length > 0 ? dbServices : localServices;

  const dbImages = parseListingImages(row.listing_images ?? local.listing_images ?? local.listing_image);
  const images = dbImages.length > 0 ? dbImages : parseListingImages(local.listing_images);

  return {
    ...row,
    listing_images: images,
    services_offered: services,
    country: (row.business_country as string) || (local.country as string) || "Kenya",
    rating: Number(row.provider_rating ?? local.rating ?? 0) || 0,
    reviews_count: Number(row.reviews_count ?? local.reviews_count ?? 0) || 0,
  };
}
