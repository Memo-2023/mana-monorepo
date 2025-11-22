# SEO Tracking Setup Guide

## 1. Google Cloud Setup

### Schritt 1: API aktivieren
1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Neues Projekt erstellen: "Memoro SEO Tracker"
3. APIs & Services → Bibliothek
4. Suche "Google Search Console API"
5. Aktivieren

### Schritt 2: Service Account erstellen
1. APIs & Services → Anmeldedaten
2. "+ Anmeldedaten erstellen" → Service-Konto
3. Name: "memoro-seo-tracker"
4. Rolle: "Viewer"
5. JSON-Schlüssel erstellen und herunterladen
6. Speichere als `credentials.json` im scripts Ordner

### Schritt 3: Search Console Zugriff
1. Gehe zu [Google Search Console](https://search.google.com/search-console)
2. Einstellungen → Nutzer und Berechtigungen
3. Nutzer hinzufügen: [service-account-email]@[project-id].iam.gserviceaccount.com
4. Berechtigung: "Eingeschränkt"

## 2. Dependencies installieren

```bash
cd scripts
npm init -y
npm install googleapis node-cron dotenv
```

## 3. Cron Job einrichten

### Option A: Node.js Cron (Entwicklung)

Erstelle `scripts/cron-runner.js`:

```javascript
const cron = require('node-cron');
const SEOTracker = require('./seo-tracker');

const tracker = new SEOTracker();

// Täglich um 6 Uhr morgens
cron.schedule('0 6 * * *', async () => {
  console.log('Running daily SEO data collection...');
  await tracker.initialize();
  await tracker.collectDailyData();
});

// Wöchentlich Montags um 9 Uhr
cron.schedule('0 9 * * 1', async () => {
  console.log('Generating weekly report...');
  await tracker.initialize();
  await tracker.generateWeeklyReport();
});

console.log('SEO Tracker Cron Jobs started');
```

Starten mit: `node cron-runner.js`

### Option B: GitHub Actions (Production)

Erstelle `.github/workflows/seo-tracker.yml`:

```yaml
name: SEO Data Collection

on:
  schedule:
    # Täglich um 6:00 UTC
    - cron: '0 6 * * *'
  workflow_dispatch: # Manueller Trigger

jobs:
  collect-seo-data:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd scripts
        npm ci
    
    - name: Run SEO Tracker
      env:
        GOOGLE_CREDENTIALS: ${{ secrets.GOOGLE_CREDENTIALS }}
      run: |
        cd scripts
        echo "$GOOGLE_CREDENTIALS" > credentials.json
        node seo-tracker.js daily
    
    - name: Upload data artifacts
      uses: actions/upload-artifact@v3
      with:
        name: seo-data
        path: scripts/data/seo/
    
    - name: Commit data (optional)
      run: |
        git config user.name "GitHub Actions"
        git config user.email "actions@github.com"
        git add scripts/data/seo/
        git commit -m "Update SEO data $(date +'%Y-%m-%d')" || exit 0
        git push
```

### Option C: Vercel Cron (wenn du Vercel nutzt)

In `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/seo-collect",
      "schedule": "0 6 * * *"
    }
  ]
}
```

## 4. Dashboard Integration

### Statische Seite (Astro)

Erstelle `/src/pages/de/seo-dashboard.astro`:

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import SEODashboard from "../../components/SEODashboard.astro";

// Lade die neuesten Daten
import fs from 'fs';
import path from 'path';

let seoData = null;
try {
  const dataPath = path.join(process.cwd(), 'scripts/data/seo/aggregated-seo-data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  seoData = JSON.parse(rawData);
} catch (error) {
  console.error('Could not load SEO data:', error);
}
---

<BaseLayout title="SEO Dashboard">
  <div class="container mx-auto px-4 py-8">
    <SEODashboard data={seoData} />
  </div>
</BaseLayout>
```

### Live Dashboard (mit API)

Erstelle `/api/seo-data.js`:

```javascript
// API Endpoint für Live-Daten
import { google } from 'googleapis';

export async function GET(request) {
  const url = new URL(request.url);
  const range = url.searchParams.get('range') || '7d';
  
  // Initialisiere Google Auth
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchConsole = google.searchconsole({
    version: 'v1',
    auth: await auth.getClient(),
  });

  // Hole Daten
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const response = await searchConsole.searchanalytics.query({
    siteUrl: 'https://memoro.ai/',
    requestBody: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['query', 'page'],
      rowLimit: 100
    }
  });

  return new Response(JSON.stringify(response.data), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## 5. Monitoring & Alerts

### Email-Benachrichtigungen

Erweitere `seo-tracker.js`:

```javascript
async sendAlert(subject, message) {
  // Mit Sendgrid, Postmark oder ähnlichem
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  await sgMail.send({
    to: 'team@memoro.ai',
    from: 'seo-alerts@memoro.ai',
    subject: subject,
    text: message,
  });
}

// In collectDailyData():
if (dashboardData.summary.avgPosition < 10) {
  await this.sendAlert(
    '🎉 SEO Meilenstein erreicht!',
    `Durchschnittliche Position unter 10: ${dashboardData.summary.avgPosition}`
  );
}
```

### Slack Integration

```javascript
async notifySlack(message) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message })
  });
}
```

## 6. Testen

```bash
# Test API Verbindung
node scripts/seo-tracker.js test

# Sammle Daten manuell
node scripts/seo-tracker.js daily

# Generiere Report
node scripts/seo-tracker.js weekly
```

## Nächste Schritte

1. ✅ Google Cloud Projekt erstellen
2. ✅ Service Account anlegen
3. ✅ Search Console Zugriff geben
4. ✅ Dependencies installieren
5. ✅ Ersten Test durchführen
6. ✅ Cron Job aktivieren
7. ✅ Dashboard deployen

## Wichtige Metriken zum Tracken

- **Primäre KPIs:**
  - Ranking für "meeting protokoll software"
  - CTR der Landing Pages
  - Neue rankende Keywords

- **Sekundäre KPIs:**
  - Seitengeschwindigkeit (Core Web Vitals)
  - Crawl-Fehler
  - Mobile Usability

## Troubleshooting

**Error: "User does not have sufficient permission"**
→ Service Account Email in Search Console hinzufügen

**Error: "API not enabled"**
→ Google Search Console API im Cloud Console aktivieren

**Keine Daten verfügbar**
→ Search Console braucht 2-3 Tage für neue Properties