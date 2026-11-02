const LOCATION_REGEX_MAPPINGS: { regex: RegExp; keywords: string[] }[] = [
  { regex: /yogyakarta/i, keywords: ["jogjakarta"] },
];

export function mapKeywordsByAddress(address: string): string[] {
  // Simple keyword mapping based on address content
  // For example if address contains Yogyakarta then map into 'jogja' or 'jogjakarta'
  const keywords: Set<string> = new Set();

  for (const mapping of LOCATION_REGEX_MAPPINGS) {
    if (mapping.regex.test(address)) {
      for (const keyword of mapping.keywords) {
        keywords.add(keyword);
      }
    }
  }

  return Array.from(keywords);
}
