export function formatPrice(price: string | number): string {
  return (
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(price)) + "k"
  );
}

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatCityName(cityName: string): string {
  // Remove prefixes like "KABUPATEN" and "KOTA"
  const cleaned = cityName.replace(/^(KABUPATEN|KOTA)\s+/i, "").trim();

  return toTitleCase(cleaned);
}

export function formatGeoLocation(
  provinceName?: string,
  cityName?: string,
): string {
  if (!provinceName && !cityName) return "";

  const formattedProvince = provinceName ? toTitleCase(provinceName) : "";
  const formattedCity = cityName ? formatCityName(cityName) : "";

  if (formattedProvince && formattedCity) {
    return `${formattedProvince} > ${formattedCity}`;
  }

  return formattedProvince || formattedCity;
}

export function formatPlaceType(type?: string | null): string {
  if (!type) return '';
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
