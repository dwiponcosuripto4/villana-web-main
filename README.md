# Villana Web - Villa Rental Platform

A modern villa rental platform built with SvelteKit, featuring a responsive
design with mobile-first approach and comprehensive admin management system.

## Overview

Villana Web is a full-stack villa rental application that allows users to
browse, search, and filter villa listings. The platform features a
Pinterest-style grid layout for desktop and Instagram/TikTok-style feed for
mobile devices, providing an engaging user experience across all devices.

## Features

### User Features

- **Villa Browsing**: Browse available villa listings with rich media
- **Advanced Search & Filtering**: Filter by price range, bedrooms, location,
  and amenities
- **Responsive Design**: Mobile-first approach with Instagram-style feed for
  mobile and Pinterest-style grid for desktop
- **Villa Details**: Comprehensive villa information including images,
  amenities, pricing, and contact details
- **Internationalization**: Multi-language support (English/Indonesian) using
  Paraglide

### Admin Features

- **User Management**: Admin and viewer role system with authentication
- **Villa Management**: Full CRUD operations for villa listings
- **Image Management**: Upload and manage villa images with thumbnail generation
- **Status Management**: Draft/published status for villa listings
- **Analytics**: View count tracking for villa listings

### Technical Features

- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication with secure cookies and
  Argon2 password hashing
- **Image Optimization**: Automated image processing and thumbnail generation
- **Testing**: Comprehensive test suite with Vitest and Playwright
- **Development Tools**: Storybook for component development
- **Code Quality**: Prettier, ESLint, and TypeScript for code quality

## Tech Stack

- **Frontend**: SvelteKit 2, Svelte 5, TypeScript
- **Styling**: TailwindCSS 4 with custom components
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with secure cookies
- **Internationalization**: Paraglide JS
- **Testing**: Vitest (unit), Playwright (e2e)
- **Development**: Storybook, Docker Compose
- **Build**: Vite with Node.js adapter

## Project Structure

```
src/
├── lib/
│   ├── server/
│   │   ├── auth.ts              # Authentication utilities
│   │   ├── auth-utils.ts        # Auth helper functions
│   │   ├── db/
│   │   │   ├── index.ts         # Database connection
│   │   │   └── schema.ts        # Database schema definitions
│   │   ├── services/
│   │   │   ├── admin.service.ts # Admin operations
│   │   │   └── villa.service.ts # Villa CRUD operations
│   │   └── validation.ts        # Server-side validation
│   ├── paraglide/              # Internationalization
│   └── utils/
│       └── format.ts           # Utility functions
├── routes/
│   ├── +layout.svelte          # Root layout
│   ├── +page.svelte            # Homepage (villa listings)
│   ├── admin/                  # Admin panel routes
│   │   ├── login/              # Admin authentication
│   │   ├── setup/              # Initial admin setup
│   │   ├── users/              # User management
│   │   └── villas/             # Villa management
│   └── villa/[slug]/           # Individual villa pages
├── app.d.ts                    # App type definitions
└── hooks.server.ts             # Server-side hooks
```

## Database Schema

The application uses a PostgreSQL database with the following main entities:

- **Users**: Admin and viewer roles with secure authentication
- **Sessions**: Secure session management
- **Villas**: Main entity with pricing, location, amenities, and metadata
- **Villa Images**: Image management with thumbnails and ordering
- **Villa Amenities**: Flexible amenity system
- **Villa Videos**: Manages videos for each villa.
- **Saved Villas**: Tracks villas saved by users.
- **Villa Bed Sizes**: Details on bed sizes and quantities for each villa.
- **Provinces and Cities**: Geographic data for location-based filtering.
- **Search Index**: Powers the full-text search functionality.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for database)
- PostgreSQL (if not using Docker)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd villana-web
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the database**

   ```bash
   npm run db:start
   ```

5. **Set up the database**

   ```bash
   npm run db:push
   npm run db:seed
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

7. **Access the application**
   - Website: http://localhost:5173
   - Admin: http://localhost:5173/admin
   - Storybook: http://localhost:6006 (run `npm run storybook`)

## Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run storybook` - Start Storybook development
- `npm run build-storybook` - Build the Storybook for deployment

### Database

- `npm run db:start` - Start PostgreSQL with Docker
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate migrations
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:seed` - Seed database with sample data
- `npm run db:import-geo` - Import province and city data
- `npm run db:populate-search` - Populate the full-text search index

### Code Quality

- `npm run check` - Type checking with svelte-check
- `npm run format` - Format code with Prettier
- `npm run lint` - Check code formatting

### Testing

- `npm run test:unit` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test` - Run all tests

### Utilities

- `npm run optimize-images` - Optimize images in static directory
- `npm run optimize-uploads` - Optimize images in the `uploads` directory
- `npm run relink-images` - Re-link optimized images to villas in database
  - `npm run relink-images -- --dry-run` - Preview changes without modifying database
  - `npm run relink-images -- --villa-id=123` - Re-link specific villa only
- `npm run gather-villas` - Gather villa data from maps sources
- `npm run recalc-pvr-all` - Recalculate PVR (Price Value Ratio) for all villas
  - `npm run recalc-pvr-all -- --dry-run` - Preview what would be processed without making changes
  - `BATCH_SIZE=100 npm run recalc-pvr-all` - Configure batch size (default: 50)

## Deployment

The application is configured for Node.js deployment using the
`@sveltejs/adapter-node`. Build the application and deploy the generated files
to your hosting provider.

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure code quality
5. Submit a pull request

## License

This project is private and proprietary.
