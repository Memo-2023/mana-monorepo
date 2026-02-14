export default () => ({
	port: parseInt(process.env.PORT || '3319', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		allowedRooms: (process.env.MATRIX_ALLOWED_ROOMS || '').split(',').filter(Boolean),
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	picture: {
		backendUrl: process.env.PICTURE_BACKEND_URL || 'http://localhost:3006',
		apiPrefix: process.env.PICTURE_API_PREFIX || '/api/v1',
	},
	auth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},
});

export const HELP_MESSAGE = `**Picture Bot - AI-Bildgenerierung**

**Bilder generieren:**
- \`!generate [prompt]\` - Bild generieren
- \`!bild [prompt]\` - Bild generieren (deutsch)
- \`!model [id]\` - Modell wechseln
- \`!models\` - Verfugbare Modelle anzeigen

**Optionen (im Prompt):**
- \`--width 1024\` - Breite setzen
- \`--height 768\` - Hohe setzen
- \`--steps 30\` - Mehr Schritte = mehr Detail
- \`--negative [text]\` - Negative Prompts

**Beispiele:**
\`!generate A beautiful sunset over mountains --width 1280 --height 720\`
\`!bild Ein niedlicher Hund im Park --steps 40\`

**Bilder verwalten:**
- \`!history\` - Letzte Bilder anzeigen
- \`!delete [nr]\` - Bild loschen

**Sonstiges:**
- \`!status\` - Bot-Status
- \`!credits\` - Credits anzeigen
- \`!help\` - Diese Hilfe`;

export const STYLES = [
	'photorealistic',
	'anime',
	'digital-art',
	'oil-painting',
	'watercolor',
	'sketch',
	'3d-render',
	'pixel-art',
] as const;

export type Style = (typeof STYLES)[number];

export const STYLE_LABELS: Record<Style, string> = {
	photorealistic: 'Fotorealistisch',
	anime: 'Anime',
	'digital-art': 'Digital Art',
	'oil-painting': 'Olmalerei',
	watercolor: 'Aquarell',
	sketch: 'Skizze',
	'3d-render': '3D Render',
	'pixel-art': 'Pixel Art',
};
