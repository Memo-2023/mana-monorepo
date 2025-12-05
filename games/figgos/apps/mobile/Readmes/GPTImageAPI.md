# OpenAI GPT Image v1 API Dokumentation

Diese Dokumentation konzentriert sich auf die neue OpenAI GPT Image v1 API (gpt-image-1), die transparente Hintergründe und andere fortschrittliche Funktionen unterstützt.

# OpenAI GPT Image v1 API Dokumentation

Diese Dokumentation konzentriert sich auf die neue OpenAI GPT Image v1 API (gpt-image-1), die transparente Hintergründe und andere fortschrittliche Funktionen unterstützt.

## Der Parameter `background`

Der Parameter `background` in der OpenAI Image v1 API (gpt-image-1) steuert den Hintergrundtyp des generierten Bildes. Mit diesem Parameter kannst du gezielt festlegen, ob das Bild einen transparenten, undurchsichtigen (opaken) oder automatisch gewählten Hintergrund haben soll.

### Mögliche Werte für background:

- **"transparent"**: Das Bild wird mit transparentem Hintergrund erzeugt. Dies funktioniert nur, wenn das Ausgabeformat (`output_format`) auf "png" oder "webp" gesetzt ist, da nur diese Formate Transparenz unterstützen.

- **"opaque"**: Das Bild erhält einen vollständig undurchsichtigen Hintergrund.

- **"auto"**: Die API entscheidet automatisch, welcher Hintergrundtyp verwendet wird (Standardwert).

### Wichtige Hinweise:

- Für Transparenz muss das Ausgabeformat png oder webp sein. JPEG unterstützt keine Transparenz.

- Transparenz funktioniert am besten mit mittlerer oder hoher Qualitätsstufe (quality: "medium" oder "high").

- Es reicht nicht, nur im Prompt nach „transparent background" zu fragen – der Parameter `background` sollte explizit gesetzt werden.

### Beispiel für einen API-Request mit transparentem Hintergrund:

````python
result = client.images.generate(
    model="gpt-image-1",
    prompt="Vector art icon of a stylized rocket ship, transparent background",
    size="1024x1024",
    quality="high",
    output_format="webp",
    background="transparent",
    n=1
)
Damit erhältst du ein Bild mit echtem transparentem Hintergrund, das sich z.B. für Icons oder Overlays eignet.

OpenAI GPT Image v1 API – Übersicht
1. Bilder generieren
Endpunkt: POST /v1/images/generations

Wichtige Parameter:

model: "gpt-image-1"
prompt: Beschreibung des gewünschten Bildes (Pflichtfeld)
n: Anzahl der Bilder (optional, Standard: 1)
size: Bildgröße, z.B. "1024x1024" (optional)
quality: "standard" oder "high" (optional)
style: "vivid" oder "natural" (optional)
background: "transparent", "opaque", "auto" (optional)
output_format: "png", "webp", "jpeg" (optional, für Transparenz: png/webp)
Beispiel:

json
CopyInsert
{
  "model": "gpt-image-1",
  "prompt": "A vector icon of a rocket, transparent background",
  "n": 1,
  "size": "1024x1024",
  "quality": "high",
  "output_format": "webp",
  "background": "transparent"
}
2. Bilder bearbeiten
Endpunkt: POST /v1/images/edits

Wichtige Parameter:

model: "gpt-image-1"
image: Hochzuladende Bilddatei (Pflichtfeld)
prompt: Beschreibung der Änderung (Pflichtfeld)
mask: Optionales Maskenbild (optional)
Weitere Parameter wie bei Bildgenerierung
3. Bildvariationen erstellen
Endpunkt: POST /v1/images/variations

Wichtige Parameter:

image: Hochzuladende Bilddatei (Pflichtfeld)
Weitere Parameter wie bei Bildgenerierung
Parameter background im Detail
| Wert | Bedeutung | Hinweis | |------|-----------|--------| | "transparent" | Bild mit transparentem Hintergrund (nur mit PNG/WebP) | Für Icons, Overlays etc. geeignet | | "opaque" | Bild mit undurchsichtigem Hintergrund | Standard für Fotos | | "auto" | Automatische Auswahl durch die API | Standardwert |

Achtung:

