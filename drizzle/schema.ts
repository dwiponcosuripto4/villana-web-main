import { pgTable, index, foreignKey, unique, uuid, varchar, text, numeric, integer, boolean, timestamp, serial, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const changeRequestStatus = pgEnum("change_request_status", ['pending', 'reviewed', 'approved', 'rejected'])
export const claimStatus = pgEnum("claim_status", ['pending', 'under_review', 'approved', 'rejected', 'appealed'])
export const registrationMethod = pgEnum("registration_method", ['email', 'google'])
export const reportCategory = pgEnum("report_category", ['scam', 'invalid', 'closed', 'other'])
export const reportStatus = pgEnum("report_status", ['pending', 'reviewed', 'resolved', 'dismissed'])
export const searchIndexType = pgEnum("search_index_type", ['villa', 'city'])
export const updateRequestType = pgEnum("update_request_type", ['immediate', 'pending_approval', 'restricted'])
export const villaButtonClickType = pgEnum("villa_button_click_type", ['whatsapp_contact'])
export const villaDataCategory = pgEnum("villa_data_category", ['basic_info', 'pricing', 'media', 'amenities', 'contact', 'technical'])


export const place = pgTable("place", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	type: varchar({ length: 100 }),
	category: varchar({ length: 100 }),
	latitude: numeric({ precision: 10, scale:  8 }).notNull(),
	longitude: numeric({ precision: 11, scale:  8 }).notNull(),
	address: text(),
	cityId: varchar("city_id", { length: 10 }),
	provinceId: varchar("province_id", { length: 10 }),
	googlePlaceId: varchar("google_place_id", { length: 100 }),
	googleRating: numeric("google_rating", { precision: 3, scale:  2 }),
	googleRatingCount: integer("google_rating_count"),
	googleMapsLink: text("google_maps_link"),
	mainImage: text("main_image"),
	metaTitle: text("meta_title"),
	metaDescription: text("meta_description"),
	isActive: boolean("is_active").default(true).notNull(),
	viewCount: integer("view_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	status: varchar({ length: 20 }).default('draft').notNull(),
}, (table) => [
	index("place_city_idx").using("btree", table.cityId.asc().nullsLast().op("text_ops")),
	index("place_location_idx").using("btree", table.latitude.asc().nullsLast().op("numeric_ops"), table.longitude.asc().nullsLast().op("numeric_ops")),
	index("place_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("place_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.cityId],
			foreignColumns: [city.id],
			name: "place_city_id_city_id_fk"
		}),
	foreignKey({
			columns: [table.provinceId],
			foreignColumns: [province.id],
			name: "place_province_id_province_id_fk"
		}),
	unique("place_slug_unique").on(table.slug),
]);

export const placeImage = pgTable("place_image", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	placeId: uuid("place_id").notNull(),
	imageUrl: text("image_url").notNull(),
	thumbnailUrl: text("thumbnail_url"),
	orderIndex: integer("order_index").default(0).notNull(),
	altText: varchar("alt_text", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("place_image_order_idx").using("btree", table.placeId.asc().nullsLast().op("int4_ops"), table.orderIndex.asc().nullsLast().op("int4_ops")),
	index("place_image_place_idx").using("btree", table.placeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.placeId],
			foreignColumns: [place.id],
			name: "place_image_place_id_place_id_fk"
		}).onDelete("cascade"),
]);

export const savedVilla = pgTable("saved_villa", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: integer("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "saved_villa_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "saved_villa_villa_id_villa_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	userId: integer("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}),
]);

export const villaAmenity = pgTable("villa_amenity", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: varchar({ length: 500 }),
	icon: varchar({ length: 50 }),
	category: varchar({ length: 50 }).default('additional'),
	sortOrder: integer("sort_order").default(999),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	score: integer().default(0),
}, (table) => [
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "villa_amenity_villa_id_villa_id_fk"
		}).onDelete("cascade"),
]);

