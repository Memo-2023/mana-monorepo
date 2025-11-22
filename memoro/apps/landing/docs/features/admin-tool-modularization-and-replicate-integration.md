# Admin-Tool Modularisierung & Replicate-Integration

> **Dokument erstellt:** 28.01.2025  
> **Status:** Konzeptphase  
> **Ziel:** Wiederverwendbares Admin-Tool mit KI-Bildgenerierung

## 📋 Executive Summary

Das Memoro Admin-Tool entwickelt sich zu einem eigenständigen, wertvollen Werkzeug. Dieses Dokument beschreibt Konzepte zur:
1. **Modularisierung** des Admin-Tools für Wiederverwendbarkeit in anderen Projekten
2. **Integration von Replicate** zur KI-basierten Bildgenerierung für Personas
3. **Backend-Architektur** auf Hetzner VPS mit Coolify

## 🎯 Anforderungen

### Funktionale Anforderungen
- Admin-Tool soll in anderen Websites wiederverwendbar sein
- Komplette Trennung von Code und Content
- KI-basierte Bildgenerierung für Personas via Replicate
- Zentrale Backend-Services auf Hetzner VPS
- Verwaltung via Coolify (Docker-basiert)

### Nicht-funktionale Anforderungen
- Einfache Installation/Integration
- Minimale Dependencies
- Skalierbare Architektur
- Sichere API-Kommunikation
- Kosteneffiziente Bildgenerierung

## 🏗️ Modularisierungskonzepte

### Konzept 1: NPM Package + API Backend
**Architektur:**
```
@memoro/admin-tool (NPM Package)
├── components/           # Wiederverwendbare UI-Komponenten
├── layouts/             # Admin-Layouts
├── hooks/               # React/Vue Hooks für API
├── types/               # TypeScript Definitionen
└── utils/               # Helper Functions

@memoro/admin-api (Separates Backend)
├── /api/personas        # Personas CRUD
├── /api/images          # Bildgenerierung
├── /api/content         # Content Management
└── /api/auth           # Authentication
```

**Vorteile:**
- ✅ Maximale Wiederverwendbarkeit
- ✅ Framework-agnostisch (Adapter Pattern)
- ✅ Versionskontrolle via NPM
- ✅ Type-Safety durch TypeScript

**Nachteile:**
- ❌ Komplexe Initial-Setup
- ❌ Wartung von zwei Packages
- ❌ Breaking Changes Management

**Integration:**
```typescript
// In beliebiger Astro/Next/Vue App
import { AdminTool } from '@memoro/admin-tool';
import { MemoroadminProvider } from '@memoro/admin-tool/providers';

// Konfiguration
const config = {
  apiUrl: 'https://api.memoro-admin.com',
  apiKey: process.env.MEMORO_API_KEY,
  features: ['personas', 'content', 'images']
};

<MemoroadminProvider config={config}>
  <AdminTool />
</MemoroadminProvider>
```

### Konzept 2: Monorepo mit Shared Packages
**Struktur:**
```
memoro-workspace/
├── apps/
│   ├── memoro-website/     # Aktuelle Website
│   ├── admin-dashboard/    # Standalone Admin
│   └── api-backend/        # Zentrales Backend
├── packages/
│   ├── admin-ui/           # UI Components
│   ├── admin-core/         # Business Logic
│   ├── content-types/      # Shared Types
│   └── api-client/         # API Client Library
└── services/
    ├── image-generator/    # Replicate Service
    └── content-sync/       # Content Synchronization
```

**Vorteile:**
- ✅ Einheitliche Entwicklung
- ✅ Shared Dependencies
- ✅ Einfaches Testing
- ✅ Atomic Commits

**Nachteile:**
- ❌ Größeres Repository
- ❌ Komplexere CI/CD
- ❌ Schwieriger für externe Nutzer

**Tools:**
- Turborepo oder NX für Monorepo Management
- Changesets für Versionierung
- pnpm Workspaces für Dependencies

