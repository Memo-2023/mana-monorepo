# Inventory Project Guide

## Overview

**Inventory** ist eine App zur Verwaltung von persönlichem Besitz und Inventar. Erfasse Gegenstände mit Fotos, Kaufbelegen, Garantie-Dokumenten, Kategorien und Standorten.

| App     | Port | URL                       |
| ------- | ---- | ------------------------- |
| Backend | 3020 | http://localhost:3020     |
| Web App | 5188 | http://localhost:5188     |
| Landing | 4325 | http://localhost:4325     |

## Project Structure

```
apps/inventory/
├── apps/
│   ├── backend/          # NestJS API server (@inventory/backend)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── db/
│   │       │   ├── database.module.ts
│   │       │   ├── connection.ts
│   │       │   └── schema/
│   │       │       ├── items.schema.ts
│   │       │       ├── categories.schema.ts
│   │       │       ├── locations.schema.ts
│   │       │       ├── item-photos.schema.ts
│   │       │       ├── item-documents.schema.ts
│   │       │       └── item-contacts.schema.ts
│   │       ├── item/
│   │       ├── category/
│   │       ├── location/
│   │       ├── photo/
│   │       ├── document/
│   │       ├── storage/
│   │       ├── import/
│   │       ├── export/
│   │       └── health/
│   │
│   ├── web/              # SvelteKit web app (@inventory/web)
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── api/
│   │       │   ├── stores/
│   │       │   ├── components/
│   │       │   └── i18n/
│   │       └── routes/
│   │           ├── +layout.svelte
│   │           ├── (auth)/
│   │           └── (app)/
│   │
│   └── landing/          # Astro landing page (@inventory/landing)
│
├── packages/
│   └── shared/           # Shared types & constants (@inventory/shared)
│
├── package.json
└── CLAUDE.md
```

## Commands

### Root Level (from monorepo root)

```bash
# Alle Apps starten
pnpm inventory:dev                # Run all inventory apps

# Einzelne Apps starten
pnpm dev:inventory:backend        # Start backend server (port 3018)
pnpm dev:inventory:web            # Start web app (port 5188)
pnpm dev:inventory:landing        # Start landing page (port 4325)
pnpm dev:inventory:app            # Start web + backend together

# Datenbank
pnpm inventory:db:push            # Push schema to database
pnpm inventory:db:studio          # Open Drizzle Studio
pnpm inventory:db:seed            # Seed initial data

# Deploy
pnpm deploy:landing:inventory     # Deploy landing to Cloudflare Pages
```

### Backend (apps/inventory/apps/backend)

```bash
pnpm dev                         # Start with hot reload
pnpm build                       # Build for production
pnpm start:prod                  # Start production server
pnpm db:push                     # Push schema to database
pnpm db:studio                   # Open Drizzle Studio
pnpm db:seed                     # Seed initial data
```