export const searchIndex = pgTable("search_index", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	idxType: searchIndexType("idx_type").notNull(),
	villaId: integer("villa_id"),
	cityId: varchar("city_id", { length: 10 }),
	slug: varchar({ length: 200 }),
	text: varchar({ length: 1000 }).notNull(),
	villaSlug: varchar("villa_slug", { length: 200 }),
}, (table) => [
	index("fulltext_idx").using("gin", sql`to_tsvector('english'::regconfig, (text)::text)`),
	foreignKey({
			columns: [table.cityId],
			foreignColumns: [city.id],
			name: "search_index_city_id_city_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "search_index_villa_id_villa_id_fk"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	age: integer(),
	username: text(),
	passwordHash: text("password_hash"),
	role: varchar({ length: 20 }).default('viewer').notNull(),
	email: text().notNull(),
	fullName: text("full_name").notNull(),
	phone: text(),
	address: text(),
	googleId: text("google_id"),
	emailVerified: boolean("email_verified").default(false).notNull(),
	profilePicture: text("profile_picture"),
	registrationMethod: registrationMethod("registration_method").default('email').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	id: serial().primaryKey().notNull(),
	locale: varchar({ length: 5 }).default('auto').notNull(),
}, (table) => [
	unique("user_username_unique").on(table.username),
	unique("user_email_unique").on(table.email),
	unique("user_google_id_unique").on(table.googleId),
]);

export const villaBedSize = pgTable("villa_bed_size", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id").notNull(),
	bedSize: varchar("bed_size", { length: 50 }).notNull(),
	quantity: integer().default(1).notNull(),
	orderIndex: integer("order_index").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "villa_bed_size_villa_id_villa_id_fk"
		}).onDelete("cascade"),
]);

export const villaImage = pgTable("villa_image", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id").notNull(),
	imageUrl: text("image_url").notNull(),
	thumbnailUrl: text("thumbnail_url"),
	orderIndex: integer("order_index").default(0).notNull(),
	altText: varchar("alt_text", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "villa_image_villa_id_villa_id_fk"
		}).onDelete("cascade"),
]);

export const villa = pgTable("villa", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	priceMin: numeric("price_min", { precision: 10, scale:  2 }).notNull(),
	priceMax: numeric("price_max", { precision: 10, scale:  2 }).notNull(),
	unitsCount: integer("units_count").default(1).notNull(),
	bedroomMin: integer("bedroom_min").notNull(),
	bedroomMax: integer("bedroom_max").notNull(),
	hasAc: boolean("has_ac").default(false).notNull(),
	hasBathtub: boolean("has_bathtub").default(false).notNull(),
	hasTv: boolean("has_tv").default(false).notNull(),
	hasBreakfast: boolean("has_breakfast").default(false).notNull(),
	description: text(),
	address: text().notNull(),
	provinceId: varchar("province_id", { length: 10 }),
	cityId: varchar("city_id", { length: 10 }),
	latitude: numeric({ precision: 10, scale:  8 }),
	longitude: numeric({ precision: 11, scale:  8 }),
	googleMapsLink: text("google_maps_link"),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	status: varchar({ length: 20 }).default('draft').notNull(),
	viewCount: integer("view_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	savedCount: integer("saved_count").default(0).notNull(),
	keywords: text().array(),
	googlePlaceId: varchar("google_place_id", { length: 100 }),
	googleRating: numeric("google_rating", { precision: 3, scale:  2 }),
	googleRatingCount: integer("google_rating_count"),
	personCapacityMin: integer("person_capacity_min").default(0).notNull(),
	personCapacityMax: integer("person_capacity_max").default(0).notNull(),
	updatedSystemAt: timestamp("updated_system_at", { withTimezone: true, mode: 'string' }),
	pvr: numeric({ precision: 3, scale:  2 }),
	createdBy: integer("created_by"),
	ownerId: integer("owner_id"),
	hasPool: boolean("has_pool").default(false).notNull(),
	isPetFriendly: boolean("is_pet_friendly").default(false).notNull(),
	isKidFriendly: boolean("is_kid_friendly").default(false).notNull(),
	isSeniorFriendly: boolean("is_senior_friendly").default(false).notNull(),
	isSyaria: boolean("is_syaria").default(false).notNull(),
	whatsappClicks: integer("whatsapp_clicks").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.cityId],
			foreignColumns: [city.id],
			name: "villa_city_id_city_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "villa_created_by_user_id_fk"
		}),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [user.id],
			name: "villa_owner_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.provinceId],
			foreignColumns: [province.id],
			name: "villa_province_id_province_id_fk"
		}),
	unique("villa_slug_unique").on(table.slug),
]);

