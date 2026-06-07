import { supabase } from "@/integrations/supabase/client";

export async function uploadListingImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("listing-images")
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
  return data.publicUrl;
}
