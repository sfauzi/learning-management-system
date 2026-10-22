import { cache } from "react";
import { db } from "@/lib/supabase/admin";
import type { SiteSettings } from "@/lib/types";

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "LMS",
  site_tagline: "Learning Management System",
  site_short_name: "LMS Telkom University",
  brand_color: "#a12520",
  support_email: "clove@telkomuniversity.ac.id",
  support_wa_lecturer: "082116663563",
  support_wa_student: "081222001813",
  footer_address:
    "Gedung Panehan Lantai 1,\nJl. Telekomunikasi Terusan Buah Batu,\nBandung - 40257, Indonesia",
  sso_enabled: "1",
  registration_enabled: "0",
  academic_year: "2026/2027",
  semester: "5",
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const { data } = await db().from("settings").select("key,value");
  const merged: SiteSettings = { ...DEFAULT_SETTINGS };
  for (const row of data ?? []) {
    if (row.value !== null && row.value !== undefined) merged[row.key] = row.value;
  }
  return merged;
});

export async function saveSettings(values: Record<string, string>) {
  const rows = Object.entries(values).map(([key, value]) => ({ key, value }));
  const { error } = await db()
    .from("settings")
    .upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);
}
