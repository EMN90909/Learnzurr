import type { CountryCode } from "./countries";

export type AdministrativeDivision = {
  countryCode: CountryCode;
  divisionTypeKey: string;
  subDivisionTypeKey: string;
  defaultDivisionType: string;
  defaultSubDivisionType: string;
};

export const administrativeDivisions: AdministrativeDivision[] = [
  { countryCode: "KE", divisionTypeKey: "admin.county", subDivisionTypeKey: "admin.subCounty", defaultDivisionType: "county", defaultSubDivisionType: "sub-county" },
  { countryCode: "TZ", divisionTypeKey: "admin.region", subDivisionTypeKey: "admin.district", defaultDivisionType: "region", defaultSubDivisionType: "district" },
  { countryCode: "UG", divisionTypeKey: "admin.district", subDivisionTypeKey: "admin.county", defaultDivisionType: "district", defaultSubDivisionType: "county" },
  { countryCode: "RW", divisionTypeKey: "admin.province", subDivisionTypeKey: "admin.district", defaultDivisionType: "province", defaultSubDivisionType: "district" },
  { countryCode: "BI", divisionTypeKey: "admin.province", subDivisionTypeKey: "admin.commune", defaultDivisionType: "province", defaultSubDivisionType: "commune" },
  { countryCode: "ET", divisionTypeKey: "admin.regionalState", subDivisionTypeKey: "admin.zone", defaultDivisionType: "regional state", defaultSubDivisionType: "zone" },
  { countryCode: "SO", divisionTypeKey: "admin.federalMemberState", subDivisionTypeKey: "admin.region", defaultDivisionType: "federal member state", defaultSubDivisionType: "region" },
  { countryCode: "SS", divisionTypeKey: "admin.state", subDivisionTypeKey: "admin.county", defaultDivisionType: "state", defaultSubDivisionType: "county" },
  { countryCode: "ER", divisionTypeKey: "admin.region", subDivisionTypeKey: "admin.subRegion", defaultDivisionType: "region", defaultSubDivisionType: "sub-region" },
  { countryCode: "DJ", divisionTypeKey: "admin.region", subDivisionTypeKey: "admin.district", defaultDivisionType: "region", defaultSubDivisionType: "district" },
];

// Legacy exports for compatibility with signup pages
export type AfricaAdministrativeDivision = {
  country: string;
  division_type: string;
  sub_division_type: string;
};

export const africaAdministrativeDivisions: AfricaAdministrativeDivision[] = [
  { country: "Kenya", division_type: "county", sub_division_type: "sub-county" },
  { country: "Tanzania", division_type: "region", sub_division_type: "district" },
  { country: "Uganda", division_type: "district", sub_division_type: "county" },
  { country: "Rwanda", division_type: "province", sub_division_type: "district" },
  { country: "Burundi", division_type: "province", sub_division_type: "commune" },
  { country: "Ethiopia", division_type: "regional_state", sub_division_type: "zone" },
  { country: "Somalia", division_type: "federal_member_state", sub_division_type: "region" },
  { country: "South Sudan", division_type: "state", sub_division_type: "county" },
  { country: "Eritrea", division_type: "region", sub_division_type: "sub-region" },
  { country: "Djibouti", division_type: "region", sub_division_type: "district" },
];

export const getAdministrativeDivision = (country?: string | null) =>
  africaAdministrativeDivisions.find((item) => item.country === country) || africaAdministrativeDivisions[0];
