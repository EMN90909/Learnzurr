export type CountryCode =
  | "KE"
  | "TZ"
  | "UG"
  | "RW"
  | "BI"
  | "ET"
  | "SO"
  | "SS"
  | "ER"
  | "DJ";

export type Country = {
  code: CountryCode;
  nameKey: string;
};

export const countries: Country[] = [
  { code: "KE", nameKey: "countries.KE" },
  { code: "TZ", nameKey: "countries.TZ" },
  { code: "UG", nameKey: "countries.UG" },
  { code: "RW", nameKey: "countries.RW" },
  { code: "BI", nameKey: "countries.BI" },
  { code: "ET", nameKey: "countries.ET" },
  { code: "SO", nameKey: "countries.SO" },
  { code: "SS", nameKey: "countries.SS" },
  { code: "ER", nameKey: "countries.ER" },
  { code: "DJ", nameKey: "countries.DJ" },
];
