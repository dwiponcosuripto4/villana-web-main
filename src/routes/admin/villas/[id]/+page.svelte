<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import ErrorModal from "$lib/components/ErrorModal.svelte";
  import ConfirmationModal from "$lib/components/ConfirmationModal.svelte";
  import { showToast, toastMessages } from "$lib/utils/toast.js";
  import { goto } from "$app/navigation";
  import PencilEditIcon from "$lib/components/icons/PencilEditIcon.svelte";
  import TrashIcon from "$lib/components/icons/TrashIcon.svelte";
  import {
    AMENITY_CATEGORIES,
    CATEGORY_DISPLAY_NAMES,
  } from "$lib/utils/amenity-categories";
  import CityAutocomplete from "$lib/components/CityAutocomplete.svelte";
  import type { CityWithProvince } from "$lib/server/services/city.service";
  import {
    //   saveFormData,
    //   loadFormData,
    clearFormData,
    cleanupOldFormData,
    migrateFromPerVillaStorage,
    //   type VillaFormData,
  } from "$lib/utils/formAutoSave";
  import { onMount, onDestroy } from "svelte";
  import BackIcon from "$lib/components/icons/BackIcon.svelte";
  import SortableImageGrid from "$lib/components/SortableImageGrid.svelte";
  import MultiImageUpload from "$lib/components/MultiImageUpload.svelte";
  import BatchImageEditor from "$lib/components/BatchImageEditor.svelte";
  import NearbyPlacesManager from "$lib/components/admin/NearbyPlacesManager.svelte";
  import PlaceVillaManager from "$lib/components/admin/PlaceVillaManager.svelte";
  import OtaLinksManager from "$lib/components/admin/OtaLinksManager.svelte";
  import ImageLightbox from "$lib/components/ImageLightbox.svelte";
  import PlaceSearchDialog from "$lib/components/PlaceSearchDialog.svelte";
  import LocationSearchDialog from "$lib/components/LocationSearchDialog.svelte";
  import type { TextSearchPlace } from "$lib/utils/google-maps";
  import PVRDebugModal from "$lib/components/PVRDebugModal.svelte";
  import WhatsAppAnalyticsModal from "$lib/components/admin/WhatsAppAnalyticsModal.svelte";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showBatchUpload = $state(false);
  let showBatchEditor = $state(false);
  let recentlyUploadedImages = $state<any[]>([]);
  let showVideoUpload = $state(false);
  let showAmenityForm = $state(false);
  let editingAmenityId = $state<any>(null);

  // Error modal state
  let showErrorModal = $state(false);
  let errorMessage = $state("");

  // Delete confirmation modal state
  let showDeleteModal = $state(false);
  let isDeleting = $state(false);

  // Amenity delete confirmation modal state
  let showAmenityDeleteModal = $state(false);
  let amenityToDelete = $state<any>(null);

  // Image delete confirmation modal state
  let showImageDeleteModal = $state(false);
  let imageToDelete = $state<any>(null);

  // Video delete confirmation modal state
  let showVideoDeleteModal = $state(false);
  let videoToDelete = $state<any>(null);

  // Image lightbox state
  let showImageLightbox = $state(false);
  let lightboxCurrentIndex = $state(0);

  // Place search dialog state
  let showPlaceSearchDialog = $state(false);
  let showLocationSearchDialog = $state(false);

  // PVR Debug modal state
  let showPVRDebugModal = $state(false);
  let pvrDebugData = $state<any>(null);
  let pvrDebugLoading = $state(false);

  // WhatsApp Analytics modal state
  let showWhatsAppAnalyticsModal = $state(false);

  // Location state
  let selectedCity = $state<CityWithProvince | null>(null);
  let provinceId = $state("");
  let cityId = $state("");

  // Tab state
  let activeTab = $state("details"); // details or places

  // Form fields for auto-save (initialized from villa data)
  let title = $state(data.villa?.title || "");
  let priceMin = $state(data.villa?.priceMin || "");
  let priceMax = $state(data.villa?.priceMax || "");
  let unitsCount = $state(data.villa?.unitsCount || 1);
  let bedroomMin = $state(data.villa?.bedroomMin || 0);
  let bedroomMax = $state(data.villa?.bedroomMax || 0);
  let personCapacityMin = $state(data.villa?.personCapacityMin || 0);
  let personCapacityMax = $state(data.villa?.personCapacityMax || 0);
  let hasAc = $state(data.villa?.hasAc || false);
  let hasBathtub = $state(data.villa?.hasBathtub || false);
  let hasTv = $state(data.villa?.hasTv || false);
  let hasBreakfast = $state(data.villa?.hasBreakfast || false);
  let hasPool = $state(data.villa?.hasPool || false);
  let isKidFriendly = $state(data.villa?.isKidFriendly || false);
  let isPetFriendly = $state(data.villa?.isPetFriendly || false);
  let isSeniorFriendly = $state(data.villa?.isSeniorFriendly || false);
  let isSyaria = $state(data.villa?.isSyaria || false);
  let description = $state(data.villa?.description || "");
  let address = $state(data.villa?.address || "");
  let latitude = $state(data.villa?.latitude || "");
  let longitude = $state(data.villa?.longitude || "");
  let googleMapsLink = $state(data.villa?.googleMapsLink || "");
  let googlePlaceId = $state(data.villa?.googlePlaceId || "");
  let phoneNumber = $state(data.villa?.phoneNumber || "");
  let status = $state(data.villa?.status || "draft");
  let keywords = $state(data.villa?.keywords || []);
  let pvr = $state(data.villa?.pvr || "");

  // Custom amenities for auto-save
  let customAmenities = $state<
    Array<{
      name: string;
      description: string;
      category: string;
    }>
  >([]);

  // Combined media items for lightbox
  let mediaItems = $derived(
    [
      ...data.villa.images.map((img: any) => ({
        ...img,
        type: "image" as const,
      })),
      ...(data.villa.videos || []).map((vid: any) => ({
        ...vid,
        type: "video" as const,
      })),
    ].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
  );

  // Initialize location data from villa (moved to onMount to avoid SSR issues)

  // // Auto-save form data when fields change
  // $: {
  //   const formData: VillaFormData = {
  //     title,
  //     priceMin,
  //     priceMax,
  //     unitsCount,
  //     bedroomMin,
  //     bedroomMax,
  //     personCapacityMin,
  //     personCapacityMax,
  //     hasAc,
  //     hasBathtub,
  //     hasTv,
  //     hasBreakfast,
  //     description,
  //     address,
  //     latitude,
  //     longitude,
  //     googleMapsLink,
  //     googlePlaceId,
  //     phoneNumber,
  //     status,
  //     provinceId,
  //     cityId,
  //     selectedCity,
  //     customAmenities,
  //     keywords: keywords.join(", "),
  //   };
  //
  //   if (data.villa) {
  //     saveFormData("edit", formData);
  //   }
  // }

  // Load saved form data on mount
  onMount(() => {
    // Migrate from old per-villa storage system
    migrateFromPerVillaStorage();

    cleanupOldFormData();

    // if (data.villa) {
    //   const savedData = loadFormData("edit");
    //
    //   if (savedData) {
    //     console.log("Restoring auto-saved form data");
    //
    //     // Restore all saved fields
    //     if (savedData.title !== undefined) title = savedData.title;
    //     if (savedData.priceMin !== undefined) priceMin = savedData.priceMin;
    //     if (savedData.priceMax !== undefined) priceMax = savedData.priceMax;
    //     if (savedData.unitsCount !== undefined)
    //       unitsCount = savedData.unitsCount;
    //     if (savedData.bedroomMin !== undefined)
    //       bedroomMin = savedData.bedroomMin;
    //     if (savedData.bedroomMax !== undefined)
    //       bedroomMax = savedData.bedroomMax;
    //     if (savedData.personCapacityMin !== undefined)
    //       personCapacityMin = savedData.personCapacityMin;
    //     if (savedData.personCapacityMax !== undefined)
    //       personCapacityMax = savedData.personCapacityMax;
    //     if (savedData.hasAc !== undefined) hasAc = savedData.hasAc;
    //     if (savedData.hasBathtub !== undefined)
    //       hasBathtub = savedData.hasBathtub;
    //     if (savedData.hasTv !== undefined) hasTv = savedData.hasTv;
    //     if (savedData.hasBreakfast !== undefined)
    //       hasBreakfast = savedData.hasBreakfast;
    //     if (savedData.description !== undefined)
    //       description = savedData.description;
    //     if (savedData.address !== undefined) address = savedData.address;
    //     if (savedData.latitude !== undefined) latitude = savedData.latitude;
    //     if (savedData.longitude !== undefined) longitude = savedData.longitude;
    //     if (savedData.googleMapsLink !== undefined)
    //       googleMapsLink = savedData.googleMapsLink;
    //     if (savedData.googlePlaceId !== undefined)
    //       googlePlaceId = savedData.googlePlaceId;
    //     if (savedData.phoneNumber !== undefined)
    //       phoneNumber = savedData.phoneNumber;
    //     if (savedData.status !== undefined) status = savedData.status;
    //     if (savedData.provinceId !== undefined)
    //       provinceId = savedData.provinceId;
    //     if (savedData.cityId !== undefined) cityId = savedData.cityId;
    //     if (savedData.selectedCity !== undefined)
    //       selectedCity = savedData.selectedCity;
    //     if (savedData.customAmenities !== undefined)
    //       customAmenities = savedData.customAmenities;
    //     if (savedData.keywords !== undefined)
    //       keywords = savedData.keywords.split(",").map((k) => k.trim());
    //   }
    // }

    // Initialize location data if villa exists and no city is selected
    if (data.villa && !selectedCity) {
      initializeLocationData();
    }
  });

  function resetFormChanges() {
    if (
      data.villa &&
      confirm(
        "Reset all changes? This will restore the form to the original saved state.",
      )
    ) {
      clearFormData("edit");

      // Reset all fields to original villa data
      title = data.villa.title || "";
      priceMin = data.villa.priceMin || "";
      priceMax = data.villa.priceMax || "";
      unitsCount = data.villa.unitsCount || 1;
      bedroomMin = data.villa.bedroomMin || 0;
      bedroomMax = data.villa.bedroomMax || 0;
      personCapacityMin = data.villa.personCapacityMin || 0;
      personCapacityMax = data.villa.personCapacityMax || 0;
      hasAc = data.villa.hasAc || false;
      hasBathtub = data.villa.hasBathtub || false;
      hasTv = data.villa.hasTv || false;
      hasBreakfast = data.villa.hasBreakfast || false;
      hasPool = data.villa.hasPool || false;
      isKidFriendly = data.villa.isKidFriendly || false;
      isPetFriendly = data.villa.isPetFriendly || false;
      isSeniorFriendly = data.villa.isSeniorFriendly || false;
      isSyaria = data.villa.isSyaria || false;
      description = data.villa.description || "";
      address = data.villa.address || "";
      latitude = data.villa.latitude || "";
      longitude = data.villa.longitude || "";
      googleMapsLink = data.villa.googleMapsLink || "";
      phoneNumber = data.villa.phoneNumber || "";
      status = data.villa.status || "draft";
      customAmenities = [];
      keywords = data.villa.keywords || [];

      // Reset location data
      initializeLocationData();
    }
  }

  async function initializeLocationData() {
    if (data.villa.provinceId && data.villa.cityId) {
      try {
        // Fetch the city and province data to populate the autocomplete
        const response = await fetch(`/api/cities/${data.villa.cityId}`);
        if (response.ok) {
          const cityData = await response.json();
          if (cityData.city) {
            selectedCity = cityData.city;
            provinceId = data.villa.provinceId;
            cityId = data.villa.cityId;
          }
        }
      } catch (error) {
        console.error("Error loading location data:", error);
        // Fallback: just set the IDs if we have them
        provinceId = data.villa.provinceId;
        cityId = data.villa.cityId;
      }
    }
  }

  function handleCitySelect(city: CityWithProvince) {
    selectedCity = city;
    provinceId = city.province.id;
    cityId = city.id;
  }

  function handleCityClear() {
    selectedCity = null;
    provinceId = "";
    cityId = "";
  }

  async function recalculatePVR() {
    const resposne = await fetch(`/api/villas/${data.villa.id}/pvr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (resposne.ok) {
      showToast.success("PVR recalculated successfully");
      const result = await resposne.json();
      pvr = result.pvr.toFixed(2);
      console.log(`Recalculated PVR for villa ID ${data.villa.id}: ${pvr}`);
    } else {
      showToast.error("Failed to recalculate PVR");
    }
  }

  async function showPVRDebug() {
    showPVRDebugModal = true;
    pvrDebugLoading = true;
    try {
      const response = await fetch(`/api/villas/${data.villa.id}/pvr/debug`);
      if (response.ok) {
        pvrDebugData = await response.json();
      } else {
        pvrDebugData = { error: "Failed to fetch debug information" };
      }
    } catch (error) {
      console.error("Error fetching PVR debug info:", error);
      pvrDebugData = { error: "Error fetching debug information" };
    } finally {
      pvrDebugLoading = false;
    }
  }


  function handlePlaceSelect(place: TextSearchPlace) {
    googlePlaceId = place.placeId;
    showToast.success(`Selected: ${place.name}`);
  }

  function handleLocationSelect(place: TextSearchPlace) {
    googlePlaceId = place.placeId;

    if (place.latitude !== undefined && place.longitude !== undefined) {
      latitude = place.latitude.toFixed(9);
      longitude = place.longitude.toFixed(9);
      showToast.success(
        `Updated location data for: ${place.name}. Please save the form to apply changes.`,
      );
    } else {
      showToast.error(
        `Updated Place ID only for: ${place.name} (no coordinates available). Please save the form to apply changes.`,
      );
    }
  }

  async function handleStatusToggle() {
    // Toggle the status
    const newStatus = status === "published" ? "draft" : "published";
    const previousStatus = status;
    status = newStatus;

    // Only send the status field to the server
    const formData = new FormData();
    formData.append("status", newStatus);

    try {
      const response = await fetch(`?/updateStatus`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        showToast.success(
          `Villa status changed to ${newStatus === "published" ? "Published" : "Draft"}`,
        );
        await invalidateAll();
      } else {
        // Revert on failure
        status = previousStatus;
        showToast.error("Failed to update status");
      }
    } catch (error) {
      // Revert on error
      status = previousStatus;
      showToast.error("Error updating status");
    }
  }

  // // Watch for form errors and show modal
  // $: if (form?.error) {
  //   errorMessage = form.error;
  //   showErrorModal = true;
  // }

  $effect(() => {
    if (form?.error) {
      console.log("Form error detected:", form.error);
      errorMessage = form.error;
      showErrorModal = true;
      showToast.error(form.error);
    }
  });

  // Reset modal states when closed
  $effect(() => {
    if (!showImageDeleteModal) {
      imageToDelete = null;
    }
  });

  $effect(() => {
    if (!showVideoDeleteModal) {
      videoToDelete = null;
    }
  });

  $effect(() => {
    if (!showAmenityDeleteModal) {
      amenityToDelete = null;
    }
  });

  // Show success toast if villa was just created
  $effect(() => {
    if (form?.success) {
      showToast.success("Villa updated successfully");
      // // Clear the URL parameter to avoid showing toast on page refresh
      // const url = new URL(window.location.href);
      // url.searchParams.delete("created");
      // window.history.replaceState({}, "", url.toString());
    }
  });
</script>

<div class="px-4 py-5 sm:px-0">
  <div class="mb-5 flex flex-col lg:flex-row items-start justify-between">
    <div>
      <div class="flex gap-2 items-center">
        <h2 class="text-2xl font-bold text-gray-900">
          {data.villa.title || "Edit Villa"}
        </h2>
        <PencilEditIcon />
      </div>
      <p class="mt-1 text-sm text-gray-600">
        ID: {data.villa.id} - Created: {new Date(
          data.villa.createdAt,
        ).toLocaleString("id-ID", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })} - Updated: {new Date(data.villa.updatedAt).toLocaleString("id-ID", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })} - Created By: {data.creatorName}
      </p>
    </div>
    <div class="flex space-x-2 mt-4 md:mt-0 justify-end w-full lg:w-auto">
      {#if status === "published"}
        <a
          href="/villa/{data.villa.slug}"
          target="_blank"
          class="inline-flex items-center rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
        >
          <svg
            class="-ml-1 mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            ></path>
          </svg>
          View Live
        </a>
      {/if}
      <button
        type="button"
        onclick={() => (showDeleteModal = true)}
        class="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  </div>

  <div class="inline-flex rounded-md shadow-xs pb-5 justify-end w-full">
    <div
      class="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-gray-300 rounded-s-lg"
    >
      PVR <strong>{pvr || data.villa.pvr}</strong>
    </div>
    <button
      class="inline-flex cursor-pointer items-center border-t border-b border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      onclick={recalculatePVR}
    >
      Recalculate
    </button>
    <button
      class="inline-flex cursor-pointer items-center border-t border-b border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      onclick={showPVRDebug}
    >
      Debug
    </button>
    <button
      class="inline-flex border-l-1 cursor-pointer items-center rounded-e-lg border-t border-b border-r border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      onclick={() => (showWhatsAppAnalyticsModal = true)}
    >
      <svg
        class="mr-2 h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      Analytics
    </button>
  </div>

  <div class="space-y-8">
    <!-- Images Section -->
    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Images</h3>
          <div class="flex gap-2">
            <button
              type="button"
              onclick={() => (showBatchUpload = !showBatchUpload)}
              class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm leading-4 font-medium text-white hover:bg-indigo-700"
            >
              Batch Upload
            </button>
          </div>
        </div>

        {#if showBatchUpload}
          <div class="mb-4 rounded-lg border p-4">
            <MultiImageUpload
              action="?/uploadImages"
              maxFiles={10}
              onUploadComplete={() => {
                showBatchUpload = false;
                // Get the newly uploaded images (last N images)
                const uploadedCount =
                  data.villa.images.length - recentlyUploadedImages.length;
                if (uploadedCount > 0) {
                  recentlyUploadedImages =
                    data.villa.images.slice(-uploadedCount);
                  showBatchEditor = true;
                }
              }}
            />
            <div class="mt-2 flex justify-end">
              <button
                type="button"
                onclick={() => (showBatchUpload = false)}
                class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        {/if}

        {#if showBatchEditor && recentlyUploadedImages.length > 0}
          <div class="mb-4 rounded-lg border p-4">
            <BatchImageEditor
              images={recentlyUploadedImages}
              onSave={async (updates) => {
                // Update alt text for each image
                for (const update of updates) {
                  const formData = new FormData();
                  formData.append("imageId", update.id);
                  formData.append("altText", update.altText);

                  await fetch("?/updateImageAltText", {
                    method: "POST",
                    body: formData,
                  });
                }

                showToast.success("Descriptions saved successfully");
                showBatchEditor = false;
                recentlyUploadedImages = [];
                await invalidateAll();
              }}
              onCancel={() => {
                showBatchEditor = false;
                recentlyUploadedImages = [];
              }}
            />
          </div>
        {/if}

        <SortableImageGrid
          images={data.villa.images}
          reorderable={true}
          editable={true}
          deletable={true}
          onImageClick={(index) => {
            lightboxCurrentIndex = index;
            showImageLightbox = true;
          }}
          onReorder={async (newOrder) => {
            const formData = new FormData();
            formData.append("imageIds", JSON.stringify(newOrder));

            const response = await fetch("?/reorderImages", {
              method: "POST",
              body: formData,
            });

            if (response.ok) {
              showToast.success("Image order updated");
              await invalidateAll();
            } else {
              showToast.error("Failed to update image order");
            }
          }}
          onDelete={(imageId) => {
            const image = data.villa.images.find((img) => img.id === imageId);
            imageToDelete = image;
            showImageDeleteModal = true;
          }}
          onEdit={async (imageId, altText) => {
            const formData = new FormData();
            formData.append("imageId", imageId);
            formData.append("altText", altText);

            const response = await fetch("?/updateImageAltText", {
              method: "POST",
              body: formData,
            });

            if (response.ok) {
              showToast.success("Description updated");
              await invalidateAll();
            } else {
              showToast.error("Failed to update description");
            }
          }}
        />
      </div>
    </div>

    <!-- Videos Section -->
    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Videos</h3>
          <button
            type="button"
            onclick={() => (showVideoUpload = !showVideoUpload)}
            class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm leading-4 font-medium text-white hover:bg-indigo-700"
          >
            Add Video
          </button>
        </div>

        {#if showVideoUpload}
          <form
            method="post"
            action="?/uploadVideo"
            enctype="multipart/form-data"
            use:enhance={() => {
              return async ({ result }) => {
                if (result.type === "success") {
                  showToast.success("Video uploaded successfully");
                  showVideoUpload = false;
                  await invalidateAll();
                }
              };
            }}
            class="mb-4 rounded-lg border p-4"
          >
            <div class="space-y-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">
                    Upload Video File
                  </label>
                  <input
                    type="file"
                    name="video"
                    accept="video/*"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    Or upload a video file from your device
                  </p>
                </div>
                <div>
                  <label
                    for="videoUrl"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Video URL
                  </label>
                  <input
                    type="url"
                    name="videoUrl"
                    id="videoUrl"
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    YouTube, Vimeo, or direct video URLs
                  </p>
                </div>
              </div>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    for="videoAltText"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <input
                    type="text"
                    name="altText"
                    id="videoAltText"
                    placeholder="Brief description of the video"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    for="videoStore"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Source Type
                  </label>
                  <select
                    name="store"
                    id="videoStore"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="external">External (YouTube/Vimeo)</option>
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="local">Local Upload</option>
                  </select>
                </div>
              </div>
              <div class="flex justify-end space-x-2">
                <button
                  type="button"
                  onclick={() => (showVideoUpload = false)}
                  class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Add Video
                </button>
              </div>
            </div>
          </form>
        {/if}

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {#each data.villa.videos as video}
            <div class="group relative">
              {#if video.store === "local"}
                <video
                  src={video.videoUrl}
                  class="h-32 w-full rounded-lg object-cover"
                  controls
                  preload="metadata"
                >
                  <track kind="captions" />
                </video>
              {:else if video.store === "youtube"}
                {@const videoId = video.videoUrl.includes("youtube.com")
                  ? video.videoUrl.split("v=")[1]?.split("&")[0]
                  : video.videoUrl.split("youtu.be/")[1]?.split("?")[0]}
                {#if videoId}
                  <iframe
                    src="https://www.youtube.com/embed/{videoId}"
                    class="h-32 w-full rounded-lg"
                    frameborder="0"
                    allowfullscreen
                    title={video.altText || "Villa video"}
                  ></iframe>
                {:else}
                  <div
                    class="flex h-32 w-full items-center justify-center rounded-lg bg-gray-200"
                  >
                    <p class="text-sm text-gray-500">Invalid YouTube URL</p>
                  </div>
                {/if}
              {:else if video.store === "vimeo"}
                {@const videoId = video.videoUrl
                  .split("vimeo.com/")[1]
                  ?.split("?")[0]}
                {#if videoId}
                  <iframe
                    src="https://player.vimeo.com/video/{videoId}"
                    class="h-32 w-full rounded-lg"
                    frameborder="0"
                    allowfullscreen
                    title={video.altText || "Villa video"}
                  ></iframe>
                {:else}
                  <div
                    class="flex h-32 w-full items-center justify-center rounded-lg bg-gray-200"
                  >
                    <p class="text-sm text-gray-500">Invalid Vimeo URL</p>
                  </div>
                {/if}
              {:else}
                <div
                  class="flex h-32 w-full items-center justify-center rounded-lg bg-gray-200"
                >
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    class="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Open Video
                  </a>
                </div>
              {/if}

              {#if video.altText}
                <p class="mt-1 truncate text-xs text-gray-600">
                  {video.altText}
                </p>
              {/if}

              <button
                type="button"
                onclick={() => {
                  videoToDelete = video;
                  showVideoDeleteModal = true;
                }}
                class="absolute top-2 right-2 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                title="Delete video"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
          {:else}
            <p class="text-gray-500 col-span-full">No videos added yet</p>
          {/each}
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="bg-white shadow sm:rounded-lg mb-6">
      <div class="flex justify-between flex-col md:flex-row px-4 py-3 sm:px-6">
        <nav class="flex space-x-8" aria-label="Tabs">
          <button
            onclick={() => (activeTab = "details")}
            class={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "details"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Villa Details
          </button>
          <button
            onclick={() => (activeTab = "places")}
            class={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "places"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Linked Places ({data.linkedPlacesCount || 0})
          </button>
        </nav>

        <div class="mt-4 flex items-center gap-2 justify-end">
          <!-- Status Toggle -->
          <span class="text-sm font-medium text-gray-700">Status:</span>
          <button
            type="button"
            onclick={() => handleStatusToggle()}
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 {status ===
            'published'
              ? 'bg-green-600'
              : 'bg-gray-200'}"
            role="switch"
            aria-checked={status === "published"}
          >
            <span class="sr-only">Toggle status</span>
            <span
              aria-hidden="true"
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {status ===
              'published'
                ? 'translate-x-5'
                : 'translate-x-0'}"
            ></span>
          </button>
          <span
            class="text-sm font-medium {status === 'published'
              ? 'text-green-700'
              : 'text-amber-600'}"
          >
            {status === "published" ? "Published" : "Draft"}
          </span>
        </div>
      </div>
    </div>

    {#if activeTab === "details"}
      <!-- Villa Details Form -->
      <form
        method="post"
        action="?/update"
        class="space-y-8 divide-y divide-gray-200"
      >
        <div class="bg-white shadow sm:rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="mb-4 text-lg leading-6 font-medium text-gray-900">
              Villa Details
            </h3>
            <div class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
              <div class="sm:col-span-4">
                <label
                  for="title"
                  class="block text-sm font-medium text-gray-700"
                >
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  bind:value={title}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <!-- Hidden status input for form submission -->
              <input type="hidden" name="status" bind:value={status} />

              <div class="sm:col-span-2">
                <label
                  for="priceMin"
                  class="block text-sm font-medium text-gray-700"
                >
                  Price Min *
                </label>
                <input
                  type="number"
                  name="priceMin"
                  id="priceMin"
                  step="0.01"
                  bind:value={priceMin}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div class="sm:col-span-2">
                <label
                  for="priceMax"
                  class="block text-sm font-medium text-gray-700"
                >
                  Price Max *
                </label>
                <input
                  type="number"
                  name="priceMax"
                  id="priceMax"
                  step="0.01"
                  bind:value={priceMax}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div class="sm:col-span-2">
                <label
                  for="unitsCount"
                  class="block text-sm font-medium text-gray-700"
                >
                  Number of Units
                </label>
                <input
                  type="number"
                  name="unitsCount"
                  id="unitsCount"
                  min="1"
                  bind:value={unitsCount}
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div class="sm:col-span-2">
                <label
                  for="bedroomMin"
                  class="block text-sm font-medium text-gray-700"
                >
                  Min Bedrooms *
                </label>
                <input
                  type="number"
                  name="bedroomMin"
                  id="bedroomMin"
                  min="0"
                  bind:value={bedroomMin}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div class="sm:col-span-2">
                <label
                  for="bedroomMax"
                  class="block text-sm font-medium text-gray-700"
                >
                  Max Bedrooms *
                </label>
                <input
                  type="number"
                  name="bedroomMax"
                  id="bedroomMax"
                  min="0"
                  bind:value={bedroomMax}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div class="sm:col-span-2"></div>

              <div class="sm:col-span-2">
                <label
                  for="personCapacityMin"
                  class="block text-sm font-medium text-gray-700"
                >
                  Min Person Capacity
                </label>
                <input
                  type="number"
                  name="personCapacityMin"
                  id="personCapacityMin"
                  min="0"
                  bind:value={personCapacityMin}
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Minimum number of guests
                </p>
              </div>

              <div class="sm:col-span-2">
                <label
                  for="personCapacityMax"
                  class="block text-sm font-medium text-gray-700"
                >
                  Max Person Capacity
                </label>
                <input
                  type="number"
                  name="personCapacityMax"
                  id="personCapacityMax"
                  min="0"
                  bind:value={personCapacityMax}
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Maximum number of guests
                </p>
              </div>

              <div class="sm:col-span-6">
                <fieldset class="space-y-2">
                  <legend class="text-lg font-medium text-gray-700"
                    >Facilities</legend
                  >
                  <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        name="hasAc"
                        id="hasAc"
                        bind:checked={hasAc}
                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        for="hasAc"
                        class="ml-2 block text-sm text-gray-700"
                      >
                        Air Conditioning
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        name="hasBathtub"
                        id="hasBathtub"
                        bind:checked={hasBathtub}
                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        for="hasBathtub"
                        class="ml-2 block text-sm text-gray-700"
                      >
                        Bathtub
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        name="hasTv"
                        id="hasTv"
                        bind:checked={hasTv}
                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        for="hasTv"
                        class="ml-2 block text-sm text-gray-700"
                      >
                        TV
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        name="hasBreakfast"
                        id="hasBreakfast"
                        bind:checked={hasBreakfast}
                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        for="hasBreakfast"
                        class="ml-2 block text-sm text-gray-700"
                      >
                        Breakfast
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        name="hasPool"
                        id="hasPool"
                        bind:checked={hasPool}
                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        for="hasPool"
                        class="ml-2 block text-sm text-gray-700"
                      >
                        Pool
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        name="isKidFriendly"
                        id="isKidFriendly"
                        bind:checked={isKidFriendly}
                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        for="isKidFriendly"
                        class="ml-2 block text-sm text-gray-700"
                      >
                        Kid Friendly
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        name="isPetFriendly"
                        id="isPetFriendly"
                        bind:checked={isPetFriendly}
                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        for="isPetFriendly"
                        class="ml-2 block text-sm text-gray-700"
                      >
                        Pet Friendly
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        name="isSeniorFriendly"
                        id="isSeniorFriendly"
                        bind:checked={isSeniorFriendly}
                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        for="isSeniorFriendly"
                        class="ml-2 block text-sm text-gray-700"
                      >
                        Senior Friendly
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        name="isSyaria"
                        id="isSyaria"
                        bind:checked={isSyaria}
                        class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        for="isSyaria"
                        class="ml-2 block text-sm text-gray-700"
                      >
                        Syaria
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>

              <div class="sm:col-span-6">
                <label
                  for="description"
                  class="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows="4"
                  bind:value={description}
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                ></textarea>
              </div>

              <div class="sm:col-span-6">
                <label
                  for="address"
                  class="block text-sm font-medium text-gray-700"
                >
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  bind:value={address}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div class="sm:col-span-6">
                <label class="block text-sm font-medium text-gray-700">
                  City and Province
                </label>
                <div class="mt-1">
                  <CityAutocomplete
                    bind:selectedCity
                    onselect={handleCitySelect}
                    onclear={handleCityClear}
                    placeholder="Search for city and province..."
                  />
                </div>
                <p class="mt-1 text-sm text-gray-500">
                  Start typing to search for a city. This will help categorize
                  your villa by location.
                </p>

                <!-- Hidden inputs for form submission -->
                <input
                  type="hidden"
                  name="provinceId"
                  bind:value={provinceId}
                />
                <input type="hidden" name="cityId" bind:value={cityId} />
              </div>

              <div class="sm:col-span-3">
                <label
                  for="latitude"
                  class="block text-sm font-medium text-gray-700"
                >
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  id="latitude"
                  step="0.00000001"
                  bind:value={latitude}
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div class="sm:col-span-3">
                <label
                  for="longitude"
                  class="block text-sm font-medium text-gray-700"
                >
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  id="longitude"
                  step="0.00000001"
                  bind:value={longitude}
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div class="sm:col-span-3">
                <label
                  for="googleMapsLink"
                  class="block text-sm font-medium text-gray-700"
                >
                  Google Maps Link
                </label>
                <input
                  type="url"
                  name="googleMapsLink"
                  id="googleMapsLink"
                  bind:value={googleMapsLink}
                  placeholder="https://maps.google.com/..."
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p class="mt-1 text-sm text-gray-500">
                  Paste the Google Maps link for this villa location
                </p>
              </div>

              <div class="sm:col-span-3">
                <label
                  for="googlePlaceId"
                  class="block text-sm font-medium text-gray-700"
                >
                  Google Place ID
                </label>
                <div class="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="googlePlaceId"
                    id="googlePlaceId"
                    bind:value={googlePlaceId}
                    placeholder="eg: ChIJN1t_tDeuEmsRUsoyG83xxxxxx"
                    class="block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onclick={() => (showPlaceSearchDialog = true)}
                    class="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <svg
                      class="h-4 w-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                    Detect
                  </button>
                </div>
                <p class="mt-1 text-sm text-gray-500">
                  Paste Google Place ID for better tracking, or click "Detect"
                  to search for places.
                </p>
              </div>

              <div class="sm:col-span-3">
                <label
                  for="phoneNumber"
                  class="block text-sm font-medium text-gray-700"
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  bind:value={phoneNumber}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div class="sm:col-span-6">
                <label
                  for="keywords"
                  class="block text-sm font-medium text-gray-700"
                >
                  Keywords (comma separated)
                </label>
                <input
                  type="text"
                  name="keywords"
                  id="keywords"
                  bind:value={keywords}
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div class="mt-6 flex justify-between items-center">
              <button
                type="button"
                onclick={() => (showLocationSearchDialog = true)}
                class="inline-flex items-center px-4 py-2 border border-indigo-300 bg-indigo-50 text-sm font-medium text-indigo-700 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <svg
                  class="h-4 w-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
                Get Location Data
              </button>
              <div class="flex space-x-3">
                <button
                  type="button"
                  onclick={resetFormChanges}
                  class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                >
                  Reset Changes
                </button>
                <button
                  type="submit"
                  class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                >
                  Update Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <!-- Additional Features Section -->
      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              Additional Features
            </h3>
            <button
              type="button"
              onclick={() => (showAmenityForm = !showAmenityForm)}
              class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm leading-4 font-medium text-white hover:bg-indigo-700"
            >
              Add Feature
            </button>
          </div>

          {#if showAmenityForm}
            <form
              method="post"
              action="?/addAmenity"
              use:enhance={() => {
                return async ({ result }) => {
                  if (result.type === "success") {
                    showToast.success("Feature added successfully");
                    showAmenityForm = false;
                    await invalidateAll();
                  } else if (result.type === "failure") {
                    showToast.error(
                      result.data?.error || "Failed to add feature",
                    );
                  }
                };
              }}
              class="mb-4 rounded-lg border p-4"
            >
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label
                    for="name"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    for="description"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    name="description"
                    id="description"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    for="category"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Category
                  </label>
                  <select
                    name="category"
                    id="category"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select category</option>
                    {#each Object.entries(AMENITY_CATEGORIES).sort( (a, b) => a[0]
                          .toLowerCase()
                          .localeCompare(b[0].toLowerCase()), ) as [key, value]}
                      <option {value}>{CATEGORY_DISPLAY_NAMES[key]}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label
                    for="score"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Score (0-3)
                  </label>
                  <input
                    type="number"
                    name="score"
                    id="score"
                    min="0"
                    max="3"
                    value="1"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    Weight for PVR calculation
                  </p>
                </div>
              </div>
              <div class="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onclick={() => (showAmenityForm = false)}
                  class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
            </form>
          {/if}

          <div class="space-y-2">
            {#each data.villa.amenities as amenity}
              <div class="rounded border p-3">
                {#if editingAmenityId === amenity.id}
                  <!-- Edit mode -->
                  <form
                    method="post"
                    action="?/updateAmenity"
                    use:enhance={() => {
                      return async ({ result }) => {
                        if (result.type === "success") {
                          showToast.success("Feature updated successfully");
                          editingAmenityId = null;
                          await invalidateAll();
                        } else if (result.type === "failure") {
                          showToast.error(
                            result.data?.error || "Failed to update feature",
                          );
                        }
                      };
                    }}
                    class="space-y-3"
                  >
                    <input type="hidden" name="amenityId" value={amenity.id} />
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <div>
                        <label
                          for="edit-name-{amenity.id}"
                          class="block text-sm font-medium text-gray-700"
                        >
                          Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="edit-name-{amenity.id}"
                          value={amenity.name}
                          required
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label
                          for="edit-description-{amenity.id}"
                          class="block text-sm font-medium text-gray-700"
                        >
                          Description
                        </label>
                        <input
                          type="text"
                          name="description"
                          id="edit-description-{amenity.id}"
                          value={amenity.description || ""}
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label
                          for="edit-category-{amenity.id}"
                          class="block text-sm font-medium text-gray-700"
                        >
                          Category
                        </label>
                        <select
                          name="category"
                          id="edit-category-{amenity.id}"
                          value={amenity.category || ""}
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Select category</option>
                          {#each Object.entries(AMENITY_CATEGORIES).sort( (a, b) => a[0]
                                .toLowerCase()
                                .localeCompare(b[0].toLowerCase()), ) as [key, value]}
                            <option {value}
                              >{CATEGORY_DISPLAY_NAMES[key]}</option
                            >
                          {/each}
                        </select>
                      </div>
                      <div>
                        <label
                          for="edit-score-{amenity.id}"
                          class="block text-sm font-medium text-gray-700"
                        >
                          Score (0-3)
                        </label>
                        <input
                          type="number"
                          name="score"
                          id="edit-score-{amenity.id}"
                          value={amenity.score || 0}
                          min="0"
                          max="3"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <p class="mt-1 text-xs text-gray-500">Weight for PVR</p>
                      </div>
                    </div>
                    <div class="flex justify-end space-x-2">
                      <button
                        type="button"
                        onclick={() => (editingAmenityId = null)}
                        class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        class="rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                {:else}
                  <!-- Display mode -->
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-medium">{amenity.name}</span>
                      {#if amenity.description}
                        <span class="text-gray-500"
                          >: {amenity.description}</span
                        >
                      {/if}
                      {#if amenity.category}
                        <span
                          class="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                        >
                          {amenity.category}
                        </span>
                      {/if}
                      {#if amenity.score !== null && amenity.score !== undefined}
                        <span
                          class="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
                        >
                          Score: {amenity.score}
                        </span>
                      {/if}
                    </div>
                    <div class="flex space-x-2">
                      <button
                        type="button"
                        onclick={() => (editingAmenityId = amenity.id)}
                        class="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="Edit feature"
                      >
                        <PencilEditIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onclick={() => {
                          amenityToDelete = amenity;
                          showAmenityDeleteModal = true;
                        }}
                        class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Remove feature"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                {/if}
              </div>
            {:else}
              <p class="text-gray-500">No custom amenities added yet</p>
            {/each}
          </div>
        </div>
      </div>

      <!-- OTA Links Section -->
      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <OtaLinksManager
            villaId={data.villa.id}
            otaLinks={data.otaLinks}
            onUpdate={async () => await invalidateAll()}
          />
        </div>
      </div>

      <!-- Nearby Places Section -->
      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <NearbyPlacesManager
            villaId={data.villa.id}
            nearbyPlaces={data.villa.nearbyPlaces}
            onUpdate={async () => await invalidateAll()}
          />
        </div>
      </div>
    {:else if activeTab === "places"}
      <!-- Linked Places Tab -->
      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <PlaceVillaManager
            villa={{
              id: data.villa.id,
              title: data.villa.title,
              latitude: data.villa.latitude,
              longitude: data.villa.longitude,
            }}
            onUpdate={async () => await invalidateAll()}
          />
        </div>
      </div>
    {/if}
  </div>
</div>

<div
  class="mt-5 bg-gray-50 top-0 z-30 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-sm"
>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
    <div class="flex gap-4 h-16 items-center justify-between">
      <!-- Mobile: Back button, Desktop: Villana brand -->
      <div class="flex gap-4 items-center">
        <BackIcon className="text-white" />
        <a
          href="/explore"
          class="text-xl font-bold text-white hover:text-blue-100"
        >
          Back
        </a>
      </div>
    </div>
  </div>
</div>

<!-- Image Lightbox -->
<ImageLightbox
  {mediaItems}
  currentIndex={lightboxCurrentIndex}
  isOpen={showImageLightbox}
  onClose={() => (showImageLightbox = false)}
/>

<!-- Error Modal -->
<ErrorModal
  bind:isOpen={showErrorModal}
  title="Villa Update Error"
  message={errorMessage}
/>

<!-- Delete Confirmation Modal -->
<ConfirmationModal
  bind:isOpen={showDeleteModal}
  title="Delete Villa"
  message="Are you sure you want to delete this villa? This action cannot be undone."
  confirmText="Delete Villa"
  cancelText="Cancel"
  danger={true}
  onConfirm={async () => {
    isDeleting = true;
    try {
      const response = await fetch(`?/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (response.ok || response.redirected) {
        showToast.success("Villa deleted successfully");
        await goto("/admin/villas");
      } else {
        const text = await response.text();
        throw new Error(text || "Failed to delete villa");
      }
    } catch (error) {
      errorMessage = error.message || "Failed to delete villa";
      showErrorModal = true;
    } finally {
      isDeleting = false;
    }
  }}
