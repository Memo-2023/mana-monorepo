# Netlify Functions vs. Hetzner VPS - Vergleich für Replicate Integration

## 🎯 Übersicht

Vergleich zwischen **Netlify Functions** (Serverless) und **Hetzner VPS** (Self-Hosted) für die Replicate API Integration.

## 💰 Kostenvergleich

### Netlify Functions

**Free Tier:**

- 125.000 Requests/Monat
- 100 Stunden Compute-Zeit/Monat
- Perfekt für Development & kleine Projekte

**Pro Tier ($19/Monat):**

- 1 Million Requests/Monat
- 1000 Stunden Compute-Zeit

**Kosten für Replicate Bildgenerierung:**

- Replicate API: ~$0.01 pro 4 Bilder
- Netlify Functions: GRATIS im Free Tier
- **Gesamtkosten: Nur Replicate-Nutzung (~$1-10/Monat)**

### Hetzner VPS + Coolify

**CPX31 Server:**

- €22/Monat (16GB RAM, 4 vCPUs)
- Unbegrenzte Requests
- Kann mehrere Services hosten

**Zusatzkosten:**

- Domain/SSL: €0 (Let's Encrypt)
- Backup: €2/Monat
- **Gesamtkosten: €24/Monat + Replicate**

## 🚀 Implementierungsvergleich

### Option 1: Netlify Functions (EMPFOHLEN) ⭐

**Implementierung:**

```javascript
// netlify/functions/generate-persona-image.js
import Replicate from 'replicate';

export async function handler(event, context) {
	// CORS Headers
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
			},
		};
	}

	// Check API Key
	const apiKey = event.headers['x-api-key'];
	if (apiKey !== process.env.API_KEY) {
		return {
			statusCode: 401,
			body: JSON.stringify({ error: 'Unauthorized' }),
		};
	}

	// Parse request
	const { personaData, prompt, style = 'portrait', count = 4 } = JSON.parse(event.body);

	// Initialize Replicate
	const replicate = new Replicate({
		auth: process.env.REPLICATE_API_TOKEN,
	});

	try {
		// Generate images
		const output = await replicate.run(
			'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
			{
				input: {
					prompt: prompt || buildPromptFromPersona(personaData, style),
					negative_prompt: 'ugly, distorted, blurry, low quality',
					width: 1024,
					height: 1024,
					num_outputs: count,
					scheduler: 'K_EULER',
					num_inference_steps: 30,
					guidance_scale: 7.5,
				},
			}
		);

		return {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
			body: JSON.stringify({
				success: true,
				images: output,
			}),
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({
				success: false,
				error: error.message,
			}),
		};
	}
}

function buildPromptFromPersona(personaData, style) {
	// Prompt building logic
	const { appearance, demographics, professional } = personaData;
	// ... (same as before)
}
```

**Setup:**

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Create netlify.toml
cat > netlify.toml << EOF
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"
EOF

# 3. Add environment variables in Netlify UI
# REPLICATE_API_TOKEN = "..."
# API_KEY = "..."

# 4. Deploy
netlify deploy --prod
```

**Frontend Integration bleibt gleich:**

```javascript
// Nur API URL ändern
const API_URL = '/.netlify/functions';
// Statt: const API_URL = 'http://localhost:3001/api';
```

### Option 2: Vercel Functions (Alternative)

**Ähnlich wie Netlify:**

- Free Tier: 100GB-Hrs/Monat
- Pro: $20/Monat
- Edge Functions möglich
- Bessere TypeScript-Unterstützung

```typescript
// api/generate-persona-image.ts
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	// Similar implementation
}
```

### Option 3: Astro SSR mit API Routes (Neu in Astro 4.0)

**In deinem bestehenden Projekt:**

```typescript
// src/pages/api/generate-persona-image.ts
import type { APIRoute } from 'astro';
import Replicate from 'replicate';

