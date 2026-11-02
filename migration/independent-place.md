
# Migration Guide

Here is the step to migrate for place entity

1. Run the migration: npx tsx scripts/migrate-villa-nearby-places.ts
2. Generate database migrations: npm run db:generate && npm run db:migrate
3. Update place coordinates: Use admin interface or Google Places API
4. Add place images: Upload and associate images with places
5. Monitor performance: Ensure geo-queries are optimized
6. Remove old structure: After verification, remove villa_nearby_place table