### Konzept 3: Microservices + Web Components
**Architektur:**
```
Frontend (Web Components)
├── <memoro-admin-dashboard>
├── <memoro-persona-manager>
├── <memoro-image-generator>
└── <memoro-content-editor>

Microservices (Docker/Coolify)
├── persona-service/        # Node.js/Fastify
├── image-service/         # Python/FastAPI + Replicate
├── content-service/       # Node.js/Express
├── auth-service/          # Node.js/JWT
└── gateway/              # Kong/Traefik
```

**Vorteile:**
- ✅ Framework-unabhängig
- ✅ Isolierte Services
- ✅ Unabhängige Skalierung
- ✅ Native Browser-Support

**Nachteile:**
- ❌ Komplexe Orchestrierung
- ❌ Network Latency
- ❌ Service Discovery

**Integration:**
```html
<!-- In beliebiger HTML-Seite -->
<script src="https://admin.memoro.tools/components.js"></script>
<memoro-admin-dashboard 
  api-key="xxx"
  theme="dark">
</memoro-admin-dashboard>
```

### Konzept 4: Plugin-System (Empfohlen) ⭐
**Architektur:**
```
@memoro/admin-core
├── core/
│   ├── plugin-system.ts    # Plugin Registry
│   ├── api-client.ts       # API Abstraction
│   └── auth.ts            # Auth Management
├── plugins/
│   ├── personas/           # Personas Plugin
│   ├── image-generator/    # Replicate Plugin
│   ├── content-manager/    # Content Plugin
│   └── analytics/          # Analytics Plugin
└── adapters/
    ├── astro/             # Astro Integration
    ├── nextjs/            # Next.js Integration
    └── vue/               # Vue Integration
```

**Plugin-Beispiel:**
```typescript
// personas-plugin.ts
export const personasPlugin: AdminPlugin = {
  id: 'personas',
  name: 'Personas Management',
  version: '1.0.0',
  routes: [
    { path: '/personas', component: PersonasList },
    { path: '/personas/:id', component: PersonaDetail }
  ],
  api: {
    endpoints: [
      { method: 'GET', path: '/personas', handler: getPersonas },
      { method: 'POST', path: '/personas/:id/image', handler: generateImage }
    ]
  },
  permissions: ['personas.read', 'personas.write', 'personas.generate'],
  config: {
    replicateModel: 'stability-ai/sdxl',
    imageStyles: ['portrait', 'professional', 'casual']
  }
};
```

**Vorteile:**
- ✅ Maximale Flexibilität
- ✅ Einfache Erweiterung
- ✅ Selective Features
- ✅ Community Plugins möglich

**Nachteile:**
- ❌ Initial-Komplexität
- ❌ Plugin-Kompatibilität
- ❌ Versioning-Challenges

## 🖼️ Replicate Integration

### Backend Service Architektur
```typescript
// services/image-generator/src/replicate-service.ts
import Replicate from 'replicate';
import { Queue } from 'bullmq';
import { S3 } from '@aws-sdk/client-s3';

export class ReplicateImageService {
  private replicate: Replicate;
  private queue: Queue;
  private storage: S3;

  async generatePersonaImage(persona: Persona): Promise<string> {
    // 1. Prompt generieren basierend auf Persona-Daten
    const prompt = this.buildPrompt(persona);
    
    // 2. Job in Queue einreihen
    const job = await this.queue.add('generate-image', {
      personaId: persona.id,
      prompt,
      model: 'stable-diffusion-xl',
      parameters: {
        width: 1024,
        height: 1024,
        num_outputs: 4,
        guidance_scale: 7.5
      }
    });

    // 3. Auf Completion warten
    const result = await job.waitUntilFinished();
    
    // 4. Bilder in S3/Hetzner speichern
    const imageUrls = await this.storeImages(result.images);
    
    return imageUrls;
  }

  private buildPrompt(persona: Persona): string {
    const { appearance, outfits, demographics } = persona;
    
    return `
      Professional portrait photo of a ${demographics.age} year old ${demographics.gender},
      ${appearance.description},
      ${appearance.hairColor} hair in ${appearance.hairStyle},
      ${appearance.eyeColor} eyes,
      wearing ${outfits[0]?.items.top || 'business attire'},
      ${appearance.firstImpression},
      studio lighting, high quality, detailed, realistic
    `;
  }
}
```