export const city = pgTable("city", {
	id: varchar({ length: 10 }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	provinceId: varchar("province_id", { length: 10 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.provinceId],
			foreignColumns: [province.id],
			name: "city_province_id_province_id_fk"
		}),
]);

export const province = pgTable("province", {
	id: varchar({ length: 10 }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const villaChangeRequest = pgTable("villa_change_request", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id").notNull(),
	subject: varchar({ length: 255 }).notNull(),
	requestDetail: text("request_detail").notNull(),
	status: changeRequestStatus().default('pending').notNull(),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: integer("user_id").notNull(),
	reviewedBy: integer("reviewed_by"),
}, (table) => [
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [user.id],
			name: "villa_change_request_reviewed_by_user_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "villa_change_request_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "villa_change_request_villa_id_villa_id_fk"
		}).onDelete("cascade"),
]);

export const villaOwnershipClaim = pgTable("villa_ownership_claim", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id").notNull(),
	claimReason: text("claim_reason").notNull(),
	ownershipProof: text("ownership_proof"),
	contactVerification: text("contact_verification"),
	additionalInfo: text("additional_info"),
	status: claimStatus().default('pending').notNull(),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: integer("user_id").notNull(),
	reviewedBy: integer("reviewed_by"),
}, (table) => [
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [user.id],
			name: "villa_ownership_claim_reviewed_by_user_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "villa_ownership_claim_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "villa_ownership_claim_villa_id_villa_id_fk"
		}).onDelete("cascade"),
]);

export const villaPlace = pgTable("villa_place", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id").notNull(),
	placeId: uuid("place_id").notNull(),
	distanceKm: numeric("distance_km", { precision: 5, scale:  2 }).notNull(),
	accessType: varchar("access_type", { length: 50 }).notNull(),
	travelTimeMinutes: integer("travel_time_minutes"),
	notes: text(),
	orderIndex: integer("order_index").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("villa_place_place_idx").using("btree", table.placeId.asc().nullsLast().op("uuid_ops")),
	index("villa_place_unique_idx").using("btree", table.villaId.asc().nullsLast().op("uuid_ops"), table.placeId.asc().nullsLast().op("int4_ops")),
	index("villa_place_villa_idx").using("btree", table.villaId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.placeId],
			foreignColumns: [place.id],
			name: "villa_place_place_id_place_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "villa_place_villa_id_villa_id_fk"
		}).onDelete("cascade"),
]);

export const villaReport = pgTable("villa_report", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id").notNull(),
	category: reportCategory().notNull(),
	subject: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	customCategory: varchar("custom_category", { length: 100 }),
	status: reportStatus().default('pending').notNull(),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: integer("user_id").notNull(),
	reviewedBy: integer("reviewed_by"),
}, (table) => [
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [user.id],
			name: "villa_report_reviewed_by_user_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "villa_report_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "villa_report_villa_id_villa_id_fk"
		}).onDelete("cascade"),
]);

export const villaNearbyPlace = pgTable("villa_nearby_place", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	distanceKm: numeric("distance_km", { precision: 5, scale:  2 }).notNull(),
	accessType: varchar("access_type", { length: 50 }).notNull(),
	placeType: varchar("place_type", { length: 100 }),
	orderIndex: integer("order_index").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "villa_nearby_place_villa_id_villa_id_fk"
		}).onDelete("cascade"),
]);

