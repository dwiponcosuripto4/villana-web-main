# This is an example of the JSON format for a Place

Carikan informasi detail tentang Sikunir Hill Dieng. Output dalam format json
seperti di bawah ini, hanya plain json, tanpa prolog/epilog dan tanpa kompentar,
just plain json. Gunakan bahasa Indonesia, dan description jangan pakai format
markdown, just plain text.

Contoh json:

```json
{
  "name": "Bukit Sikunir",
  "description": "Bukit Sikunir di Desa Sembungan, Kecamatan Kejajar, Kabupaten Wonosobo, Jawa Tengah merupakan destinasi wisata alam populer di Dataran Tinggi Dieng yang berada di ketinggian sekitar 2.200–2.463 meter di atas permukaan laut.",
  "type": "tourist_attraction",
  "category": "nature",
  "latitude": "-7.238833",
  "longitude": "109.924333",
  "address": "Desa Sembungan, Kecamatan Kejajar, Kabupaten Wonosobo, Jawa Tengah, Indonesia",
  "city": "Kabupaten Wonosobo",
  "province": "Jawa Tengah",
  "metaDescription": "Bukit Sikunir di Dieng terkenal sebagai spot sunrise spektakuler di ketinggian lebih dari 2.000 mdpl dengan panorama gunung dan lautan kabut yang menakjubkan."
}
```

NOTES:

- Possible types: restaurant, beach, temple, museum, park, shopping, waterfall,
  mountain, lake, market, tourist_attraction, airport, train_station,
  bus_station, hospital, mosque, church, other.
- Possible categories: restaurant, beach, temple, mosque, museum, park,
  shopping, waterfall, mountain, lake, market, tourist_attarction, airport,
  hospital, other.
- metaDescription tidak boleh lebih dari 160 karakter.
