import { supabase } from "@/integrations/supabase/client";

const BUSINESS_COUNTRY_KEY = (userId: string) => `struta_business_country_${userId}`;

export async function upsertUserProfile(payload: Record<string, unknown>) {
  let workingPayload = { ...payload };
  const retryableColumns = new Set([
    "business_country",
    "services_offered",
    "listing_images",
    "provider_rating",
    "reviews_count",
    "paypal_email",
    "mpesa_phone",
  ]);

  for (let attempt = 0; attempt < retryableColumns.size + 1; attempt += 1) {
    const { error } = await supabase.from("user_profiles").upsert(workingPayload);

    if (!error) {
      if (payload.business_country && typeof payload.id === "string") {
        localStorage.setItem(BUSINESS_COUNTRY_KEY(payload.id), String(payload.business_country));
      }
      return;
    }

    const missingColumn = Array.from(retryableColumns).find((column) =>
      error.message?.includes(`'${column}'`)
    );

    if (!missingColumn || !(missingColumn in workingPayload)) {
      throw error;
    }

    const { [missingColumn]: _removed, ...rest } = workingPayload;
    workingPayload = rest;
  }

  throw new Error("Could not save user profile because the database schema is missing required columns.");
}

export function getStoredBusinessCountry(userId: string) {
  return localStorage.getItem(BUSINESS_COUNTRY_KEY(userId));
}