### Admin UI Integration
```typescript
// components/PersonaImageGenerator.tsx
export function PersonaImageGenerator({ persona }: Props) {
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>();
  const [prompt, setPrompt] = useState('');

  const generateImages = async () => {
    setGenerating(true);
    
    const response = await fetch(`/api/personas/${persona.id}/generate-images`, {
      method: 'POST',
      body: JSON.stringify({ 
        prompt: prompt || buildDefaultPrompt(persona),
        style: selectedStyle,
        count: 4
      })
    });

    const data = await response.json();
    setImages(data.images);
    setGenerating(false);
  };

  return (
    <div className="image-generator">
      <h3>KI Bildgenerierung</h3>
      
      {/* Prompt Editor */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Beschreibe das gewünschte Bild..."
        className="w-full h-32"
      />

      {/* Style Selector */}
      <StyleSelector 
        options={['portrait', 'professional', 'casual', 'lifestyle']}
        selected={selectedStyle}
        onChange={setSelectedStyle}
      />

      {/* Generate Button */}
      <button 
        onClick={generateImages}
        disabled={generating}
        className="btn-primary"
      >
        {generating ? 'Generiere...' : 'Bilder generieren'}
      </button>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {images.map((img, i) => (
            <ImageOption 
              key={i}
              src={img}
              selected={selectedImage === img}
              onSelect={() => setSelectedImage(img)}
            />
          ))}
        </div>
      )}

      {/* Save Button */}
      {selectedImage && (
        <button 
          onClick={() => savePersonaImage(persona.id, selectedImage)}
          className="btn-success mt-4"
        >
          Als Persona-Bild speichern
        </button>
      )}
    </div>
  );
}
```

## 🚀 Backend Deployment (Hetzner + Coolify)

### Docker Compose Konfiguration
```yaml
# docker-compose.yml für Coolify
version: '3.8'

services:
  # API Gateway
  gateway:
    image: traefik:v2.9
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./traefik.yml:/traefik.yml
    labels:
      - "traefik.enable=true"

  # Admin API
  admin-api:
    build: ./services/admin-api
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REPLICATE_API_KEY: ${REPLICATE_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
    labels:
      - "traefik.http.routers.api.rule=Host(`api.memoro-admin.com`)"
      - "traefik.http.services.api.loadbalancer.server.port=3000"

  # Image Generator Service
  image-generator:
    build: ./services/image-generator
    environment:
      REPLICATE_API_KEY: ${REPLICATE_API_KEY}
      S3_BUCKET: ${S3_BUCKET}
      REDIS_URL: redis://redis:6379
    depends_on:
      - redis

  # Queue Worker
  queue-worker:
    build: ./services/queue-worker
    environment:
      REDIS_URL: redis://redis:6379
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      - redis
      - postgres

  # Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: memoro_admin
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data

  # Cache & Queue
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

  # Object Storage (MinIO als S3-Alternative)
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    volumes:
      - minio-data:/data
    ports:
      - "9001:9001"

volumes:
  postgres-data:
  redis-data:
  minio-data:
```

### Coolify Deployment Steps
```bash
# 1. Repository in Coolify verbinden
# 2. Environment Variables setzen
# 3. Docker Compose auswählen
# 4. Custom Domain konfigurieren
# 5. SSL aktivieren (Let's Encrypt)
# 6. Health Checks einrichten
```

## 💰 Kostenanalyse

### Replicate Kosten
- **SDXL Model:** ~$0.0023 pro Bild
- **4 Varianten pro Persona:** ~$0.01
- **100 Personas:** ~$1.00
- **Monatliche Regeneration:** ~$12/Jahr

