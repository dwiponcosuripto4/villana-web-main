// Fixed custom feature categories for better villa comparison matching
export const AMENITY_CATEGORIES = {
  scenery: "scenery",
  pool: "pool",
  breakfast: "breakfast",
  connectivity: "connectivity",
  parking: "parking",
  bathroom: "bathroom",
  access: "access",
  "welcome-complimentary": "welcome-complimentary",
  "equipment-complimentary": "equipment-complimentary",
  housekeeping: "housekeeping",
  kitchen: "kitchen",
  AC: "AC",
  dining: "dining",
  gym: "gym",
  entertainment: "entertainment",
  security: "security",
  resto: "resto",
  "meeting-room": "meeting-room",
  playground: "playground",
} as const;

export type AmenityCategory = keyof typeof AMENITY_CATEGORIES;

// Category display names for UI
export const CATEGORY_DISPLAY_NAMES: Record<AmenityCategory, string> = {
  scenery: "Scenery & Views",
  pool: "Pool Features",
  breakfast: "Breakfast",
  connectivity: "Connectivity",
  parking: "Parking",
  bathroom: "Bathroom Amenities",
  access: "Access",
  "welcome-complimentary": "Welcome & Complimentary",
  "equipment-complimentary": "Equipment & Gear",
  housekeeping: "Housekeeping Services",
  AC: "Air Conditioning",
  kitchen: "Kitchen Amenities",
  dining: "Dining Facilities",
  gym: "Fitness & Wellness",
  entertainment: "Entertainment",
  security: "Security",
  resto: "Restaurant / Cafe",
  "meeting-room": "Meeting Room",
  playground: "Kids Playground",
};

