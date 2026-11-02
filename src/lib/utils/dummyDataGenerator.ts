/**
 * Atomic dummy data generator functions for forms
 * Each function generates specific types of dummy data
 * Can be used independently or composed together
 */

// Villa title generator
export function generateVillaTitle(): string {
  const prefixes = [
    "Luxury",
    "Modern",
    "Cozy",
    "Spacious",
    "Elegant",
    "Charming",
    "Beautiful",
    "Stunning",
  ];
  const types = [
    "Villa",
    "Retreat",
    "Haven",
    "Paradise",
    "Residence",
    "Estate",
    "House",
    "Home",
  ];
  const suffixes = [
    "Beachfront",
    "Mountain View",
    "Garden",
    "Seaside",
    "Hillside",
    "Lakeside",
    "Forest",
    "Ocean View",
  ];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${prefix} ${suffix} ${type}`;
}

// Price range generator (returns min and max prices)
export function generatePriceRange(): { min: number; max: number } {
  const basePrice = Math.floor(Math.random() * 1500) + 500; // $500-$2000
  const maxPrice = basePrice + Math.floor(Math.random() * 1000) + 200; // Add $200-$1200

  return {
    min: basePrice,
    max: maxPrice,
  };
}

// Bedroom range generator
export function generateBedroomRange(): { min: number; max: number } {
  const min = Math.floor(Math.random() * 3) + 1; // 1-3 bedrooms min
  const max = min + Math.floor(Math.random() * 3) + 1; // Add 1-3 more bedrooms

  return { min, max };
}

// Units count generator
export function generateUnitsCount(): number {
  return Math.floor(Math.random() * 5) + 1; // 1-5 units
}

// Address generator
export function generateAddress(): string {
  const streetNumbers = [
    "123",
    "456",
    "789",
    "321",
    "654",
    "987",
    "147",
    "258",
  ];
  const streetNames = [
    "Ocean Drive",
    "Sunset Boulevard",
    "Palm Avenue",
    "Beach Road",
    "Mountain Path",
    "Garden Street",
    "Paradise Lane",
    "Coastal Highway",
  ];
  const cities = [
    "Bali",
    "Phuket",
    "Maldives",
    "Santorini",
    "Dubai",
    "Miami",
    "Mykonos",
    "Cancun",
  ];
  const countries = [
    "Indonesia",
    "Thailand",
    "Maldives",
    "Greece",
    "UAE",
    "USA",
    "Greece",
    "Mexico",
  ];

  const streetNumber =
    streetNumbers[Math.floor(Math.random() * streetNumbers.length)];
  const streetName =
    streetNames[Math.floor(Math.random() * streetNames.length)];
  const cityIndex = Math.floor(Math.random() * cities.length);
  const city = cities[cityIndex];
  const country = countries[cityIndex];

  return `${streetNumber} ${streetName}, ${city}, ${country}`;
}

// Location generator (Indonesian provinces and cities for realistic data)
export function generateLocation(): { province: string; city: string } {
  const indonesianLocations = [
    { province: "Bali", city: "Denpasar" },
    { province: "Bali", city: "Ubud" },
    { province: "Bali", city: "Sanur" },
    { province: "Bali", city: "Canggu" },
    { province: "Bali", city: "Seminyak" },
    { province: "Jawa Barat", city: "Bandung" },
    { province: "Jawa Barat", city: "Bogor" },
    { province: "Jawa Barat", city: "Depok" },
    { province: "Jawa Barat", city: "Bekasi" },
    { province: "DKI Jakarta", city: "Jakarta Pusat" },
    { province: "DKI Jakarta", city: "Jakarta Selatan" },
    { province: "DKI Jakarta", city: "Jakarta Utara" },
    { province: "Jawa Tengah", city: "Semarang" },
    { province: "Jawa Tengah", city: "Yogyakarta" },
    { province: "Jawa Tengah", city: "Solo" },
    { province: "Jawa Timur", city: "Surabaya" },
    { province: "Jawa Timur", city: "Malang" },
    { province: "Jawa Timur", city: "Batu" },
    { province: "Sumatera Utara", city: "Medan" },
    { province: "Sumatera Barat", city: "Padang" },
    { province: "Sulawesi Selatan", city: "Makassar" },
    { province: "Kalimantan Timur", city: "Balikpapan" },
    { province: "Nusa Tenggara Barat", city: "Lombok" },
    { province: "Kepulauan Riau", city: "Batam" },
  ];

  const location =
    indonesianLocations[Math.floor(Math.random() * indonesianLocations.length)];
  return location;
}

// Coordinates generator (returns latitude and longitude)
export function generateCoordinates(): { latitude: number; longitude: number } {
  // Generate coordinates for popular vacation destinations
  const locations = [
    { latitude: -8.4095, longitude: 115.1889 }, // Bali
    { latitude: 7.8804, longitude: 98.3923 }, // Phuket
    { latitude: 3.2028, longitude: 73.2207 }, // Maldives
    { latitude: 36.3932, longitude: 25.4615 }, // Santorini
    { latitude: 25.2048, longitude: 55.2708 }, // Dubai
    { latitude: 25.7617, longitude: -80.1918 }, // Miami
    { latitude: 37.4467, longitude: 25.3289 }, // Mykonos
    { latitude: 21.1619, longitude: -86.8515 }, // Cancun
  ];

  const location = locations[Math.floor(Math.random() * locations.length)];

  // Add small random offset for variety
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;

  return {
    latitude: parseFloat((location.latitude + latOffset).toFixed(8)),
    longitude: parseFloat((location.longitude + lngOffset).toFixed(8)),
  };
}

// Phone number generator
export function generatePhoneNumber(): string {
  const countryCode = "+" + (Math.floor(Math.random() * 90) + 10); // +10 to +99
  const areaCode = Math.floor(Math.random() * 900) + 100; // 100-999
  const firstPart = Math.floor(Math.random() * 900) + 100; // 100-999
  const secondPart = Math.floor(Math.random() * 9000) + 1000; // 1000-9999

  return `${countryCode} ${areaCode} ${firstPart} ${secondPart}`;
}

// Google Maps link generator
export function generateGoogleMapsLink(): string {
  const coords = generateCoordinates();
  return `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
}