### Web App (apps/inventory/apps/web)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
pnpm preview                     # Preview production build
```

### Landing Page (apps/inventory/apps/landing)

```bash
pnpm dev                         # Start dev server (port 4325)
pnpm build                       # Build for production
pnpm preview                     # Preview build
```

## Technology Stack

| Layer       | Technology                            |
| ----------- | ------------------------------------- |
| **Backend** | NestJS 10, Drizzle ORM, PostgreSQL    |
| **Web**     | SvelteKit 2.x, Svelte 5, Tailwind CSS |
| **Landing** | Astro 5.x, Tailwind CSS               |
| **Auth**    | Mana Core Auth (JWT)                  |
| **Storage** | MinIO/S3 via @manacore/shared-storage |
| **i18n**    | svelte-i18n (DE, EN, FR, ES, IT)      |

## Features

### 1. Items verwalten
- Erstelle/Bearbeite/Lösche Gegenstände
- Name, Beschreibung, SKU (optional)
- Kaufdatum, Kaufpreis, Währung
- Aktueller Wert, Zustand (neu/sehr gut/gut/akzeptabel/schlecht)
- Garantie-Ablauf und Notizen
- Favoriten und Archiv-Funktion

### 2. Fotos
- Multiple Fotos pro Gegenstand
- Primärfoto-Auswahl
- Drag & Drop Upload
- Bildunterschriften

### 3. Dokumente
- Kaufbelege, Garantiescheine, Handbücher
- PDF/Bild-Upload
- Dokument-Typen (receipt, warranty, manual, other)

### 4. Kategorien (hierarchisch)
- Verschachtelte Kategorien (z.B. Elektronik > Computer > Laptops)
- Icons und Farben
- Drag & Drop Sortierung

### 5. Standorte (hierarchisch)
- Verschachtelte Orte (z.B. Haus > Wohnzimmer > Regal)
- Beschreibung pro Standort

### 6. Import/Export
- CSV Import mit Vorschau
- CSV Export (alle oder gefiltert)
- Vorlagen-Download

### 7. Contacts-Integration
- Verknüpfe Gegenstände mit Kontakten
- Beziehungstypen: Verkäufer, Hersteller, Service

## API Endpoints

### Health
```
GET    /api/v1/health              # Health check
```

### Items
```
GET    /api/v1/items               # List items with filters
POST   /api/v1/items               # Create item
GET    /api/v1/items/:id           # Get item with photos, documents
PUT    /api/v1/items/:id           # Update item
DELETE /api/v1/items/:id           # Soft delete (archive)
PATCH  /api/v1/items/:id/toggle-favorite
PATCH  /api/v1/items/:id/toggle-archive
```

### Photos
```
POST   /api/v1/items/:id/photos              # Upload photos
DELETE /api/v1/items/:id/photos/:photoId     # Delete photo
PATCH  /api/v1/items/:id/photos/:photoId/set-primary
PATCH  /api/v1/items/:id/photos/reorder      # Reorder photos
```

### Documents
```
POST   /api/v1/items/:id/documents           # Upload document
DELETE /api/v1/items/:id/documents/:docId    # Delete document
GET    /api/v1/items/:id/documents/:docId/download
```

### Categories
```
GET    /api/v1/categories          # List all categories (tree)
POST   /api/v1/categories          # Create category
PATCH  /api/v1/categories/:id      # Update category
DELETE /api/v1/categories/:id      # Delete category
```

### Locations
```
GET    /api/v1/locations           # List all locations (tree)
POST   /api/v1/locations           # Create location
PATCH  /api/v1/locations/:id       # Update location
DELETE /api/v1/locations/:id       # Delete location
```

### Import/Export
```
POST   /api/v1/import/csv          # Import from CSV
GET    /api/v1/import/template     # Download CSV template
GET    /api/v1/export/csv          # Export to CSV
POST   /api/v1/export/csv          # Export with filters
```

## Database Schema

### items
| Column          | Type         | Description               |
| --------------- | ------------ | ------------------------- |
| `id`            | UUID         | Primary key               |
| `user_id`       | VARCHAR(255) | Owner                     |
| `name`          | VARCHAR(255) | Item name                 |
| `description`   | TEXT         | Description               |
| `sku`           | VARCHAR(100) | Stock keeping unit        |
| `category_id`   | UUID         | Category reference        |
| `location_id`   | UUID         | Location reference        |
| `purchase_date` | DATE         | When purchased            |
| `purchase_price`| DECIMAL      | Purchase price            |
| `currency`      | VARCHAR(3)   | Currency code (EUR, USD)  |
| `current_value` | DECIMAL      | Current estimated value   |
| `condition`     | VARCHAR(20)  | new/like_new/good/fair/poor |
| `warranty_expires` | DATE      | Warranty expiration       |
| `warranty_notes`| TEXT         | Warranty details          |
| `notes`         | TEXT         | Additional notes          |
| `quantity`      | INTEGER      | Quantity (default: 1)     |
| `is_favorite`   | BOOLEAN      | Favorited                 |
| `is_archived`   | BOOLEAN      | Archived (soft delete)    |
| `created_at`    | TIMESTAMP    | Created timestamp         |
| `updated_at`    | TIMESTAMP    | Updated timestamp         |

### categories
| Column              | Type         | Description          |
| ------------------- | ------------ | -------------------- |
| `id`                | UUID         | Primary key          |
| `user_id`           | VARCHAR(255) | Owner                |
| `name`              | VARCHAR(100) | Category name        |
| `icon`              | VARCHAR(50)  | Icon identifier      |
| `color`             | VARCHAR(7)   | Hex color            |
| `parent_category_id`| UUID         | Parent for hierarchy |
| `created_at`        | TIMESTAMP    | Created timestamp    |

### locations
| Column              | Type         | Description          |
| ------------------- | ------------ | -------------------- |
| `id`                | UUID         | Primary key          |
| `user_id`           | VARCHAR(255) | Owner                |
| `name`              | VARCHAR(100) | Location name        |
| `description`       | TEXT         | Description          |
| `parent_location_id`| UUID         | Parent for hierarchy |
| `created_at`        | TIMESTAMP    | Created timestamp    |

### item_photos
| Column       | Type         | Description          |
| ------------ | ------------ | -------------------- |
| `id`         | UUID         | Primary key          |
| `item_id`    | UUID         | Item reference       |
| `storage_key`| VARCHAR(500) | S3 storage key       |
| `is_primary` | BOOLEAN      | Is primary photo     |
| `caption`    | VARCHAR(255) | Photo caption        |
| `sort_order` | INTEGER      | Display order        |
| `created_at` | TIMESTAMP    | Upload timestamp     |

### item_documents
| Column         | Type         | Description            |
| -------------- | ------------ | ---------------------- |
| `id`           | UUID         | Primary key            |
| `item_id`      | UUID         | Item reference         |
| `storage_key`  | VARCHAR(500) | S3 storage key         |
| `document_type`| VARCHAR(20)  | receipt/warranty/manual/other |
| `filename`     | VARCHAR(255) | Original filename      |
| `mime_type`    | VARCHAR(100) | MIME type              |
| `file_size`    | BIGINT       | File size in bytes     |
| `uploaded_at`  | TIMESTAMP    | Upload timestamp       |

### item_contacts
| Column            | Type         | Description               |
| ----------------- | ------------ | ------------------------- |
| `id`              | UUID         | Primary key               |
| `item_id`         | UUID         | Item reference            |
| `contact_id`      | UUID         | Contact reference (from Contacts app) |
| `relationship_type`| VARCHAR(20) | seller/manufacturer/service |
| `created_at`      | TIMESTAMP    | Created timestamp         |

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3020
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/inventory
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5188,http://localhost:8081
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
INVENTORY_S3_PUBLIC_URL=http://localhost:9000/inventory-storage
DEV_BYPASS_AUTH=true
DEV_USER_ID=your-test-user-id
```