// Keywords mapping to automatically categorize amenities
const CATEGORY_KEYWORDS: Record<AmenityCategory, string[]> = {
  dining: ["dining", "dining area", "makan malam"],
  gym: ["fitness", "gym"],
  "meeting-room": ["meeting room", "conference room", "business center"],
  playground: ["playground", "kids play area", "children's play"],
  resto: [
    "restaurant",
    "cafe",
    "dining",
    "dining area",
    "breakfast restaurant",
  ],
  entertainment: [
    "entertainment",
    "tv",
    "television",
    "media room",
    "smart tv",
    "netflix",
    "tv cabble",
    "karaoke",
  ],
  scenery: [
    "view",
    "views",
    "ocean view",
    "sea view",
    "mountain view",
    "valley view",
    "beach view",
    "panoramic",
    "scenic",
    "scenery",
    "landscape",
    "vista",
    "overlook",
    "garden view",
    "pool view",
    "sunset view",
    "sunrise view",
  ],
  pool: [
    "pool",
    "infinity pool",
    "private pool",
    "heated pool",
    "swimming pool",
    "poolside",
    "pool deck",
    "pool area",
    "jacuzzi",
    "hot tub",
    "spa pool",
    "plunge pool",
    "lap pool",
    "kiddie pool",
    "pool bar",
    "pool service",
  ],
  breakfast: [
    "breakfast",
    "morning meal",
    "continental breakfast",
    "full breakfast",
    "breakfast service",
    "breakfast included",
    "complimentary breakfast",
    "breakfast buffet",
    "breakfast menu",
    "morning dining",
  ],
  connectivity: [
    "wifi",
    "wi-fi",
    "internet",
    "wireless",
    "broadband",
    "high-speed internet",
    "starlink",
    "v-sat",
    "satellite internet",
    "fiber internet",
    "connectivity",
    "online access",
    "network",
    "wireless internet",
  ],
  parking: [
    "parking",
    "car park",
    "garage",
    "valet parking",
    "free parking",
    "private parking",
    "covered parking",
    "parking space",
    "parking lot",
    "parking area",
    "vehicle",
    "car",
    "automobile parking",
  ],
  bathroom: [
    "bathroom",
    "toilet",
    "washroom",
    "restroom",
    "ensuite",
    "en-suite",
    "powder room",
    "half bath",
    "full bath",
    "master bath",
    "guest bathroom",
    "outdoor bathroom",
    "indoor bathroom",
    "bathroom amenities",
    "bath",
    "shower",
    "bathtub",
    "vanity",
    "basin",
    "sink",
  ],
  access: [
    "access",
    "entrance",
    "entry",
    "private entrance",
    "beach access",
    "direct access",
    "exclusive access",
    "wheelchair access",
    "disabled access",
    "accessible",
    "accessibility",
    "ramp access",
    "elevator access",
    "stair access",
    "pathway",
    "walkway",
    "boardwalk",
  ],
  "welcome-complimentary": [
    "welcome",
    "welcome drink",
    "welcome amenities",
    "welcome basket",
    "welcome gift",
    "complimentary",
    "free",
    "included",
    "courtesy",
    "on the house",
    "gratis",
    "no charge",
    "welcome service",
    "arrival",
    "check-in",
    "greeting",
  ],
  "equipment-complimentary": [
    "equipment",
    "gear",
    "iron",
    "ironing",
    "snorkeling",
    "snorkel",
    "diving equipment",
    "water sports equipment",
    "beach equipment",
    "complimentary equipment",
    "free equipment",
    "included equipment",
    "kayak",
    "paddleboard",
    "surf board",
    "beach toys",
    "umbrella",
    "beach chair",
    "towels",
    "linens",
    "amenities kit",
  ],
  housekeeping: [
    "housekeeping",
    "cleaning",
    "maid service",
    "daily cleaning",
    "laundry",
    "washing",
    "dry cleaning",
    "linen service",
    "turndown service",
    "room service",
    "maintenance",
    "upkeep",
    "housekeeping service",
    "cleaning service",
    "domestic service",
  ],
  kitchen: [
    "kitchen",
    "kitchenette",
    "cooking",
    "stove",
    "oven",
    "microwave",
    "refrigerator",
    "fridge",
    "dishwasher",
    "blender",
    "coffee maker",
    "toaster",
    "cookware",
    "utensils",
    "dining",
    "cutlery",
    "plates",
    "glasses",
  ],
  AC: [
    "air conditioning",
    "AC",
    "air conditioner",
    "climate control",
    "cooling",
    "HVAC",
    "air con",
    "cool air",
    "temperature control",
    "central air",
    "split AC",
    "air cooler",
  ],
  security: ["security", "safe", "keamanan", "satpam"],
};

/**
 * Automatically categorize an amenity based on its name and value
 */
export function categorizeAmenity(
  amenityName: string,
  amenityValue?: string,
): AmenityCategory {
  const searchText = `${amenityName} ${amenityValue || ""}`.toLowerCase();

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return category as AmenityCategory;
      }
    }
  }

  // Default fallback - could be 'scenery' as a general category
  return "scenery";
}

/**
 * Group amenities by the new fixed categories
 */
export function groupAmenitiesByCategory(
  amenities: any[],
): Record<AmenityCategory, any[]> {
  const categorizedAmenities: Record<AmenityCategory, any[]> = Object.keys(
    AMENITY_CATEGORIES,
  ).reduce(
    (acc, category) => {
      acc[category as AmenityCategory] = [];
      return acc;
    },
    {} as Record<AmenityCategory, any[]>,
  );

  amenities.forEach((amenity) => {
    // Skip if amenity is null/undefined
    if (!amenity) return;

    // Handle both database format (name) and form format (amenityName)
    const amenityName = amenity.name || amenity.amenityName;
    const amenityValue = amenity.description || amenity.amenityValue;

    // Use explicit category from data if available, otherwise auto-categorize
    const category =
      amenity.category &&
      Object.keys(categorizedAmenities).includes(amenity.category)
        ? (amenity.category as AmenityCategory)
        : categorizeAmenity(amenityName, amenityValue);

    // Create a normalized amenity object
    const normalizedAmenity = {
      ...amenity,
      name: amenityName,
      amenityName: amenityName, // Keep both for compatibility
      description: amenity.description || amenityValue,
      amenityValue: amenityValue,
    };

    categorizedAmenities[category].push(normalizedAmenity);
  });

  // Sort amenities within each category by name
  Object.keys(categorizedAmenities).forEach((key) => {
    const category = key as AmenityCategory;
    categorizedAmenities[category].sort((a, b) => {
      const nameA = a.name || a.amenityName || "";
      const nameB = b.name || b.amenityName || "";
      return nameA.localeCompare(nameB);
    });
  });

  return categorizedAmenities;
}