Für Transparenz muss output_format auf "png" oder "webp" stehen!
Transparenz funktioniert am besten mit quality: "high".
GPT Image v1 - Funktionen und Fähigkeiten
Überblick
Die GPT Image v1 API (gpt-image-1) ist ein nativ multimodales großes Sprachmodell. Es kann sowohl Text als auch Bilder verstehen und sein umfassendes Weltwissen nutzen, um Bilder mit besserer Befolgung von Anweisungen und kontextuellem Bewusstsein zu generieren.

Bildgenerierung mit Weltwissen
Als nativ multimodales Sprachmodell kann GPT Image sein visuelles Verständnis der Welt nutzen, um lebensechte Bilder einschließlich realer Details ohne Referenz zu generieren.

Beispiel: Wenn du GPT Image aufforderst, ein Bild einer Glasvitrine mit den beliebtesten Halbedelsteinen zu generieren, weiß das Modell genug, um Edelsteine wie Amethyst, Rosenquarz, Jade usw. auszuwählen und sie auf realistische Weise darzustellen.

Beispiele für die Verwendung der GPT Image v1 API
Bild mit transparentem Hintergrund generieren
bash
CopyInsert
curl https://api.openai.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-image-1",
    "prompt": "Vector art icon of a stylized fox, transparent background",
    "n": 1,
    "size": "1024x1024",
    "quality": "high",
    "background": "transparent",
    "output_format": "webp"
  }'
Bild mit JavaScript generieren
javascript
CopyInsert
async function generateImage() {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: "Vector art icon of a stylized fox, transparent background",
      n: 1,
      size: "1024x1024",
      quality: "high",
      background: "transparent",
      output_format: "webp"
    })
  });

  const result = await response.json();
  return result;
}
Authentifizierung
Immer den Header setzen: Authorization: Bearer <DEIN_API_KEY>

## Response-Format und Base64-Encoding

### Wichtige Hinweise zum Response-Format:

- Die GPT Image v1 API kann entweder eine URL oder einen Base64-String zurückgeben.
- Der Parameter `response_format` wird **nicht** unterstützt, im Gegensatz zu DALL-E 3.
- Die API kann zwei verschiedene Antwortformate zurückgeben:

  1. **URL-Format**:
  ```json
  {
    "created": 1683245297,
    "data": [
      {
        "url": "https://..."
      }
    ]
  }
````

2. **Base64-Format**:

```json
{
	"created": 1683245297,
	"data": [
		{
			"b64_json": "iVBORw0KGgoAAAANSUhEUgAA..."
		}
	]
}
```

- Deine Implementierung sollte beide Formate unterstützen, da die API je nach Anfrage und Konfiguration unterschiedliche Formate zurückgeben kann.

### Beispiel für die Verarbeitung beider Antwortformate:

```javascript
const response = await fetch('https://api.openai.com/v1/images/generations', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${OPENAI_API_KEY}`,
	},
	body: JSON.stringify({
		model: 'gpt-image-1',
		prompt: 'Vector art icon of a stylized fox, transparent background',
		n: 1,
		size: '1024x1024',
		quality: 'high',
		background: 'transparent',
		output_format: 'png',
	}),
});

const result = await response.json();

// Prüfe, ob die Antwort eine URL oder Base64-Daten enthält
const imageUrl = result.data?.[0]?.url;
const imageBase64 = result.data?.[0]?.b64_json;

let imageBlob;

if (imageUrl) {
	// Fall 1: URL wurde zurückgegeben
	const imageResponse = await fetch(imageUrl);
	imageBlob = await imageResponse.blob();
} else if (imageBase64) {
	// Fall 2: Base64-Daten wurden zurückgegeben
	const binaryString = atob(imageBase64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	imageBlob = new Blob([bytes], { type: 'image/png' });
} else {
	throw new Error('Keine Bilddaten in der Antwort gefunden');
}

// Jetzt kann das Bild verwendet werden
// z.B. zum Anzeigen in einem <img>-Element oder zum Speichern
```

## Zusammenfassung

Mit der OpenAI GPT Image v1 API kannst du:

- Bilder mit hoher Qualität generieren
- Mit dem Parameter background gezielt den Hintergrundtyp steuern
- Transparente Hintergründe für Icons und Grafiken erstellen
- Bilder über die zurückgegebene URL herunterladen und weiterverarbeiten

Tipp für transparente Icons, Logos oder Sticker: Verwende background: "transparent" und output_format: "png" oder "webp"
