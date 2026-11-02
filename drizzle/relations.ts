import { relations } from "drizzle-orm/relations";
import { city, place, province, placeImage, user, savedVilla, villa, session, villaAmenity, searchIndex, villaBedSize, villaImage, villaChangeRequest, villaOwnershipClaim, villaPlace, villaReport, villaNearbyPlace, villaVideo, contactMessage, villaLastUpdate, villaOwnership, villaUpdateRequest, villaButtonClick } from "./schema";

export const placeRelations = relations(place, ({one, many}) => ({
	city: one(city, {
		fields: [place.cityId],
		references: [city.id]
	}),
	province: one(province, {
		fields: [place.provinceId],
		references: [province.id]
	}),
	placeImages: many(placeImage),
	villaPlaces: many(villaPlace),
}));

export const cityRelations = relations(city, ({one, many}) => ({
	places: many(place),
	searchIndices: many(searchIndex),
	villas: many(villa),
	province: one(province, {
		fields: [city.provinceId],
		references: [province.id]
	}),
}));

export const provinceRelations = relations(province, ({many}) => ({
	places: many(place),
	villas: many(villa),
	cities: many(city),
}));

export const placeImageRelations = relations(placeImage, ({one}) => ({
	place: one(place, {
		fields: [placeImage.placeId],
		references: [place.id]
	}),
}));

