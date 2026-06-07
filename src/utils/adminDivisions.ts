import { administrativeDivisions } from "@/data/administrativeDivisions";
import type { CountryCode } from "@/data/countries";

const DEFAULT_COUNTRY: CountryCode = "KE";

export const normalizeCountryCode = (value?: string | null): CountryCode => {
  const code = value?.trim().toUpperCase();
  const found = administrativeDivisions.find((item) => item.countryCode === code);
  return found?.countryCode ?? DEFAULT_COUNTRY;
};

export const getAdministrativeDivision = (countryCode?: string | null) => {
  const normalized = normalizeCountryCode(countryCode);
  return administrativeDivisions.find((item) => item.countryCode === normalized) ?? administrativeDivisions[0];
};