export const POST: APIRoute = async ({ request }) => {
	const data = await request.json();
	// Implementation
	return new Response(JSON.stringify(result), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	});
};
```

## 📊 Entscheidungsmatrix

| Kriterium          | Netlify Functions     | Hetzner VPS    | Gewichtung |
| ------------------ | --------------------- | -------------- | ---------- |
| **Kosten**         | ⭐⭐⭐⭐⭐ (€0-19/Mo) | ⭐⭐ (€24/Mo)  | 30%        |
| **Einfachheit**    | ⭐⭐⭐⭐⭐            | ⭐⭐           | 25%        |
| **Skalierbarkeit** | ⭐⭐⭐⭐              | ⭐⭐⭐         | 15%        |
| **Kontrolle**      | ⭐⭐                  | ⭐⭐⭐⭐⭐     | 10%        |
| **Performance**    | ⭐⭐⭐⭐              | ⭐⭐⭐⭐       | 10%        |
| **Wartung**        | ⭐⭐⭐⭐⭐ (keine)    | ⭐⭐ (manuell) | 10%        |

**Gewinner: Netlify Functions** 🏆

## 🎯 Empfehlung

### Für dein Memoro-Projekt: **Netlify Functions**

**Warum:**

1. **Kostenlos** für Development und kleine Nutzung
2. **Zero DevOps** - kein Server-Management
3. **Automatisches Scaling** - zahle nur was du nutzt
4. **5 Minuten Setup** vs. Stunden für VPS
5. **Integriert** mit deinem bestehenden Netlify Hosting

### Migrations-Pfad:

```bash
# Phase 1: Development (JETZT)
Netlify Functions Free Tier
- Test mit echten Usern
- Kosten: €0 + Replicate

# Phase 2: Growth (100+ Personas/Monat)
Netlify Functions Pro
- Kosten: €19/Monat + Replicate

# Phase 3: Scale (1000+ Personas/Monat)
Evaluiere Hetzner VPS für mehrere Services
- Kosten: €24/Monat + Replicate
```

## 🚀 Quick Start mit Netlify Functions

### 1. Erstelle Function-Datei:

```bash
mkdir -p netlify/functions
touch netlify/functions/generate-persona-image.js
```

### 2. Kopiere Code von oben

### 3. Environment Variables in Netlify:

```
Site Settings > Environment Variables:
- REPLICATE_API_TOKEN
- API_KEY
```

### 4. Deploy:

```bash
git add .
git commit -m "Add Netlify Function for image generation"
git push
```

### 5. Fertig! 🎉

## 💡 Pro-Tipps

### Bildoptimierung mit Netlify:

```javascript
// Nutze Netlify Image CDN für generierte Bilder
const optimizedUrl = `/.netlify/images?url=${imageUrl}&w=1024&q=80`;
```

### Caching Strategy:

```javascript
// Cache Replicate responses in Netlify Blobs (Free)
import { getStore } from '@netlify/blobs';

const store = getStore('persona-images');
await store.set(personaId, imageUrls);
```

### Rate Limiting:

```javascript
// Nutze Netlify Edge Functions für Rate Limiting
export const config = {
	path: '/api/generate-image',
	rateLimit: {
		windowMs: 60000, // 1 minute
		max: 5, // 5 requests per minute
	},
};
```

## 📈 Kosten-Beispielrechnung

### Szenario: 50 Personas pro Monat

| Service         | Netlify Functions | Hetzner VPS |
| --------------- | ----------------- | ----------- |
| Hosting         | €0 (Free Tier)    | €24         |
| Replicate       | €0.50             | €0.50       |
| Zeit-Investment | 5 Minuten         | 2-4 Stunden |
| **Total**       | **€0.50**         | **€24.50**  |

### Szenario: 500 Personas pro Monat

| Service   | Netlify Functions | Hetzner VPS |
| --------- | ----------------- | ----------- |
| Hosting   | €19 (Pro)         | €24         |
| Replicate | €5                | €5          |
| **Total** | **€24**           | **€29**     |

## 🏁 Fazit

**Netlify Functions ist die beste Wahl für dein Projekt:**

✅ **Sofort einsatzbereit** - keine Server-Konfiguration
✅ **Kosteneffizient** - zahle nur was du nutzt  
✅ **Automatisches Scaling** - keine Sorgen bei Traffic-Spitzen
✅ **Integriert** - funktioniert nahtlos mit Astro
✅ **Zukunftssicher** - einfache Migration wenn nötig

**Hetzner VPS nur wenn:**

- Du mehrere Backend-Services brauchst
- Du volle Kontrolle willst
- Du bereits DevOps-Erfahrung hast
- Du >1000 Requests/Tag erwartest

---

_Empfehlung: Starte mit Netlify Functions Free Tier und skaliere bei Bedarf._