// Description generator
export function generateDescription(): string {
  const intros = [
    "Experience luxury living in this stunning property",
    "Discover the perfect vacation retreat",
    "Enjoy breathtaking views from this beautiful villa",
    "Relax in style at this exclusive residence",
  ];

  const features = [
    "featuring modern amenities and elegant design",
    "with spacious rooms and premium furnishings",
    "offering panoramic views and private facilities",
    "combining comfort with sophisticated style",
  ];

  const extras = [
    "Perfect for families and groups",
    "Ideal for a romantic getaway",
    "Great for business travelers",
    "Suitable for long-term stays",
  ];

  const intro = intros[Math.floor(Math.random() * intros.length)];
  const feature = features[Math.floor(Math.random() * features.length)];
  const extra = extras[Math.floor(Math.random() * extras.length)];

  return `${intro}, ${feature}. ${extra}. The property includes a fully equipped kitchen, comfortable living spaces, and easy access to local attractions and beaches.`;
}

// Amenities generator
export function generateAmenities(): {
  hasAc: boolean;
  hasBathtub: boolean;
  hasTv: boolean;
  hasBreakfast: boolean;
} {
  return {
    hasAc: Math.random() > 0.3, // 70% chance of having AC
    hasBathtub: Math.random() > 0.5, // 50% chance
    hasTv: Math.random() > 0.2, // 80% chance
    hasBreakfast: Math.random() > 0.6, // 40% chance
  };
}

// Status generator
export function generateStatus(): "draft" | "published" {
  // Default to draft for safety
  return "draft";
}

