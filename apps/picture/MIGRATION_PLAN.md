# Picture App: Supabase zu Backend API Migration

## Ziel
Komplette Entfernung der direkten Supabase-Nutzung in der Mobile App. Alle Datenbankzugriffe sollen über die Backend API erfolgen (wie in der Chat App).

---

## Aktuelle Situation

### Backend (bereits implementiert)
| Endpoint | Status |
|----------|--------|
| `/api/images/*` | Vorhanden - CRUD, Archive, Batch-Operationen |
| `/api/generate/*` | Vorhanden - Bildgenerierung mit Replicate |
| `/api/tags/*` | Vorhanden - Tag-Management |
| `/api/boards/*` | Vorhanden - Board-Management |
| `/api/board-items/*` | Vorhanden - Board-Items |
| `/api/models/*` | Vorhanden - AI Modelle |
| `/api/explore/*` | Vorhanden - Öffentliche Galerie |
| `/api/upload/*` | Vorhanden - Datei-Upload |
| `/api/profiles/*` | **FEHLT** - User Profile |
| `/api/likes/*` | **FEHLT** - Image Likes |

### Mobile App (direkte Supabase-Nutzung)
Dateien die `supabase.from()` oder Supabase-Client nutzen:

1. `app/(tabs)/profile.tsx` - Profile-Daten laden/aktualisieren
2. `app/image/[id].tsx` - Einzelbild-Details
3. `hooks/useImageFetching.ts` - Bilder laden
4. `hooks/useImageLikes.ts` - Like-Funktionalität
5. `hooks/useImagePrefetch.ts` - Prefetching
6. `hooks/useExploreFetching.ts` - Explore-Daten
7. `hooks/useExplorePrefetch.ts` - Explore-Prefetching
8. `hooks/useArchiveFetching.ts` - Archiv-Daten
9. `store/tagStore.ts` - Tag-Daten
10. `store/batchStore.ts` - Batch-Generierung (nutzt Edge Functions)
11. `components/RateLimitIndicator.tsx` - Rate Limit Check

---

## Migrationsplan

### Phase 1: Backend erweitern

#### 1.1 Profile Endpoints hinzufügen
```
GET    /api/profiles/me           - Eigenes Profil laden
PATCH  /api/profiles/me           - Profil aktualisieren
GET    /api/profiles/stats        - User Stats (Bilder, Favoriten)
```

**Schema erweitern** (falls nicht vorhanden):
```typescript
// profiles table
{
  id: uuid (PK, same as auth user id)
  username: text
  email: text
  avatarUrl: text (optional)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 1.2 Like Endpoints hinzufügen
```
POST   /api/images/:id/like       - Bild liken
DELETE /api/images/:id/like       - Like entfernen
GET    /api/images/:id/likes      - Like-Status & Anzahl
```

**Schema erweitern** (falls nicht vorhanden):
```typescript
// image_likes table
{
  id: uuid (PK)
  imageId: uuid (FK to images)
  userId: uuid
  createdAt: timestamp
}
```

#### 1.3 Rate Limit Endpoint
```
GET    /api/rate-limit            - Aktueller Rate Limit Status
```

---

### Phase 2: Mobile API Client erstellen

#### 2.1 Zentraler API Client
Datei: `services/api/client.ts`

```typescript
import * as SecureStore from 'expo-secure-store';

const APP_TOKEN_KEY = '@manacore/app_token';
const BACKEND_URL = process.env.EXPO_PUBLIC_PICTURE_BACKEND_URL || 'http://localhost:3003';

