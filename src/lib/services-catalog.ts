export const HOME_SERVICES_LIST = [
  { id: "full_service", label: "Full service" },
  { id: "basic_service", label: "Basic service" },
  { id: "body_collection", label: "Body collection and transport" },
  { id: "mortuary_care", label: "Mortuary care" },
  { id: "preparation_embalming", label: "Preparation and embalming" },
  { id: "viewing_wake", label: "Viewing or wake setup" },
  { id: "burial_coordination", label: "Burial coordination" },
  { id: "cremation_coordination", label: "Cremation coordination" },
  { id: "paperwork_handling", label: "Paperwork and permit handling" },
  { id: "venue_chapel", label: "Venue and chapel coordination" },
] as const;

export const VENDOR_SERVICES_LIST = [
  { id: "catering", label: "Catering" },
  { id: "chairs_tents", label: "Chairs & tents" },
  { id: "flowers_wreaths", label: "Flowers & wreaths" },
  { id: "transport_hearse", label: "Transport & hearse" },
  { id: "printing_stationery", label: "Printing & stationery" },
  { id: "sound_pa", label: "Sound & PA" },
  { id: "burial_supplies", label: "Burial supplies" },
  { id: "photography_video", label: "Photography & video" },
  { id: "clergy_support", label: "Clergy support" },
  { id: "cemetery_services", label: "Cemetery services" },
] as const;

const HOME_LABELS = Object.fromEntries(HOME_SERVICES_LIST.map((s) => [s.id, s.label]));
const VENDOR_LABELS = Object.fromEntries(VENDOR_SERVICES_LIST.map((s) => [s.id, s.label]));

export function getServiceLabel(id: string, type: "home" | "vendor" = "home"): string {
  const labels = type === "vendor" ? VENDOR_LABELS : HOME_LABELS;
  return labels[id] || id.replace(/_/g, " ");
}

export type ServicesOffered = Record<string, { enabled: boolean; price: number }>;

export function getEnabledServices(services?: ServicesOffered | null): [string, { enabled: boolean; price: number }][] {
  if (!services) return [];
  return Object.entries(services).filter(([, s]) => s.enabled);
}
