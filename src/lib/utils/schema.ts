/**
 * Schema.org structured data utilities
 *
 * This module provides functions to generate consistent Schema.org markup
 * for different types of content (villas, places, organizations, etc.)
 */

import { siteConfig, getAbsoluteUrl } from "$lib/config/site";

export interface BaseEntity {
  "@context": "https://schema.org";
  "@type": string;
  name: string;
  description?: string;
  url?: string;
  image?: string | string[];
}

export interface GeoCoordinates {
  "@type": "GeoCoordinates";
  latitude: number | string;
  longitude: number | string;
}

export interface PostalAddress {
  "@type": "PostalAddress";
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  addressCountry: string;
  postalCode?: string;
}

export interface AggregateRating {
  "@type": "AggregateRating";
  ratingValue: number | string;
  reviewCount?: number;
  bestRating?: number;
  worstRating?: number;
}

export interface Offer {
  "@type": "Offer";
  priceCurrency: string;
  price: string | number;
  availability?: string;
  validFrom?: string;
  validThrough?: string;
  priceValidUntil?: string;
  seller?: any;
}

/**
 * Generate Organization schema for the company
 */
export function generateOrganizationSchema(): any {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteConfig.name,
    "url": siteConfig.url,
    "description": siteConfig.description,
    "logo": getAbsoluteUrl("/images/villana-logo.png"),
    "sameAs": [
      // Add social media URLs here when available
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "availableLanguage": ["Indonesian", "English"]
    }
  };
}

/**
 * Generate breadcrumb list schema
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): any {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": getAbsoluteUrl(crumb.url)
    }))
  };
}

/**
 * Generate RealEstateListing schema for villas
 */
export function generateVillaSchema(villa: any): any {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": ["RealEstateListing", "Product", "Accommodation"],
    "name": villa.title,
    "description": villa.description,
    "url": getAbsoluteUrl(`/villa/${villa.slug}`),
    "identifier": villa.id,
    "sku": villa.slug,
    "category": "Villa Rental",
    "brand": {
      "@type": "Brand",
      "name": siteConfig.name
    }
  };

  // Images
  if (villa.images && villa.images.length > 0) {
    schema.image = villa.images.map((img: any) =>
      img.imageUrl.startsWith('http') ? img.imageUrl : getAbsoluteUrl(img.imageUrl)
    );
  }

  // Address
  if (villa.address) {
    schema.address = {
      "@type": "PostalAddress",
      "streetAddress": villa.address,
      "addressCountry": "ID"
    };
  }

  // Geo coordinates
  if (villa.latitude && villa.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      "latitude": parseFloat(villa.latitude),
      "longitude": parseFloat(villa.longitude)
    };
  }

  // Pricing offers
  if (villa.priceMin) {
    schema.offers = {
      "@type": "Offer",
      "priceCurrency": "IDR",
      "price": villa.priceMin,
      "availability": "https://schema.org/InStock",
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      "seller": {
        "@type": "Organization",
        "name": siteConfig.name
      }
    };

    if (villa.priceMax && villa.priceMax !== villa.priceMin) {
      schema.offers.priceRange = `${villa.priceMin}-${villa.priceMax}`;
    }
  }

  // Property features
  if (villa.bedroomMax || villa.personCapacityMax) {
    schema.accommodationCategory = "Villa";

    if (villa.bedroomMax) {
      schema.numberOfRooms = villa.bedroomMax;
      schema.numberOfBedrooms = villa.bedroomMax;
    }

    if (villa.personCapacityMax) {
      schema.occupancy = {
        "@type": "QuantitativeValue",
        "maxValue": villa.personCapacityMax,
        "unitCode": "C62" // Person
      };
    }
  }

  // Amenities
  if (villa.amenities && villa.amenities.length > 0) {
    schema.amenityFeature = villa.amenities.map((amenity: any) => ({
      "@type": "LocationFeatureSpecification",
      "name": amenity.name,
      "value": true
    }));
  }

  // Rating
  if (villa.googleRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": villa.googleRating,
      "reviewCount": villa.googleRatingCount || 1,
      "bestRating": 5,
      "worstRating": 1
    };
  }

  return schema;
}

/**
 * Generate Place schema for tourist attractions, restaurants, etc.
 */
export function generatePlaceSchema(place: any): any {
  // Determine the most specific schema type based on place type
  let schemaType = "Place";

  const typeMapping: Record<string, string> = {
    "restaurant": "Restaurant",
    "tourist_attraction": "TouristAttraction",
    "museum": "Museum",
    "park": "Park",
    "beach": "Beach",
    "temple": "PlaceOfWorship",
    "hospital": "Hospital",
    "airport": "Airport",
    "train_station": "TrainStation",
    "bus_station": "BusStation",
    "shopping": "ShoppingCenter",
    "market": "ShoppingCenter"
  };

  if (place.type && typeMapping[place.type]) {
    schemaType = typeMapping[place.type];
  }

  const schema: any = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "name": place.name,
    "description": place.description,
    "url": getAbsoluteUrl(`/place/${place.slug}`),
    "identifier": place.id
  };

  // Images
  if (place.images && place.images.length > 0) {
    schema.image = place.images.map((img: any) =>
      img.imageUrl.startsWith('http') ? img.imageUrl : getAbsoluteUrl(img.imageUrl)
    );
  } else if (place.mainImage && place.mainImage !== "/images/default-place.jpg") {
    schema.image = place.mainImage.startsWith('http') ? place.mainImage : getAbsoluteUrl(place.mainImage);
  }

  // Address
  if (place.address) {
    schema.address = {
      "@type": "PostalAddress",
      "streetAddress": place.address,
      "addressCountry": "ID"
    };
  } else if (place.city || place.province) {
    schema.address = {
      "@type": "PostalAddress",
      "addressLocality": place.city?.name,
      "addressRegion": place.province?.name,
      "addressCountry": "ID"
    };
  }

  // Geo coordinates
  if (place.latitude && place.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      "latitude": parseFloat(place.latitude),
      "longitude": parseFloat(place.longitude)
    };
  }

  // Google Maps link
  if (place.googleMapsLink) {
    schema.hasMap = place.googleMapsLink;
  }

  // Rating
  if (place.googleRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": place.googleRating,
      "reviewCount": place.googleRatingCount || 1,
      "bestRating": 5,
      "worstRating": 1
    };
  }

  // Additional properties for specific types
  if (schemaType === "Restaurant") {
    schema.servesCuisine = place.category || "Indonesian";
  }

  if (schemaType === "TouristAttraction" && place.category) {
    schema.touristType = place.category;
  }

  return schema;
}

/**
 * Generate FAQ schema for pages with question/answer content
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): any {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generate WebSite schema with search functionality
 */
export function generateWebSiteSchema(): any {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteConfig.name,
    "url": siteConfig.url,
    "description": siteConfig.description,
    "publisher": generateOrganizationSchema(),
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteConfig.url}/explore?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Generate Article schema for blog posts or informational content
 */
export function generateArticleSchema(article: {
  title: string;
  description: string;
  url: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  image?: string;
}): any {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "url": getAbsoluteUrl(article.url),
    "publisher": generateOrganizationSchema()
  };

  if (article.publishedTime) {
    schema.datePublished = article.publishedTime;
  }

  if (article.modifiedTime) {
    schema.dateModified = article.modifiedTime;
  }

  if (article.author) {
    schema.author = {
      "@type": "Person",
      "name": article.author
    };
  }

  if (article.image) {
    schema.image = article.image.startsWith('http') ? article.image : getAbsoluteUrl(article.image);
  }

  return schema;
}