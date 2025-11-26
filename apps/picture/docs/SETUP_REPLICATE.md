# Replicate API Setup

## Schritt 1: Replicate Account erstellen

1. Gehe zu [replicate.com](https://replicate.com)
2. Klicke auf "Sign up" und erstelle einen Account
3. Nach der Registrierung gehe zu [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)

## Schritt 2: API Token erstellen

1. Klicke auf "Create token"
2. Gib dem Token einen Namen (z.B. "picture-app")
3. Kopiere den generierten Token (beginnt mit `r8_...`)

## Schritt 3: Token in Supabase Secrets speichern

### Option A: Über Supabase Dashboard (Empfohlen)

1. Öffne dein Supabase Dashboard
2. Gehe zu "Edge Functions" → "Secrets"
3. Klicke auf "Create new secret"
4. Name: `REPLICATE_API_KEY`
5. Value: Dein Replicate API Token
6. Klicke auf "Create"

### Option B: Über Supabase CLI

```bash
# Installiere Supabase CLI falls noch nicht vorhanden
npm install -g supabase

# Login
supabase login

# Setze das Secret
supabase secrets set REPLICATE_API_KEY=dein_replicate_token --project-ref mjuvnnjxwfwlmxjsgkqu
```

## Schritt 4: Testen

1. Melde dich in der App an
2. Gehe zum "Generieren" Tab
3. Gib einen Prompt ein, z.B.:
   - "A majestic mountain landscape at sunset, highly detailed, digital art"
   - "Portrait of a cyberpunk cat wearing sunglasses, neon lights, futuristic"
   - "Japanese garden with cherry blossoms, peaceful, watercolor style"

4. Klicke auf "Bild generieren"
5. Die Generierung dauert etwa 15-30 Sekunden
6. Nach erfolgreicher Generierung wirst du zur Galerie weitergeleitet

## Kosten

- Replicate nutzt ein Pay-per-Use Modell
- SDXL Generierung kostet etwa $0.01-0.02 pro Bild
- Neue Accounts erhalten oft ein kostenloses Startguthaben
- Überprüfe deine Nutzung unter [replicate.com/account/billing](https://replicate.com/account/billing)

## Fehlerbehebung

### "Replicate API key not configured"
- Stelle sicher, dass der API Key korrekt in Supabase Secrets gespeichert ist
- Der Key muss genau `REPLICATE_API_KEY` heißen

### "Unauthorized" oder "Invalid token"
- Überprüfe, ob der Token korrekt kopiert wurde
- Stelle sicher, dass der Token noch gültig ist (nicht gelöscht wurde)

### Bilder werden nicht angezeigt
- Überprüfe, ob der Storage Bucket `generated-images` öffentlich ist
- Gehe zu Supabase Dashboard → Storage → generated-images → Policies
- Der Bucket sollte auf "Public" gesetzt sein

## Weitere Modelle

Die Edge Function verwendet aktuell SDXL 1.0. Du kannst andere Modelle verwenden, indem du die `version` in der Edge Function änderst:

- **SDXL 1.0** (aktuell): `db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf`
- **Stable Diffusion 2.1**: `db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf`
- **SDXL Lightning** (schneller): `727e49a643e999d602a896c774a0658ffefea21465756a6ce24b7ea4165eba6a`

Weitere Modelle findest du auf [replicate.com/explore](https://replicate.com/explore)