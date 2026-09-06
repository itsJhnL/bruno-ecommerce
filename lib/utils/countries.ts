/**
 * The countries the house ships to.
 *
 * A short, honest list beats a 249-entry dropdown that includes places the
 * shipper does not serve. Extend it when the logistics contract does — and
 * `shipping_methods.country_codes` is what actually gates a method, so this
 * list only decides what the address form offers.
 */
export const SHIPPING_COUNTRIES: readonly { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "LU", name: "Luxembourg" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "DK", name: "Denmark" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "FI", name: "Finland" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong SAR" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "AE", name: "United Arab Emirates" },
] as const;

export const DEFAULT_COUNTRY = "US";

export function countryName(code: string): string {
  return SHIPPING_COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

/** What the postal field is called where the customer lives. */
export function postalLabel(code: string): string {
  if (code === "US") return "ZIP code";
  if (code === "CA") return "Postal code";
  if (code === "GB" || code === "IE") return "Postcode";
  return "Postal code";
}

/** Whether a state or province is expected, and what to call it. */
export function regionLabel(code: string): string | null {
  switch (code) {
    case "US":
      return "State";
    case "CA":
      return "Province";
    case "AU":
      return "State or territory";
    case "JP":
      return "Prefecture";
    default:
      return null;
  }
}