export const villaVideo = pgTable("villa_video", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id").notNull(),
	videoUrl: text("video_url").notNull(),
	thumbnailUrl: text("thumbnail_url"),
	orderIndex: integer("order_index").default(0).notNull(),
	altText: varchar("alt_text", { length: 255 }),
	store: varchar({ length: 20 }).default('local').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "villa_video_villa_id_villa_id_fk"
		}).onDelete("cascade"),
]);

export const contactMessage = pgTable("contact_message", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	subject: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "contact_message_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const villaLastUpdate = pgTable("villa_last_update", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id"),
	lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true, mode: 'string' }),
	updateName: varchar("update_name", { length: 100 }),
	lastValue: text("last_value"),
	updatedBy: text("updated_by"),
}, (table) => [
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "villa_last_update_villa_id_villa_id_fk"
		}).onDelete("cascade"),
]);

export const villaOwnership = pgTable("villa_ownership", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id").notNull(),
	claimId: uuid("claim_id").notNull(),
	ownershipType: varchar("ownership_type", { length: 50 }).default('owner').notNull(),
	verificationLevel: varchar("verification_level", { length: 20 }).default('basic').notNull(),
	canEditImmediately: boolean("can_edit_immediately").default(true).notNull(),
	canEditPricing: boolean("can_edit_pricing").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	transferredAt: timestamp("transferred_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: integer("user_id").notNull(),
	transferredTo: integer("transferred_to"),
}, (table) => [
	foreignKey({
			columns: [table.claimId],
			foreignColumns: [villaOwnershipClaim.id],
			name: "villa_ownership_claim_id_villa_ownership_claim_id_fk"
		}),
	foreignKey({
			columns: [table.transferredTo],
			foreignColumns: [user.id],
			name: "villa_ownership_transferred_to_user_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "villa_ownership_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "villa_ownership_villa_id_villa_id_fk"
		}).onDelete("cascade"),
	unique("villa_ownership_villa_id_unique").on(table.villaId),
]);

export const villaUpdateRequest = pgTable("villa_update_request", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id").notNull(),
	updateType: updateRequestType("update_type").notNull(),
	dataCategory: villaDataCategory("data_category").notNull(),
	fieldName: varchar("field_name", { length: 100 }).notNull(),
	currentValue: text("current_value"),
	proposedValue: text("proposed_value").notNull(),
	changeReason: text("change_reason"),
	status: changeRequestStatus().default('pending').notNull(),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	adminNotes: text("admin_notes"),
	appliedAt: timestamp("applied_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	ownerId: integer("owner_id").notNull(),
	reviewedBy: integer("reviewed_by"),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [user.id],
			name: "villa_update_request_owner_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [user.id],
			name: "villa_update_request_reviewed_by_user_id_fk"
		}),
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "villa_update_request_villa_id_villa_id_fk"
		}).onDelete("cascade"),
]);

export const villaButtonClick = pgTable("villa_button_click", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	villaId: integer("villa_id").notNull(),
	userId: integer("user_id"),
	buttonType: villaButtonClickType("button_type").notNull(),
	userIp: varchar("user_ip", { length: 45 }),
	userAgent: text("user_agent"),
	referer: text(),
	clickedAt: timestamp("clicked_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("villa_button_click_time_idx").using("btree", table.clickedAt.asc().nullsLast().op("timestamptz_ops")),
	index("villa_button_click_type_idx").using("btree", table.buttonType.asc().nullsLast().op("enum_ops")),
	index("villa_button_click_user_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	index("villa_button_click_villa_idx").using("btree", table.villaId.asc().nullsLast().op("int4_ops")),
	index("villa_button_click_villa_type_idx").using("btree", table.villaId.asc().nullsLast().op("int4_ops"), table.buttonType.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.villaId],
			foreignColumns: [villa.id],
			name: "villa_button_click_villa_id_villa_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "villa_button_click_user_id_user_id_fk"
		}).onDelete("set null"),
]);