/>

<!-- Amenity Delete Confirmation Modal -->
<ConfirmationModal
  bind:isOpen={showAmenityDeleteModal}
  title="Remove Feature"
  message="Are you sure you want to remove '{amenityToDelete?.name}'? This action cannot be undone."
  confirmText="Remove Feature"
  cancelText="Cancel"
  danger={true}
  onConfirm={async () => {
    if (!amenityToDelete) return;

    try {
      const formData = new FormData();
      formData.append("amenityId", amenityToDelete.id);

      const response = await fetch("?/deleteAmenity", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        showToast.success("Feature removed successfully");
        await invalidateAll();
      } else {
        const result = await response.json();
        throw new Error(result.error || "Failed to remove feature");
      }
    } catch (error) {
      showToast.error(error.message || "Failed to remove feature");
    } finally {
      amenityToDelete = null;
      showAmenityDeleteModal = false;
    }
  }}
/>

<!-- Image Delete Confirmation Modal -->
<ConfirmationModal
  bind:isOpen={showImageDeleteModal}
  title="Delete Image"
  message="Are you sure you want to delete this image? This action cannot be undone."
  confirmText="Delete Image"
  cancelText="Cancel"
  danger={true}
  onConfirm={async () => {
    if (!imageToDelete) return;

    try {
      const formData = new FormData();
      formData.append("imageId", imageToDelete.id);

      const response = await fetch("?/deleteImage", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        showToast.success("Image deleted successfully");
        await invalidateAll();
      } else {
        showToast.error("Failed to delete image");
      }
    } catch (error) {
      showToast.error("Failed to delete image");
    } finally {
      imageToDelete = null;
      showImageDeleteModal = false;
    }
  }}
