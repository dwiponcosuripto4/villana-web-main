# This is an example of the JSON format for a villa listing.

Tolong carikan informasi detail tentang villa xxx dengan link Google Maps xxx
Output dalam format json, contohnya seperti di bawah ini. Gunakan villa-id=5

```json
{
  "villa": {
    "title": "EDGE Premium Homestay",
    "slug": "edge-premium-homestay",
    "priceMin": "650k",
    "priceMax": "1200k",
    "unitsCount": 1,
    "bedroomMin": 1,
    "bedroomMax": 2,
    "personCapacityMin": 2,
    "personCapacityMax": 4,
    "hasAc": true,
    "hasBathtub": false,
    "hasTv": true,
    "hasBreakfast": true,
    "hasPool": true,
    "bedSize": "Queen, King",
    "description": "DEGE Premium Homestay adalah....",
    "address": "Jl. Telaga Menjer Km 01, Desa Tlogo, Garung, Wonosobo, Jawa Tengah, Indonesia",
    "city": "Wonosobo",
    "province": "Jawa Tengah",
    "latitude": "-7.3133",
    "longitude": "109.9124",
    "phoneNumber": "+62-813-2712-4567",
    "status": "published",
    "googleMapsLink": "https://maps.app.goo.gl/TwfHTmwLjrWEBrxD7",
    "googleRating": 4.8,
    "isKidFriendly": false,
    "isPetFriendly": false
  },
  "images": [
    {
      "imageUrl": "/images/villas/[villa-id]/1.webp",
      "thumbnailUrl": "/images/villas/[villa-id]/1.webp",
      "altText": "EDGE Premium Homestay",
      "orderIndex": 1
    }
  ],
  "amenities": [
    {
      "name": "Lake View",
      "description": "Pemandangan langsung ke Telaga Menjer dan Gunung Sindoro",
      "category": "scenery",
      "score": 2
    },
    {
      "name": "Swimming Pool",
      "description": "Kolam renang dengan pemandangan danau",
      "category": "pool",
      "score": 2
    },
    {
      "name": "Breakfast",
      "description": "Sarapan gratis setiap pagi (nasi goreng, buah, roti, jus)",
      "category": "breakfast",
      "score": 1
    },
    {
      "name": "WiFi",
      "description": "Koneksi internet gratis di seluruh area homestay",
      "category": "connectivity",
      "score": 1
    },
    {
      "name": "Private Balcony",
      "description": "Setiap kamar memiliki balkon/teras pribadi dengan view danau",
      "category": "access",
      "score": 1
    },
    {
      "name": "Mountain View",
      "description": "Pemandangan pegunungan dari area umum",
      "category": "scenery",
      "score": 1
    },
    {
      "name": "Resepsionis dan bantuan tamu 24 jam",
      "description": "Resepsionis dan bantuan tamu 24 jam",
      "category": "housekeeping",
      "score": 1
    }
  ]
}
```

Catatan:

1. Untuk amenities category yang digunakan adalah: scenery, pool, breakfast,
   connectivity, access, kitchen, security, entertainment, parking, dining,
   bathroom, housekeeping, gym, pet-friendly, business.
2. Ganti `[villa-id]` pada imageUrl dan thumbnailUrl dengan ID villa yang
   sesuai.
3. Hal berkaitan dengan balkon, teras, dek, rooftop, masuknya ke dalam kategori
   "access".
4. Gunakan bahasa Indonesia sebisa mungkin.
5. Jangan menggunakan markdown pada description!
6. Output berupa plain json, tanpa penjelasan apapun!