### Web (.env)
```env
PUBLIC_BACKEND_URL=http://localhost:3018
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Web App Stores (Svelte 5 Runes)

```typescript
// auth.svelte.ts - Authentication
authStore.isAuthenticated
authStore.user
authStore.signIn(email, password)
authStore.signOut()
authStore.getAccessToken()

// items.svelte.ts - Items
itemsStore.items
itemsStore.selectedItem
itemsStore.loading
itemsStore.fetchItems(filters)
itemsStore.createItem(data)
itemsStore.updateItem(id, data)
itemsStore.deleteItem(id)
itemsStore.toggleFavorite(id)
itemsStore.toggleArchive(id)

// categories.svelte.ts - Categories
categoriesStore.categories
categoriesStore.categoryTree
categoriesStore.fetchCategories()
categoriesStore.createCategory(data)
categoriesStore.updateCategory(id, data)
categoriesStore.deleteCategory(id)

// locations.svelte.ts - Locations
locationsStore.locations
locationsStore.locationTree
locationsStore.fetchLocations()
locationsStore.createLocation(data)
locationsStore.updateLocation(id, data)
locationsStore.deleteLocation(id)
```

## Quick Start

### 1. Datenbank erstellen

```bash
# PostgreSQL Container muss laufen
docker compose -f docker-compose.dev.yml up -d postgres

# Datenbank erstellen
PGPASSWORD=devpassword psql -h localhost -U manacore -d postgres -c "CREATE DATABASE inventory;"

# Schema pushen
pnpm inventory:db:push
```

### 2. Apps starten

```bash
# Backend + Web zusammen
pnpm dev:inventory:app

# Oder einzeln:
pnpm dev:inventory:backend  # Terminal 1
pnpm dev:inventory:web      # Terminal 2
pnpm dev:inventory:landing  # Terminal 3 (optional)
```

### 3. URLs öffnen

- Web App: http://localhost:5188
- Landing: http://localhost:4325
- API Health: http://localhost:3018/api/v1/health

## Testing API (mit curl)

```bash
# Health Check
curl http://localhost:3020/api/v1/health

# Login (get token)
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' | jq -r '.accessToken')

# Items abrufen
curl http://localhost:3020/api/v1/items \
  -H "Authorization: Bearer $TOKEN"

# Neues Item erstellen
curl -X POST http://localhost:3018/api/v1/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "MacBook Pro", "purchasePrice": 2499.00, "currency": "EUR"}'

# Kategorie erstellen
curl -X POST http://localhost:3018/api/v1/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Elektronik", "icon": "laptop", "color": "#3B82F6"}'
```

## Important Notes

1. **Authentication**: Nutzt Mana Core Auth (JWT im Authorization Header)
2. **Database**: PostgreSQL mit Drizzle ORM (Port 5432)
3. **Port**: Backend läuft auf Port 3018, Web auf 5188, Landing auf 4325
4. **i18n**: 5 Sprachen unterstützt (DE, EN, FR, ES, IT)
5. **Theme**: Teal/Cyan (#14B8A6) als Primärfarbe
6. **Storage**: Nutzt MinIO/S3 für Fotos und Dokumente via @manacore/shared-storage
7. **Contacts**: Integration mit Contacts-App für Verkäufer/Hersteller-Verknüpfung