async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(APP_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      return { data: null, error: error.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Network error' };
  }
}
```

#### 2.2 Domain-spezifische API Module

**`services/api/profiles.ts`**
```typescript
export const profileApi = {
  getMyProfile: () => apiRequest<Profile>('/profiles/me'),
  updateProfile: (data: UpdateProfileDto) => apiRequest<Profile>('/profiles/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  getStats: () => apiRequest<UserStats>('/profiles/stats'),
};
```

**`services/api/images.ts`** (erweitern)
```typescript
export const imageApi = {
  // Bestehende Funktionen...
  getImages: (params) => apiRequest<Image[]>(`/images?${new URLSearchParams(params)}`),
  getImage: (id) => apiRequest<Image>(`/images/${id}`),
  likeImage: (id) => apiRequest(`/images/${id}/like`, { method: 'POST' }),
  unlikeImage: (id) => apiRequest(`/images/${id}/like`, { method: 'DELETE' }),
  // etc.
};
```

**`services/api/explore.ts`**
```typescript
export const exploreApi = {
  getPublicImages: (params) => apiRequest<Image[]>(`/explore?${new URLSearchParams(params)}`),
  search: (term, params) => apiRequest<Image[]>(`/explore/search?searchTerm=${term}&${new URLSearchParams(params)}`),
};
```

**`services/api/tags.ts`**
```typescript
export const tagApi = {
  getTags: () => apiRequest<Tag[]>('/tags'),
  createTag: (data) => apiRequest<Tag>('/tags', { method: 'POST', body: JSON.stringify(data) }),
  updateTag: (id, data) => apiRequest<Tag>(`/tags/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTag: (id) => apiRequest(`/tags/${id}`, { method: 'DELETE' }),
  getImageTags: (imageId) => apiRequest<Tag[]>(`/tags/image/${imageId}`),
  addTagToImage: (imageId, tagId) => apiRequest(`/tags/image/${imageId}/${tagId}`, { method: 'POST' }),
  removeTagFromImage: (imageId, tagId) => apiRequest(`/tags/image/${imageId}/${tagId}`, { method: 'DELETE' }),
};
```

---

### Phase 3: Hooks migrieren

#### 3.1 `useImageFetching.ts`
- Ersetze `supabase.from('images')` durch `imageApi.getImages()`
- Pagination über API Query-Parameter

#### 3.2 `useImageLikes.ts`
- Ersetze `supabase.from('image_likes')` durch `imageApi.likeImage()` / `unlikeImage()`

#### 3.3 `useExploreFetching.ts`
- Ersetze `supabase.from('images').eq('is_public', true)` durch `exploreApi.getPublicImages()`

#### 3.4 `useArchiveFetching.ts`
- Ersetze `supabase.from('images').not('archived_at', 'is', null)` durch `imageApi.getImages({ archived: true })`

---

### Phase 4: Stores migrieren

#### 4.1 `tagStore.ts`
- Ersetze alle `supabase.from('tags')` und `supabase.from('image_tags')` durch `tagApi.*`

#### 4.2 `batchStore.ts`
- Ersetze `supabase.functions.invoke()` durch Backend API Calls
- Ersetze `supabase.channel()` Realtime durch Polling oder WebSocket zum Backend
- **ODER**: Batch-Generierung komplett über Backend API abwickeln

---

### Phase 5: Screens migrieren

#### 5.1 `profile.tsx`
```typescript
// Vorher:
const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();

// Nachher:
const { data } = await profileApi.getMyProfile();
```

#### 5.2 `image/[id].tsx`
```typescript
// Vorher:
const { data } = await supabase.from('images').select('*').eq('id', id).single();

// Nachher:
const { data } = await imageApi.getImage(id);
```

---

### Phase 6: Aufräumen

#### 6.1 Dateien entfernen
- `utils/supabase.ts` - Supabase Client
- Alle Supabase-Typen die nicht mehr gebraucht werden

#### 6.2 Dependencies entfernen
```json
// package.json - Diese entfernen:
"@supabase/supabase-js": "^2.38.4",
```

#### 6.3 Environment Variables aufräumen
```
# Nicht mehr benötigt:
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY

# Weiterhin benötigt:
EXPO_PUBLIC_PICTURE_BACKEND_URL
EXPO_PUBLIC_MANA_AUTH_URL
```

---

## Implementierungsreihenfolge

1. **Backend erweitern** (Profile, Likes, Rate Limit Endpoints)
2. **API Client erstellen** (`services/api/client.ts`)
3. **Domain APIs erstellen** (profiles, images erweitern, explore, tags)
4. **Hooks einzeln migrieren** (mit Tests nach jeder Migration)
5. **Stores migrieren** (tagStore, batchStore)
6. **Screens migrieren** (profile.tsx, image/[id].tsx)
7. **Supabase entfernen** (Dependencies, Environment Variables)
8. **Testen** (Alle Flows durchgehen)

---

## Geschätzter Aufwand

| Phase | Aufwand |
|-------|---------|
| Phase 1: Backend erweitern | ~2-3 Stunden |
| Phase 2: API Client | ~1 Stunde |
| Phase 3: Hooks migrieren | ~2-3 Stunden |
| Phase 4: Stores migrieren | ~1-2 Stunden |
| Phase 5: Screens migrieren | ~1 Stunde |
| Phase 6: Aufräumen & Testen | ~1 Stunde |
| **Gesamt** | **~8-11 Stunden** |

---

## Risiken & Hinweise

1. **Realtime-Subscriptions**: Supabase Realtime wird durch Polling ersetzt (bereits bei Bildgenerierung umgesetzt)
2. **Batch-Generierung**: Der `batchStore` nutzt Edge Functions - diese müssen ins Backend migriert werden
3. **Storage**: Bilder werden weiterhin irgendwo gespeichert - prüfen ob S3/R2 oder weiterhin Supabase Storage
4. **RLS Policies**: Backend übernimmt die Autorisierung - alle Queries müssen `userId` filtern