/**
 * Get all amenity names from both villas for a specific category to enable side-by-side comparison
 */
export function getAllAmenityNamesForCategory(
  villa1Amenities: any[],
  villa2Amenities: any[],
): string[] {
  const allNames = new Set([
    ...villa1Amenities.map((a) => a.amenityName),
    ...villa2Amenities.map((a) => a.amenityName),
  ]);

  return Array.from(allNames).sort();
}

/**
 * Get ordered categories that have amenities in either villa for display in comparison table
 */
export function getOrderedCategoriesWithAmenities(
  villa1Amenities: Record<AmenityCategory, any[]>,
  villa2Amenities: Record<AmenityCategory, any[]>,
): AmenityCategory[] {
  // Define the preferred display order for categories
  const preferredOrder: AmenityCategory[] = [
    "scenery",
    "pool",
    "access",
    "connectivity",
    "parking",
    "bathroom",
    "breakfast",
    "welcome-complimentary",
    "equipment-complimentary",
    "housekeeping",
    "kitchen",
    "AC",
  ];

  // Ensure all categories from AMENITY_CATEGORIES are included, with preferred order when specified
  const allCategories = Object.keys(AMENITY_CATEGORIES) as AmenityCategory[];
  const categoryOrder: AmenityCategory[] = [
    ...preferredOrder.filter((cat) => allCategories.includes(cat)),
    ...allCategories.filter((cat) => !preferredOrder.includes(cat)),
  ];

  // Only include categories that have amenities in at least one villa
  return categoryOrder.filter(
    (category) =>
      (villa1Amenities[category] && villa1Amenities[category].length > 0) ||
      (villa2Amenities[category] && villa2Amenities[category].length > 0),
  );
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format amenities list for display in comparison table with HTML styling
 */
export function formatAmenitiesForDisplay(amenities: any[]): string {
  if (!amenities || amenities.length === 0) {
    return "<span class='text-gray-500'>-</span>";
  }

  return amenities
    .map((amenity) => {
      // Handle both database format (name, description) and form format (amenityName, amenityValue)
      const name = amenity.name || amenity.amenityName || "";
      const description = amenity.description || amenity.amenityValue || "";

      // Escape HTML for security
      const escapedName = escapeHtml(name);
      const escapedDescription = escapeHtml(description);

      if (description) {
        return `<div>
                  <strong class="font-medium">${escapedName}</strong>
                  <div class="text-gray-500">${escapedDescription}</div>
                </div>`;
      } else {
        return `<div>
                  <span class="font-medium">${escapedName}</span>
                </div>`;
      }
    })
    .join("");
}

/**
 * Check if two amenity lists are different for highlighting purposes
 */
export function areAmenitiesDifferent(
  amenities1: any[],
  amenities2: any[],
): boolean {
  // If one is empty and the other isn't, they're different
  if ((amenities1?.length || 0) === 0 && (amenities2?.length || 0) === 0) {
    return false;
  }
  if ((amenities1?.length || 0) === 0 || (amenities2?.length || 0) === 0) {
    return true;
  }

  // Compare the formatted strings
  const formatted1 = formatAmenitiesForDisplay(amenities1);
  const formatted2 = formatAmenitiesForDisplay(amenities2);

  return formatted1 !== formatted2;
}
