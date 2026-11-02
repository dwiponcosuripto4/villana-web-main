<script lang="ts">
  import VillaCard from "$lib/components/VillaCard.svelte";

  // Mock villa data for testing
  const mockVilla = {
    id: 1,
    title: "Beautiful Beach Villa",
    slug: "beautiful-beach-villa",
    priceMin: "1000000",
    priceMax: "1500000",
    unitsCount: 2,
    personCapacityMin: 4,
    personCapacityMax: 8,
    bedroomMin: 2,
    bedroomMax: 3,
    hasAc: true,
    hasBathtub: true,
    hasTv: true,
    hasBreakfast: false,
    hasPool: true,
    description: "A beautiful villa by the beach",
    address: "Jl. Pantai Indah No. 123",
    phoneNumber: "+6281234567890",
    status: "published",
    viewCount: 100,
    savedCount: 10,
    googleRating: 4.5,
    googleRatingCount: 25,
    pvr: 8.5,
    images: [
      {
        id: 1,
        villaId: 1,
        imageUrl: "https://placehold.co/600x400",
        thumbnailUrl: "https://placehold.co/300x200",
        altText: "Villa exterior",
        orderIndex: 0
      }
    ],
    amenities: [],
    videos: [],
    bedSizes: [],
    nearbyPlaces: [],
    province: { id: "1", name: "Bali" },
    city: { id: "1", name: "Denpasar" },
    googlePlaceId: null,
    distanceKm: "5.2"
  };
</script>

<div class="container mx-auto p-8">
  <h1 class="text-2xl font-bold mb-8">VillaCard Test Page</h1>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div>
      <h2 class="text-lg font-semibold mb-4">Without Phone Number</h2>
      <VillaCard villa={mockVilla} variant="desktop" showDistance={true} />
    </div>

    <div>
      <h2 class="text-lg font-semibold mb-4">With Phone Number</h2>
      <VillaCard villa={mockVilla} variant="desktop" showDistance={true} showPhoneNumber={true} />
    </div>
  </div>

  <div class="mt-8">
    <h2 class="text-lg font-semibold mb-4">Mobile Variant with Phone Number</h2>
    <div class="max-w-sm">
      <VillaCard villa={mockVilla} variant="mobile" showPhoneNumber={true} />
    </div>
  </div>
</div>