### Hetzner VPS
- **CPX31:** 16GB RAM, 4 vCPUs = 22€/Monat
- **Storage:** 160GB SSD inklusive
- **Traffic:** 20TB inklusive

### Gesamtkosten
- **Initial:** ~25€ Setup
- **Monatlich:** ~25€ (Hetzner + Replicate bei moderater Nutzung)
- **Jährlich:** ~300€

## 🔧 Implementierungsplan

### Phase 1: Proof of Concept (1 Woche)
1. ✅ Einfache API mit Express.js
2. ✅ Replicate Integration testen
3. ✅ Basis UI in Admin-Tool
4. ✅ Lokales Docker Setup

### Phase 2: MVP (2-3 Wochen)
1. ⏳ Plugin-System Grundstruktur
2. ⏳ Personas Plugin mit Bildgenerierung
3. ⏳ Deployment auf Hetzner
4. ⏳ Basis-Authentifizierung

### Phase 3: Production Ready (4-6 Wochen)
1. 📋 Vollständiges Plugin-System
2. 📋 NPM Package Publishing
3. 📋 Dokumentation & Examples
4. 📋 CI/CD Pipeline
5. 📋 Monitoring & Logging

### Phase 4: Erweiterungen
1. 🎯 Weitere Plugins (Analytics, SEO, etc.)
2. 🎯 Community Plugins Support
3. 🎯 SaaS-Version
4. 🎯 Multi-Tenancy

## 🎯 Empfehlung

**Empfohlene Architektur:** Plugin-System (Konzept 4) + Microservices Backend

**Begründung:**
1. **Flexibilität:** Plugins erlauben selektive Feature-Nutzung
2. **Skalierbarkeit:** Microservices können unabhängig skaliert werden
3. **Wiederverwendbarkeit:** Core + Plugins in beliebigen Projekten nutzbar
4. **Zukunftssicher:** Community kann eigene Plugins entwickeln
5. **Kosteneffizient:** Nur genutzte Services werden deployed

**Nächste Schritte:**
1. API-Service mit Replicate-Integration entwickeln
2. Basis Plugin-System implementieren
3. Personas-Plugin mit Bildgenerierung erstellen
4. Deployment auf Hetzner/Coolify
5. Documentation und Examples

## 📚 Technologie-Stack

### Frontend
- **Core:** TypeScript, Web Components
- **Adapters:** Astro, React, Vue
- **UI:** Tailwind CSS, Shadcn/ui
- **State:** Zustand oder Nanostores

### Backend
- **API:** Node.js mit Fastify
- **Queue:** BullMQ + Redis
- **Database:** PostgreSQL + Prisma
- **Storage:** MinIO (S3-compatible)
- **Auth:** JWT + Refresh Tokens

### Infrastructure
- **Hosting:** Hetzner VPS
- **Orchestration:** Coolify
- **Containers:** Docker + Compose
- **Monitoring:** Prometheus + Grafana
- **Logging:** Loki + Promtail

## 🔐 Security Considerations

1. **API Security:**
   - Rate Limiting
   - API Key Management
   - CORS Configuration
   - Request Validation

2. **Image Generation:**
   - Content Filtering
   - Usage Limits
   - Watermarking Option
   - GDPR Compliance

3. **Data Protection:**
   - Encryption at Rest
   - Secure Transmission
   - Regular Backups
   - Access Logging

## 📊 Success Metrics

- **Adoption:** Anzahl installierter Instanzen
- **Usage:** Generierte Bilder pro Monat
- **Performance:** API Response Time < 200ms
- **Reliability:** 99.9% Uptime
- **Cost:** < 30€/Monat bei 1000 Personas

## 🤝 Community & Support

- **Documentation:** docs.memoro-admin.tools
- **Discord:** Community Support
- **GitHub:** Issue Tracking
- **Newsletter:** Updates & Best Practices
- **Marketplace:** Plugin Directory

---

*Dieses Dokument wird kontinuierlich aktualisiert. Letzte Änderung: 28.01.2025*