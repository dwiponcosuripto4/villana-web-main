import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  decimal,
  varchar,
  uuid,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const registrationMethodEnum = pgEnum("registration_method", [
  "email",
  "google",
]);

export const user = pgTable("user", {
  id: serial("id").primaryKey(),
  age: integer("age"),
  username: text("username").unique(), // Make username optional for OAuth users
  passwordHash: text("password_hash"), // Make password optional for OAuth users
  role: varchar("role", { length: 20 }).default("viewer").notNull(), // admin, viewer, or owner

  // New registration fields
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  googleId: text("google_id").unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  profilePicture: text("profile_picture"),
  registrationMethod: registrationMethodEnum("registration_method")
    .default("email")
    .notNull(),
  locale: varchar("locale", { length: 5 }).default("auto").notNull(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export const villa = pgTable("villa", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  priceMin: decimal("price_min", { precision: 10, scale: 2 }).notNull(),
  priceMax: decimal("price_max", { precision: 10, scale: 2 }).notNull(),
  unitsCount: integer("units_count").default(1).notNull(),
  personCapacityMin: integer("person_capacity_min").default(0).notNull(),
  personCapacityMax: integer("person_capacity_max").default(0).notNull(),
  bedroomMin: integer("bedroom_min").notNull(),
  bedroomMax: integer("bedroom_max").notNull(),
  hasAc: boolean("has_ac").default(false).notNull(),
  hasBathtub: boolean("has_bathtub").default(false).notNull(),
  hasTv: boolean("has_tv").default(false).notNull(),
  hasBreakfast: boolean("has_breakfast").default(false).notNull(),
  hasPool: boolean("has_pool").default(false).notNull(),
  isPetFriendly: boolean("is_pet_friendly").default(false).notNull(),
  isKidFriendly: boolean("is_kid_friendly").default(false).notNull(),
  isSeniorFriendly: boolean("is_senior_friendly").default(false).notNull(),
  isSyaria: boolean("is_syaria").default(false).notNull(),
  description: text("description"),
  address: text("address").notNull(),
  provinceId: varchar("province_id", { length: 10 }).references(
    () => province.id,
  ),
  cityId: varchar("city_id", { length: 10 }).references(() => city.id),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  googleMapsLink: text("google_maps_link"),
  googlePlaceId: varchar("google_place_id", { length: 100 }),
  googleRating: decimal("google_rating", { precision: 3, scale: 2 }),
  googleRatingCount: integer("google_rating_count"),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("draft").notNull(), // draft or published
  viewCount: integer("view_count").default(0).notNull(),
  savedCount: integer("saved_count").default(0).notNull(),
  whatsappClicks: integer("whatsapp_clicks").default(0).notNull(),
  keywords: text("keywords").array(),
  pvr: decimal("pvr", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedSystemAt: timestamp("updated_system_at", {
    withTimezone: true,
    mode: "date",
  }),
  createdBy: integer("created_by").references(() => user.id),
  // Villa ownership - will be populated when ownership is claimed and approved
  ownerId: integer("owner_id").references(() => user.id),
});

export const villaLastUpdate = pgTable("villa_last_update", {
  id: uuid("id").defaultRandom().primaryKey(),
  villaId: integer("villa_id").references(() => villa.id, {
    onDelete: "cascade",
  }),
  lastUpdatedAt: timestamp("last_updated_at", {
    withTimezone: true,
    mode: "date",
  }),
  name: varchar("update_name", { length: 100 }),
  updatedBy: text("updated_by"),
  lastValue: text("last_value"),
});

export const villaImage = pgTable("villa_image", {
  id: uuid("id").defaultRandom().primaryKey(),
  villaId: integer("villa_id")
    .notNull()
    .references(() => villa.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  orderIndex: integer("order_index").default(0).notNull(),
  altText: varchar("alt_text", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const villaAmenity = pgTable("villa_amenity", {
  id: uuid("id").defaultRandom().primaryKey(),
  villaId: integer("villa_id")
    .notNull()
    .references(() => villa.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }),
  icon: varchar("icon", { length: 50 }),
  category: varchar("category", { length: 50 }).default("additional"),
  score: integer("score").default(0), // custom weight score for facility calculation, 1-3
  sortOrder: integer("sort_order").default(999),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const villaVideo = pgTable("villa_video", {
  id: uuid("id").defaultRandom().primaryKey(),
  villaId: integer("villa_id")
    .notNull()
    .references(() => villa.id, { onDelete: "cascade" }),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  orderIndex: integer("order_index").default(0).notNull(),
  altText: varchar("alt_text", { length: 255 }),
  store: varchar("store", { length: 20 }).default("local").notNull(), // local, youtube, vimeo
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const savedVilla = pgTable("saved_villa", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  villaId: integer("villa_id")
    .notNull()
    .references(() => villa.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const villaBedSize = pgTable("villa_bed_size", {
  id: uuid("id").defaultRandom().primaryKey(),
  villaId: integer("villa_id")
    .notNull()
    .references(() => villa.id, { onDelete: "cascade" }),
  bedSize: varchar("bed_size", { length: 50 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const province = pgTable("province", {
  id: varchar("id", { length: 10 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const city = pgTable("city", {
  id: varchar("id", { length: 10 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  provinceId: varchar("province_id", { length: 10 })
    .notNull()
    .references(() => province.id),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// Enum for search index types
export const searchIndexTypeEnum = pgEnum("search_index_type", [
  "villa",
  "city",
]);

// This table holds the search index entries for villas and cities.
// For know how the data are populated, see scripts/populate-search-index.ts
export const searchIndex = pgTable(
  "search_index",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    idxType: searchIndexTypeEnum("idx_type").notNull(),

    // reference to villa id (optional)
    villaId: integer("villa_id").references(() => villa.id, {
      onDelete: "cascade",
    }),

    // reference to city id (optional)
    cityId: varchar("city_id", { length: 10 }).references(() => city.id, {
      onDelete: "cascade",
    }),

    // slug for proper redirects (optional, for both cities and villas)
    slug: varchar("slug", { length: 200 }),

    // text that fulltext search will be performed on
    // indexed.
    text: varchar("text", { length: 1000 }).notNull(),
  },
  (table) => ({
    // PostgreSQL uses GIN index for fulltext search with to_tsvector
    fullTextIdx: index("fulltext_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.text})`,
    ),
  }),
);

// Enums for report and change request status
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
]);

export const reportCategoryEnum = pgEnum("report_category", [
  "scam",
  "invalid",
  "closed",
  "other",
]);

export const changeRequestStatusEnum = pgEnum("change_request_status", [
  "pending",
  "reviewed",
  "approved",
  "rejected",
]);

// Villa ownership enums
export const claimStatusEnum = pgEnum("claim_status", [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "appealed",
  "canceled",
]);

export const updateRequestTypeEnum = pgEnum("update_request_type", [
  "immediate",
  "pending_approval",
  "restricted",
]);

export const villaDataCategoryEnum = pgEnum("villa_data_category", [
  "basic_info",
  "pricing",
  "media",
  "amenities",
  "contact",
  "technical",
]);

// Villa Report Table
export const villaReport = pgTable("villa_report", {
  id: uuid("id").defaultRandom().primaryKey(),
  villaId: integer("villa_id")
    .notNull()
    .references(() => villa.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  category: reportCategoryEnum("category").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  customCategory: varchar("custom_category", { length: 100 }),
  status: reportStatusEnum("status").default("pending").notNull(),
  reviewedBy: integer("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// Villa Change Request Table
export const villaChangeRequest = pgTable("villa_change_request", {
  id: uuid("id").defaultRandom().primaryKey(),
  villaId: integer("villa_id")
    .notNull()
    .references(() => villa.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 255 }).notNull(),
  requestDetail: text("request_detail").notNull(),
  status: changeRequestStatusEnum("status").default("pending").notNull(),
  reviewedBy: integer("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const villaNearbyPlace = pgTable("villa_nearby_place", {
  id: uuid("id").defaultRandom().primaryKey(),
  villaId: integer("villa_id")
    .notNull()
    .references(() => villa.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  distanceKm: decimal("distance_km", { precision: 5, scale: 2 }).notNull(),
  accessType: varchar("access_type", { length: 50 }).notNull(), // 'walk', 'car', 'motorcycle', 'car_motorcycle', 'walk_car', 'all'
  placeType: varchar("place_type", { length: 100 }), // 'tourist_attraction', 'restaurant', 'beach', 'mountain', 'temple', etc.
  orderIndex: integer("order_index").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// Place Table - Independent place entities
export const place = pgTable(
  "place",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 255 }).unique().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: varchar("type", { length: 100 }), // restaurant, beach, temple, etc.
    category: varchar("category", { length: 100 }), // dining, nature, culture, etc.

    // Location data
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    address: text("address"),
    cityId: varchar("city_id", { length: 10 }).references(() => city.id),
    provinceId: varchar("province_id", { length: 10 }).references(
      () => province.id,
    ),

    // Google integration
    googlePlaceId: varchar("google_place_id", { length: 100 }),
    googleRating: decimal("google_rating", { precision: 3, scale: 2 }),
    googleRatingCount: integer("google_rating_count"),
    googleMapsLink: text("google_maps_link"),

    // Media
    mainImage: text("main_image"),

    // SEO
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),

    // Metadata
    status: varchar("status", { length: 20 }).default("draft").notNull(), // draft or published
    isActive: boolean("is_active").default(true).notNull(), // kept for backward compatibility
    viewCount: integer("view_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      slugIdx: index("place_slug_idx").on(table.slug),
      locationIdx: index("place_location_idx").on(
        table.latitude,
        table.longitude,
      ),
      cityIdx: index("place_city_idx").on(table.cityId),
      typeIdx: index("place_type_idx").on(table.type),
    };
  },
);

// Place Image Table - Multiple images for places
export const placeImage = pgTable(
  "place_image",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    orderIndex: integer("order_index").default(0).notNull(),
    altText: varchar("alt_text", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      placeIdx: index("place_image_place_idx").on(table.placeId),
      orderIdx: index("place_image_order_idx").on(
        table.placeId,
        table.orderIndex,
      ),
    };
  },
);

// Villa Place Junction Table - Links villas to places
export const villaPlace = pgTable(
  "villa_place",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    villaId: integer("villa_id")
      .notNull()
      .references(() => villa.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    distanceKm: decimal("distance_km", { precision: 5, scale: 2 }).notNull(),
    accessType: varchar("access_type", { length: 50 }).notNull(), // walking, driving, etc.
    travelTimeMinutes: integer("travel_time_minutes"),
    notes: text("notes"),
    orderIndex: integer("order_index").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      villaIdx: index("villa_place_villa_idx").on(table.villaId),
      placeIdx: index("villa_place_place_idx").on(table.placeId),
      uniqueVillaPlace: index("villa_place_unique_idx").on(
        table.villaId,
        table.placeId,
      ),
    };
  },
);

// Villa Ownership Claim Table
export const villaOwnershipClaim = pgTable("villa_ownership_claim", {
  id: uuid("id").defaultRandom().primaryKey(),
  villaId: integer("villa_id")
    .notNull()
    .references(() => villa.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  claimReason: text("claim_reason").notNull(),
  ownershipProof: text("ownership_proof"), // JSON with document URLs/descriptions
  contactVerification: text("contact_verification"), // Phone, email verification
  additionalInfo: text("additional_info"),
  verificationCode: varchar("verification_code", { length: 5 }), // 5-digit code for phone verification
  status: claimStatusEnum("status").default("pending").notNull(),
  reviewedBy: integer("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
  rejectionReason: text("rejection_reason"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// Villa Ownership Table (approved ownership records)
export const villaOwnership = pgTable("villa_ownership", {
  id: uuid("id").defaultRandom().primaryKey(),
  villaId: integer("villa_id")
    .notNull()
    .references(() => villa.id, { onDelete: "cascade" })
    .unique(), // One owner per villa
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  claimId: uuid("claim_id")
    .notNull()
    .references(() => villaOwnershipClaim.id),
  ownershipType: varchar("ownership_type", { length: 50 })
    .default("owner")
    .notNull(), // owner, manager, authorized_representative
  verificationLevel: varchar("verification_level", { length: 20 })
    .default("basic")
    .notNull(), // basic, verified, premium
  canEditImmediately: boolean("can_edit_immediately").default(true).notNull(),
  canEditPricing: boolean("can_edit_pricing").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  transferredAt: timestamp("transferred_at", {
    withTimezone: true,
    mode: "date",
  }),
  transferredTo: integer("transferred_to").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

// Villa Update Request Table (for owner-initiated changes requiring approval)
export const villaUpdateRequest = pgTable("villa_update_request", {
  id: uuid("id").defaultRandom().primaryKey(),
  villaId: integer("villa_id")
    .notNull()
    .references(() => villa.id, { onDelete: "cascade" }),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  updateType: updateRequestTypeEnum("update_type").notNull(),
  dataCategory: villaDataCategoryEnum("data_category").notNull(),
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  currentValue: text("current_value"),
  proposedValue: text("proposed_value").notNull(),
  changeReason: text("change_reason"),
  status: changeRequestStatusEnum("status").default("pending").notNull(),
  reviewedBy: integer("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
  adminNotes: text("admin_notes"),
  appliedAt: timestamp("applied_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Villa = typeof villa.$inferSelect;
export type VillaImage = typeof villaImage.$inferSelect;
export type VillaAmenity = typeof villaAmenity.$inferSelect;
export type VillaVideo = typeof villaVideo.$inferSelect;
export type SavedVilla = typeof savedVilla.$inferSelect;
export type VillaBedSize = typeof villaBedSize.$inferSelect;
export type Province = typeof province.$inferSelect;
export type City = typeof city.$inferSelect;
export type VillaReport = typeof villaReport.$inferSelect;
export type VillaChangeRequest = typeof villaChangeRequest.$inferSelect;
export type VillaNearbyPlace = typeof villaNearbyPlace.$inferSelect;
export type Place = typeof place.$inferSelect;
export type PlaceImage = typeof placeImage.$inferSelect;
export type VillaPlace = typeof villaPlace.$inferSelect;
export type VillaOwnershipClaim = typeof villaOwnershipClaim.$inferSelect;
export type VillaOwnership = typeof villaOwnership.$inferSelect;
export type VillaUpdateRequest = typeof villaUpdateRequest.$inferSelect;

// Contact Message table
export const contactMessage = pgTable("contact_message", {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  userId: integer("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, read, replied
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export type ContactMessage = typeof contactMessage.$inferSelect;

// Villa button click tracking table
export const villaButtonClickTypeEnum = pgEnum("villa_button_click_type", [
  "whatsapp_contact",
]);

export const villaButtonClick = pgTable(
  "villa_button_click",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    villaId: integer("villa_id")
      .notNull()
      .references(() => villa.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => user.id, {
      onDelete: "set null",
    }), // nullable for anonymous users
    buttonType: villaButtonClickTypeEnum("button_type").notNull(),
    userIp: varchar("user_ip", { length: 45 }), // supports both IPv4 and IPv6
    userAgent: text("user_agent"),
    referer: text("referer"), // referring page URL
    clickedAt: timestamp("clicked_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      villaIdx: index("villa_button_click_villa_idx").on(table.villaId),
      userIdx: index("villa_button_click_user_idx").on(table.userId),
      typeIdx: index("villa_button_click_type_idx").on(table.buttonType),
      timeIdx: index("villa_button_click_time_idx").on(table.clickedAt),
      villaTypeIdx: index("villa_button_click_villa_type_idx").on(
        table.villaId,
        table.buttonType,
      ),
    };
  },
);

export type VillaButtonClick = typeof villaButtonClick.$inferSelect;

// OTA (Online Travel Agent) enums and tables
export const otaProviderEnum = pgEnum("ota_provider", [
  "agoda",
  "traveloka",
  "tiket_com",
  "booking_com",
  "airbnb",
  "trip_com",
  "expedia",
  "other",
]);

export const priceModeEnum = pgEnum("price_mode", [
  "auto_fetch",
  "manual",
  "none",
]);

// Villa OTA Link Table - Affiliate links to OTAs
export const villaOtaLink = pgTable(
  "villa_ota_link",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    villaId: integer("villa_id")
      .notNull()
      .references(() => villa.id, { onDelete: "cascade" }),
    provider: otaProviderEnum("provider").notNull(),
    affiliateUrl: text("affiliate_url").notNull(),
    customLabel: varchar("custom_label", { length: 100 }), // optional override display name

    // Price fields
    priceMode: priceModeEnum("price_mode").default("none").notNull(),
    manualPrice: decimal("manual_price", { precision: 12, scale: 2 }), // price if mode=manual
    fetchedPrice: decimal("fetched_price", { precision: 12, scale: 2 }), // cached price if mode=auto_fetch
    priceCurrency: varchar("price_currency", { length: 3 }).default("IDR"),
    priceUpdatedAt: timestamp("price_updated_at", {
      withTimezone: true,
      mode: "date",
    }),

    isActive: boolean("is_active").default(true).notNull(),
    orderIndex: integer("order_index").default(0).notNull(),
    clickCount: integer("click_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      villaIdx: index("villa_ota_link_villa_idx").on(table.villaId),
      providerIdx: index("villa_ota_link_provider_idx").on(table.provider),
      activeIdx: index("villa_ota_link_active_idx").on(
        table.villaId,
        table.isActive,
      ),
    };
  },
);

// Villa OTA Click Table - Analytics for OTA link clicks
export const villaOtaClick = pgTable(
  "villa_ota_click",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    villaId: integer("villa_id")
      .notNull()
      .references(() => villa.id, { onDelete: "cascade" }),
    otaLinkId: uuid("ota_link_id")
      .notNull()
      .references(() => villaOtaLink.id, { onDelete: "cascade" }),
    provider: otaProviderEnum("provider").notNull(),
    userId: integer("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    userIp: varchar("user_ip", { length: 45 }),
    userAgent: text("user_agent"),
    referer: text("referer"),
    clickedAt: timestamp("clicked_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      villaIdx: index("villa_ota_click_villa_idx").on(table.villaId),
      otaLinkIdx: index("villa_ota_click_ota_link_idx").on(table.otaLinkId),
      providerIdx: index("villa_ota_click_provider_idx").on(table.provider),
      timeIdx: index("villa_ota_click_time_idx").on(table.clickedAt),
    };
  },
);

export type VillaOtaLink = typeof villaOtaLink.$inferSelect;
export type VillaOtaClick = typeof villaOtaClick.$inferSelect;

// Cache table for "Other Villas" recommendations
export const villaOtherVillasCache = pgTable("villa_other_villas_cache", {
  villaId: integer("villa_id")
    .primaryKey()
    .references(() => villa.id, { onDelete: "cascade" }),
  otherVillaIds: integer("other_villa_ids").array().notNull(), // Array of villa IDs [id1, id2, id3]
  distances: decimal("distances", { precision: 6, scale: 2 }).array(), // Array of distances in km [d1, d2, d3] - null means same city fallback
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export type VillaOtherVillasCache = typeof villaOtherVillasCache.$inferSelect;

// ==================== BLOG SYSTEM ====================

// Post status enum
export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "published",
  "archived",
]);

// Category table for blog posts
export const category = pgTable(
  "category",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).unique().notNull(),
    description: text("description"),
    orderIndex: integer("order_index").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      slugIdx: index("category_slug_idx").on(table.slug),
    };
  },
);

// Tag table for blog posts
export const tag = pgTable(
  "tag",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    slug: varchar("slug", { length: 50 }).unique().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      slugIdx: index("tag_slug_idx").on(table.slug),
    };
  },
);

// Post table for blog articles
export const post = pgTable(
  "post",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).unique().notNull(),
    excerpt: text("excerpt"), // Short summary for listings
    content: text("content").notNull(), // Markdown content
    featuredImage: text("featured_image"), // URL to featured image
    featuredImageAlt: varchar("featured_image_alt", { length: 255 }),
    categoryId: integer("category_id").references(() => category.id, {
      onDelete: "set null",
    }),
    authorId: integer("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    cityId: varchar("city_id", { length: 10 }).references(() => city.id, {
      onDelete: "set null",
    }),
    status: postStatusEnum("status").default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),

    // SEO fields
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),

    // Analytics
    viewCount: integer("view_count").default(0).notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      slugIdx: index("post_slug_idx").on(table.slug),
      statusIdx: index("post_status_idx").on(table.status),
      categoryIdx: index("post_category_idx").on(table.categoryId),
      publishedAtIdx: index("post_published_at_idx").on(table.publishedAt),
      authorIdx: index("post_author_idx").on(table.authorId),
      cityIdx: index("post_city_idx").on(table.cityId),
    };
  },
);

// Post-Tag junction table (many-to-many)
export const postTag = pgTable(
  "post_tag",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      postIdx: index("post_tag_post_idx").on(table.postId),
      tagIdx: index("post_tag_tag_idx").on(table.tagId),
    };
  },
);

// Blog type exports
export type Category = typeof category.$inferSelect;
export type Tag = typeof tag.$inferSelect;
export type Post = typeof post.$inferSelect;
export type PostTag = typeof postTag.$inferSelect;
