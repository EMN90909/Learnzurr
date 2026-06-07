export const FUNERAL_HOME_INVENTORY_CATEGORIES = [
  "Consumables",
  "Reusable equipment",
  "High-value stock",
  "Per-case stock",
  "General stock",
];

export const VENDOR_CATEGORIES = [
  "Catering",
  "Tents and marquees",
  "Chairs and tables",
  "Flowers and decor",
  "Sound and PA systems",
  "Transport",
  "Toilets and sanitation",
  "Fridges and cold storage",
  "Photography and live streaming",
  "Printing and stationery",
  "Stages and podiums",
  "General event/funeral support",
];

export const VENDOR_ITEM_CATEGORIES = [
  "Chairs and tables",
  "Tents and marquees",
  "Flowers and decor",
  "Sound systems and lighting",
  "Crockery and cutlery",
  "Linens and drapes",
  "Stages and podiums",
  "Toilets and sanitation",
  "Fridges and cold storage",
  "Transport equipment",
  "General event equipment",
];

export const VENDOR_BOOKING_STATUSES = [
  "Requested",
  "Accepted",
  "Declined",
  "Scheduled",
  "Delivered",
  "Setup complete",
  "Completed",
  "Cancelled",
];

export const getHomeId = (profile: any) => profile?.home_id || profile?.id;
export const getProfileName = (profile: any) => profile?.home_name || profile?.full_name || profile?.name || "Your funeral home";