/>

<!-- Video Delete Confirmation Modal -->
<ConfirmationModal
  bind:isOpen={showVideoDeleteModal}
  title="Delete Video"
  message="Are you sure you want to delete this video{videoToDelete?.altText
    ? ` (${videoToDelete.altText})`
    : ''}? This action cannot be undone."
  confirmText="Delete Video"
  cancelText="Cancel"
  danger={true}
  onConfirm={async () => {
    if (!videoToDelete) return;

    try {
      const formData = new FormData();
      formData.append("videoId", videoToDelete.id);

      const response = await fetch("?/deleteVideo", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        showToast.success("Video deleted successfully");
        await invalidateAll();
      } else {
        showToast.error("Failed to delete video");
      }
    } catch (error) {
      showToast.error("Failed to delete video");
    } finally {
      videoToDelete = null;
      showVideoDeleteModal = false;
    }
  }}
/>

<!-- Place Search Dialog -->
<PlaceSearchDialog
  bind:isOpen={showPlaceSearchDialog}
  initialQuery={title}
  onPlaceSelect={handlePlaceSelect}
/>

<!-- Location Search Dialog -->
<LocationSearchDialog
  bind:isOpen={showLocationSearchDialog}
  initialQuery={title}
  onLocationSelect={handleLocationSelect}
/>

<!-- PVR Debug Modal -->
<PVRDebugModal
  bind:show={showPVRDebugModal}
  debugData={pvrDebugData}
  loading={pvrDebugLoading}
/>

<!-- WhatsApp Analytics Modal -->
<WhatsAppAnalyticsModal
  bind:show={showWhatsAppAnalyticsModal}
  villaId={data.villa.id}
/>
