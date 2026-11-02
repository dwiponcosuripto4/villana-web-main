export type OtaProvider =
  | "agoda"
  | "traveloka"
  | "tiket_com"
  | "booking_com"
  | "airbnb"
  | "trip_com"
  | "expedia"
  | "other";

export interface OtaProviderConfig {
  name: string;
  color: string;
  bgColor: string;
  hoverBgColor: string;
  borderColor: string;
  logo: string | null;
  hasApiSupport: boolean;
}

export const OTA_PROVIDERS: Record<OtaProvider, OtaProviderConfig> = {
  agoda: {
    name: "Agoda",
    color: "#5392F9",
    bgColor: "bg-blue-50",
    hoverBgColor: "hover:bg-blue-100",
    borderColor: "border-blue-200",
    logo: "/images/ota/agoda.svg",
    hasApiSupport: true,
  },
  traveloka: {
    name: "Traveloka",
    color: "#0064D2",
    bgColor: "bg-blue-50",
    hoverBgColor: "hover:bg-blue-100",
    borderColor: "border-blue-200",
    logo: "/images/ota/traveloka.svg",
    hasApiSupport: true,
  },
  tiket_com: {
    name: "Tiket.com",
    color: "#0064FF",
    bgColor: "bg-blue-50",
    hoverBgColor: "hover:bg-blue-100",
    borderColor: "border-blue-200",
    logo: "/images/ota/tiket.svg",
    hasApiSupport: true,
  },
  booking_com: {
    name: "Booking.com",
    color: "#003580",
    bgColor: "bg-blue-50",
    hoverBgColor: "hover:bg-blue-100",
    borderColor: "border-blue-900",
    logo: "/images/ota/booking.svg",
    hasApiSupport: true,
  },
  airbnb: {
    name: "Airbnb",
    color: "#FF5A5F",
    bgColor: "bg-red-50",
    hoverBgColor: "hover:bg-red-100",
    borderColor: "border-red-200",
    logo: "/images/ota/airbnb.svg",
    hasApiSupport: false,
  },
  trip_com: {
    name: "Trip.com",
    color: "#287DFA",
    bgColor: "bg-blue-50",
    hoverBgColor: "hover:bg-blue-100",
    borderColor: "border-blue-200",
    logo: "/images/ota/trip.svg",
    hasApiSupport: false,
  },
  expedia: {
    name: "Expedia",
    color: "#FFCC00",
    bgColor: "bg-yellow-50",
    hoverBgColor: "hover:bg-yellow-100",
    borderColor: "border-yellow-200",
    logo: "/images/ota/expedia.svg",
    hasApiSupport: true,
  },
  other: {
    name: "Other",
    color: "#6B7280",
    bgColor: "bg-gray-50",
    hoverBgColor: "hover:bg-gray-100",
    borderColor: "border-gray-200",
    logo: null,
    hasApiSupport: false,
  },
};

/**
 * Get provider config by provider key
 */
export function getOtaProviderConfig(provider: OtaProvider): OtaProviderConfig {
  return OTA_PROVIDERS[provider] || OTA_PROVIDERS.other;
}

/**
 * Get display name for a provider (uses custom label if provided)
 */
export function getOtaDisplayName(
  provider: OtaProvider,
  customLabel?: string | null
): string {
  if (customLabel) return customLabel;
  return OTA_PROVIDERS[provider]?.name || provider;
}

/**
 * Get all provider keys for dropdowns
 */
export function getOtaProviderOptions(): Array<{
  value: OtaProvider;
  label: string;
}> {
  return Object.entries(OTA_PROVIDERS).map(([key, config]) => ({
    value: key as OtaProvider,
    label: config.name,
  }));
}

/**
 * Format price for display
 */
export function formatOtaPrice(
  price: string | null,
  currency: string = "IDR"
): string | null {
  if (!price) return null;

  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice)) return null;

  if (currency === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericPrice);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(numericPrice);
}