// Custom amenities generator
export function generateCustomAmenities(): Array<{
  name: string;
  description: string;
  category: string;
  score: number;
}> {
  const amenitySamples = [
    // Pool features
    {
      name: "Private Pool",
      description:
        "Every unit has a private pool located in front of the main room with stunning garden views",
      category: "pool",
      score: 3,
    },
    {
      name: "Infinity Pool",
      description:
        "Heated infinity pool overlooking the ocean, 12x6 meters with shallow area for children",
      category: "pool",
      score: 3,
    },
    {
      name: "Pool Deck",
      description:
        "Spacious wooden deck surrounding the pool with sun loungers and parasols",
      category: "pool",
      score: 2,
    },

    // Scenery & Views
    {
      name: "Ocean View",
      description:
        "Unobstructed panoramic ocean views from all bedrooms and living areas",
      category: "scenery",
      score: 2,
    },
    {
      name: "Sunset Terrace",
      description:
        "Dedicated west-facing terrace perfect for watching sunsets with outdoor seating",
      category: "scenery",
      score: 1,
    },

    // Kitchen amenities
    {
      name: "Full Kitchen",
      description:
        "Fully equipped European kitchen with island counter and breakfast bar seating for 6",
      category: "kitchen",
      score: 2,
    },
    {
      name: "Premium Appliances",
      description:
        "High-end appliances including dishwasher, microwave, oven, coffee maker, and wine fridge",
      category: "kitchen",
      score: 2,
    },
    {
      name: "Complete Cookware",
      description:
        "Professional cookware set and dining service for 12 people including glassware and utensils",
      category: "kitchen",
      score: 1,
    },

    // Connectivity
    {
      name: "High-Speed WiFi",
      description:
        "100 Mbps fiber optic internet throughout the property with WiFi extenders in all rooms",
      category: "connectivity",
      score: 2,
    },
    {
      name: "Work Station",
      description:
        "Dedicated office space with ergonomic desk, chair, and power outlets for remote work",
      category: "connectivity",
      score: 1,
    },

    // Parking
    {
      name: "Private Parking",
      description:
        "Two covered parking spaces with direct access to villa and electric vehicle charging point",
      category: "parking",
      score: 2,
    },
    {
      name: "Secure Access",
      description:
        "Gated entrance with remote control and 24-hour security monitoring",
      category: "parking",
      score: 2,
    },

    // Bathroom amenities
    {
      name: "Luxury Bathroom",
      description:
        "Master bathroom with jacuzzi tub, rain shower, and dual vanity sinks",
      category: "bathroom",
      score: 3,
    },
    {
      name: "Premium Toiletries",
      description:
        "Organic bath products, plush towels, bathrobes, and slippers provided for all guests",
      category: "bathroom",
      score: 1,
    },

    // Welcome & Complimentary
    {
      name: "Welcome Package",
      description:
        "Complimentary fruit basket, local wine, and artisan chocolates upon arrival",
      category: "welcome-complimentary",
      score: 1,
    },
    {
      name: "Airport Transfer",
      description:
        "Free airport pickup and drop-off service for bookings of 4 nights or more",
      category: "welcome-complimentary",
      score: 3,
    },

    // Housekeeping
    {
      name: "Daily Housekeeping",
      description:
        "Full cleaning service available daily from 9 AM to 5 PM with turn-down service",
      category: "housekeeping",
      score: 2,
    },
    {
      name: "Laundry Service",
      description:
        "Complimentary laundry service twice per week with same-day return",
      category: "housekeeping",
      score: 1,
    },

    // Dining
    {
      name: "Dining Areas",
      description:
        "Indoor dining room for 8 and outdoor covered dining terrace for 10 guests",
      category: "dining",
      score: 2,
    },
    {
      name: "BBQ Facilities",
      description:
        "Professional gas BBQ grill with preparation area and complete utensil set",
      category: "dining",
      score: 2,
    },

    // Fitness
    {
      name: "Fitness Equipment",
      description:
        "Private gym area with treadmill, exercise bike, weights, and yoga equipment",
      category: "fitness",
      score: 2,
    },
    {
      name: "Spa Services",
      description:
        "In-villa massage and spa treatments available with certified therapists on request",
      category: "fitness",
      score: 3,
    },

    // Additional features
    {
      name: "Security System",
      description:
        "24/7 CCTV monitoring, alarm system, and on-site security guard after hours",
      category: "additional",
      score: 2,
    },
    {
      name: "Entertainment System",
      description:
        "65-inch Smart TV with Netflix, sound system, and collection of board games",
      category: "additional",
      score: 1,
    },
    {
      name: "Child Friendly",
      description:
        "Baby cot, high chair, pool fence, and children toys available upon request",
      category: "additional",
      score: 1,
    },
  ];

  // Randomly select 3-8 amenities
  const amenityCount = Math.floor(Math.random() * 6) + 3;
  const shuffled = [...amenitySamples].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, amenityCount);
}

// Composite function that uses all atomic generators
export function generateVillaDummyData() {
  const priceRange = generatePriceRange();
  const bedroomRange = generateBedroomRange();
  const coordinates = generateCoordinates();
  const amenities = generateAmenities();
  const location = generateLocation();

  return {
    title: generateVillaTitle(),
    priceMin: priceRange.min.toString(),
    priceMax: priceRange.max.toString(),
    unitsCount: generateUnitsCount(),
    bedroomMin: bedroomRange.min,
    bedroomMax: bedroomRange.max,
    hasAc: amenities.hasAc,
    hasBathtub: amenities.hasBathtub,
    hasTv: amenities.hasTv,
    hasBreakfast: amenities.hasBreakfast,
    description: generateDescription(),
    address: generateAddress(),
    latitude: coordinates.latitude.toString(),
    longitude: coordinates.longitude.toString(),
    googleMapsLink: generateGoogleMapsLink(),
    googlePlaceId: "",
    phoneNumber: generatePhoneNumber(),
    status: generateStatus(),
    province: location.province,
    city: location.city,
    amenities: generateCustomAmenities(), // Add custom amenities
  };
}