export const savedVillaRelations = relations(savedVilla, ({one}) => ({
	user: one(user, {
		fields: [savedVilla.userId],
		references: [user.id]
	}),
	villa: one(villa, {
		fields: [savedVilla.villaId],
		references: [villa.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	savedVillas: many(savedVilla),
	sessions: many(session),
	villas_createdBy: many(villa, {
		relationName: "villa_createdBy_user_id"
	}),
	villas_ownerId: many(villa, {
		relationName: "villa_ownerId_user_id"
	}),
	villaChangeRequests_reviewedBy: many(villaChangeRequest, {
		relationName: "villaChangeRequest_reviewedBy_user_id"
	}),
	villaChangeRequests_userId: many(villaChangeRequest, {
		relationName: "villaChangeRequest_userId_user_id"
	}),
	villaOwnershipClaims_reviewedBy: many(villaOwnershipClaim, {
		relationName: "villaOwnershipClaim_reviewedBy_user_id"
	}),
	villaOwnershipClaims_userId: many(villaOwnershipClaim, {
		relationName: "villaOwnershipClaim_userId_user_id"
	}),
	villaReports_reviewedBy: many(villaReport, {
		relationName: "villaReport_reviewedBy_user_id"
	}),
	villaReports_userId: many(villaReport, {
		relationName: "villaReport_userId_user_id"
	}),
	contactMessages: many(contactMessage),
	villaOwnerships_transferredTo: many(villaOwnership, {
		relationName: "villaOwnership_transferredTo_user_id"
	}),
	villaOwnerships_userId: many(villaOwnership, {
		relationName: "villaOwnership_userId_user_id"
	}),
	villaUpdateRequests_ownerId: many(villaUpdateRequest, {
		relationName: "villaUpdateRequest_ownerId_user_id"
	}),
	villaUpdateRequests_reviewedBy: many(villaUpdateRequest, {
		relationName: "villaUpdateRequest_reviewedBy_user_id"
	}),
	villaButtonClicks: many(villaButtonClick),
}));

export const villaRelations = relations(villa, ({one, many}) => ({
	savedVillas: many(savedVilla),
	villaAmenities: many(villaAmenity),
	searchIndices: many(searchIndex),
	villaBedSizes: many(villaBedSize),
	villaImages: many(villaImage),
	city: one(city, {
		fields: [villa.cityId],
		references: [city.id]
	}),
	user_createdBy: one(user, {
		fields: [villa.createdBy],
		references: [user.id],
		relationName: "villa_createdBy_user_id"
	}),
	user_ownerId: one(user, {
		fields: [villa.ownerId],
		references: [user.id],
		relationName: "villa_ownerId_user_id"
	}),
	province: one(province, {
		fields: [villa.provinceId],
		references: [province.id]
	}),
	villaChangeRequests: many(villaChangeRequest),
	villaOwnershipClaims: many(villaOwnershipClaim),
	villaPlaces: many(villaPlace),
	villaReports: many(villaReport),
	villaNearbyPlaces: many(villaNearbyPlace),
	villaVideos: many(villaVideo),
	villaLastUpdates: many(villaLastUpdate),
	villaOwnerships: many(villaOwnership),
	villaUpdateRequests: many(villaUpdateRequest),
	villaButtonClicks: many(villaButtonClick),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const villaAmenityRelations = relations(villaAmenity, ({one}) => ({
	villa: one(villa, {
		fields: [villaAmenity.villaId],
		references: [villa.id]
	}),
}));

export const searchIndexRelations = relations(searchIndex, ({one}) => ({
	city: one(city, {
		fields: [searchIndex.cityId],
		references: [city.id]
	}),
	villa: one(villa, {
		fields: [searchIndex.villaId],
		references: [villa.id]
	}),
}));

export const villaBedSizeRelations = relations(villaBedSize, ({one}) => ({
	villa: one(villa, {
		fields: [villaBedSize.villaId],
		references: [villa.id]
	}),
}));

export const villaImageRelations = relations(villaImage, ({one}) => ({
	villa: one(villa, {
		fields: [villaImage.villaId],
		references: [villa.id]
	}),
}));

export const villaChangeRequestRelations = relations(villaChangeRequest, ({one}) => ({
	user_reviewedBy: one(user, {
		fields: [villaChangeRequest.reviewedBy],
		references: [user.id],
		relationName: "villaChangeRequest_reviewedBy_user_id"
	}),
	user_userId: one(user, {
		fields: [villaChangeRequest.userId],
		references: [user.id],
		relationName: "villaChangeRequest_userId_user_id"
	}),
	villa: one(villa, {
		fields: [villaChangeRequest.villaId],
		references: [villa.id]
	}),
}));

export const villaOwnershipClaimRelations = relations(villaOwnershipClaim, ({one, many}) => ({
	user_reviewedBy: one(user, {
		fields: [villaOwnershipClaim.reviewedBy],
		references: [user.id],
		relationName: "villaOwnershipClaim_reviewedBy_user_id"
	}),
	user_userId: one(user, {
		fields: [villaOwnershipClaim.userId],
		references: [user.id],
		relationName: "villaOwnershipClaim_userId_user_id"
	}),
	villa: one(villa, {
		fields: [villaOwnershipClaim.villaId],
		references: [villa.id]
	}),
	villaOwnerships: many(villaOwnership),
}));

export const villaPlaceRelations = relations(villaPlace, ({one}) => ({
	place: one(place, {
		fields: [villaPlace.placeId],
		references: [place.id]
	}),
	villa: one(villa, {
		fields: [villaPlace.villaId],
		references: [villa.id]
	}),
}));

export const villaReportRelations = relations(villaReport, ({one}) => ({
	user_reviewedBy: one(user, {
		fields: [villaReport.reviewedBy],
		references: [user.id],
		relationName: "villaReport_reviewedBy_user_id"
	}),
	user_userId: one(user, {
		fields: [villaReport.userId],
		references: [user.id],
		relationName: "villaReport_userId_user_id"
	}),
	villa: one(villa, {
		fields: [villaReport.villaId],
		references: [villa.id]
	}),
}));

export const villaNearbyPlaceRelations = relations(villaNearbyPlace, ({one}) => ({
	villa: one(villa, {
		fields: [villaNearbyPlace.villaId],
		references: [villa.id]
	}),
}));

export const villaVideoRelations = relations(villaVideo, ({one}) => ({
	villa: one(villa, {
		fields: [villaVideo.villaId],
		references: [villa.id]
	}),
}));

export const contactMessageRelations = relations(contactMessage, ({one}) => ({
	user: one(user, {
		fields: [contactMessage.userId],
		references: [user.id]
	}),
}));

export const villaLastUpdateRelations = relations(villaLastUpdate, ({one}) => ({
	villa: one(villa, {
		fields: [villaLastUpdate.villaId],
		references: [villa.id]
	}),
}));

export const villaOwnershipRelations = relations(villaOwnership, ({one}) => ({
	villaOwnershipClaim: one(villaOwnershipClaim, {
		fields: [villaOwnership.claimId],
		references: [villaOwnershipClaim.id]
	}),
	user_transferredTo: one(user, {
		fields: [villaOwnership.transferredTo],
		references: [user.id],
		relationName: "villaOwnership_transferredTo_user_id"
	}),
	user_userId: one(user, {
		fields: [villaOwnership.userId],
		references: [user.id],
		relationName: "villaOwnership_userId_user_id"
	}),
	villa: one(villa, {
		fields: [villaOwnership.villaId],
		references: [villa.id]
	}),
}));

export const villaUpdateRequestRelations = relations(villaUpdateRequest, ({one}) => ({
	user_ownerId: one(user, {
		fields: [villaUpdateRequest.ownerId],
		references: [user.id],
		relationName: "villaUpdateRequest_ownerId_user_id"
	}),
	user_reviewedBy: one(user, {
		fields: [villaUpdateRequest.reviewedBy],
		references: [user.id],
		relationName: "villaUpdateRequest_reviewedBy_user_id"
	}),
	villa: one(villa, {
		fields: [villaUpdateRequest.villaId],
		references: [villa.id]
	}),
}));

export const villaButtonClickRelations = relations(villaButtonClick, ({one}) => ({
	villa: one(villa, {
		fields: [villaButtonClick.villaId],
		references: [villa.id]
	}),
	user: one(user, {
		fields: [villaButtonClick.userId],
		references: [user.id]
	}),
}));