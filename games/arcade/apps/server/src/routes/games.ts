import { Hono } from 'hono';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { AzureOpenAI } from 'openai';

type AIProvider = 'google' | 'anthropic' | 'azure';

interface ModelConfig {
	provider: AIProvider;
	modelId: string;
	displayName: string;
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
	'gemini-2.0-flash': {
		provider: 'google',
		modelId: 'gemini-2.0-flash',
		displayName: 'Gemini 2.0 Flash',
	},
	'gemini-2.5-flash': {
		provider: 'google',
		modelId: 'gemini-2.5-flash-preview-05-20',
		displayName: 'Gemini 2.5 Flash',
	},
	'gemini-2.5-pro': {
		provider: 'google',
		modelId: 'gemini-2.5-pro-preview-05-06',
		displayName: 'Gemini 2.5 Pro',
	},
	'claude-3.5-haiku': {
		provider: 'anthropic',
		modelId: 'claude-3-5-haiku-20241022',
		displayName: 'Claude 3.5 Haiku',
	},
	'claude-3.5-sonnet': {
		provider: 'anthropic',
		modelId: 'claude-sonnet-4-20250514',
		displayName: 'Claude Sonnet 4',
	},
	'gpt-4o': { provider: 'azure', modelId: 'gpt-4o', displayName: 'GPT-4o' },
	'gpt-4o-mini': { provider: 'azure', modelId: 'gpt-4o-mini', displayName: 'GPT-4o Mini' },
};

function initClients() {
	const googleKey = process.env.GOOGLE_GENAI_API_KEY;
	const anthropicKey = process.env.ANTHROPIC_API_KEY;
	const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
	const azureKey = process.env.AZURE_OPENAI_API_KEY;

	return {
		google:
			googleKey && !googleKey.includes('your_') ? new GoogleGenAI({ apiKey: googleKey }) : null,
		anthropic:
			anthropicKey && !anthropicKey.includes('your_')
				? new Anthropic({ apiKey: anthropicKey })
				: null,
		azure:
			azureEndpoint && azureKey && !azureKey.includes('your_')
				? new AzureOpenAI({
						endpoint: azureEndpoint,
						apiKey: azureKey,
						apiVersion: '2024-08-01-preview',
					})
				: null,
	};
}

const clients = initClients();

function createGamePrompt(
	description: string,
	mode: 'create' | 'iterate',
	originalPrompt?: string,
	currentCode?: string
): string {
	if (mode === 'iterate' && originalPrompt && currentCode) {
		return `Du bist ein begabter Coder und Gamedesigner.

Der Nutzer hat ursprünglich folgendes Spiel gewünscht: "${originalPrompt}"

Jetzt möchte der Nutzer folgende Änderung: "${description}"

ERSTELLE DAS SPIEL KOMPLETT NEU mit den gewünschten Änderungen. Orientiere dich am ursprünglichen Konzept, aber implementiere die Änderungen vollständig.

WICHTIGE REGELN:
- Erstelle ein VOLLSTÄNDIGES neues HTML-Dokument
- Maximal 400 Zeilen Code insgesamt
- Nutze Canvas für die Grafik
- Das Spiel muss sofort spielbar sein
- Implementiere die gewünschten Änderungen vollständig
- PostMessage Integration: window.parent.postMessage({type: 'GAME_LOADED', gameId: 'generated'}, '*');

STRUKTUR:
<!DOCTYPE html>
<html>
<head>
    <title>Spielname</title>
    <style>
        body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }
        canvas { border: 1px solid #333; }
    </style>
</head>
<body>
    <canvas id="game" width="800" height="600"></canvas>
    <script>
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');

        // Spielcode hier mit den gewünschten Änderungen
        window.parent.postMessage({type: 'GAME_LOADED', gameId: 'generated'}, '*');
    </script>
</body>
</html>

Schreibe nur den Code, keine weiteren Kommentare. Nutze keine externen Bibliotheken, Bilder oder Sounds.`;
	}

	return `Du bist ein begabter Coder und Gamedesigner. Erstelle ein HTML5-Spiel basierend auf dieser Beschreibung: ${description}

WICHTIGE REGELN:
- Maximal 400 Zeilen Code insgesamt
- Nutze Canvas für die Grafik
- Verwende einfache Formen (Rechtecke, Kreise, etc.)
- Das Spiel muss sofort spielbar sein
- Füge Steuerungshinweise im Spiel ein
- PostMessage Integration: window.parent.postMessage({type: 'GAME_LOADED', gameId: 'generated'}, '*');

STRUKTUR:
<!DOCTYPE html>
<html>
<head>
    <title>Spielname</title>
    <style>
        body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }
        canvas { border: 1px solid #333; }
    </style>
</head>
<body>
    <canvas id="game" width="800" height="600"></canvas>
    <script>
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');

        // Spielcode hier
        // PostMessage beim Start senden:
        window.parent.postMessage({type: 'GAME_LOADED', gameId: 'generated'}, '*');
    </script>
</body>
</html>

Schreibe nur den Code, keine weiteren Kommentare. Nutze keine externen Bibliotheken, Bilder oder Sounds.`;
}

function validateAndSanitizeGame(html: string): string {
	if (!html || typeof html !== 'string') {
		throw new Error('Invalid HTML content');
	}
	if (!html.includes('<!DOCTYPE html>')) {
		throw new Error('Invalid game HTML structure');
	}
	return html
		.replace(/<script[^>]*src=[^>]*>/gi, '')
		.replace(/<link[^>]*href=[^>]*>/gi, '')
		.replace(/fetch\s*\(/gi, '// fetch disabled: fetch(')
		.replace(/XMLHttpRequest/gi, '// XMLHttpRequest disabled')
		.replace(/eval\s*\(/gi, '// eval disabled: eval(');
}

async function generateWithProvider(config: ModelConfig, prompt: string): Promise<string> {
	if (config.provider === 'google') {
		if (!clients.google) throw new Error('Google Gemini not configured');
		const response = await clients.google.models.generateContent({
			model: config.modelId,
			contents: prompt,
			config: { temperature: 0.7, maxOutputTokens: 8192 },
		});
		const content = response.text;
		if (!content) throw new Error('No content from Google Gemini');
		return content;
	}

	if (config.provider === 'anthropic') {
		if (!clients.anthropic) throw new Error('Anthropic not configured');
		const response = await clients.anthropic.messages.create({
			model: config.modelId,
			max_tokens: 8192,
			messages: [{ role: 'user', content: prompt }],
		});
		const content = response.content[0];
		if (!content || content.type !== 'text') throw new Error('No content from Anthropic');
		return content.text;
	}

	if (config.provider === 'azure') {
		if (!clients.azure) throw new Error('Azure OpenAI not configured');
		const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || config.modelId;
		const response = await clients.azure.chat.completions.create({
			model: deployment,
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.7,
			max_tokens: 8192,
		});
		const content = response.choices?.[0]?.message?.content;
		if (!content) throw new Error('No content from Azure OpenAI');
		return content;
	}

	throw new Error(`Unknown provider: ${config.provider}`);
}

export const gamesRoutes = new Hono();

gamesRoutes.post('/generate', async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

	const {
		description,
		mode = 'create',
		originalPrompt,
		currentCode,
		model = 'gemini-2.0-flash',
	} = body;

	if (!description || typeof description !== 'string' || description.trim().length < 10) {
		return c.json({ error: 'Bitte gib eine Spielbeschreibung mit mindestens 10 Zeichen ein' }, 400);
	}

	const config = MODEL_CONFIGS[model] ?? MODEL_CONFIGS['gemini-2.0-flash'];

	const isAvailable =
		(config.provider === 'google' && clients.google !== null) ||
		(config.provider === 'anthropic' && clients.anthropic !== null) ||
		(config.provider === 'azure' && clients.azure !== null);

	if (!isAvailable) {
		return c.json({ error: `AI provider ${config.provider} is not configured` }, 500);
	}

	const prompt = createGamePrompt(description.trim(), mode, originalPrompt, currentCode);

	try {
		let raw = await generateWithProvider(config, prompt);

		const htmlMatch = raw.match(/```html\n([\s\S]*?)\n```/);
		if (htmlMatch) raw = htmlMatch[1];

		const html = validateAndSanitizeGame(raw);

		return c.json({
			success: true,
			html,
			metadata: { description: description.trim(), generatedAt: new Date().toISOString() },
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return c.json({ error: `Failed to generate game: ${message}` }, 500);
	}
});

gamesRoutes.post('/submit', async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

	const { title, description, controls, difficulty, complexity, tags, author, files, submittedAt } =
		body;

	if (!title || !description || !files?.html?.content || !files?.screenshot?.content) {
		return c.json({ error: 'Missing required fields' }, 400);
	}

	const githubToken = process.env.GITHUB_TOKEN;
	const githubOwner = process.env.GITHUB_OWNER || 'tillschneider';
	const githubRepo = process.env.GITHUB_REPO || 'mana-games';

	if (!githubToken || githubToken.includes('your_')) {
		return c.json({ error: 'Server configuration error - GitHub token missing' }, 500);
	}

	const gameSlug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	const timestamp = Date.now();
	const branchName = `community-game-${gameSlug}-${timestamp}`;

	const headers = {
		Authorization: `Bearer ${githubToken}`,
		Accept: 'application/vnd.github.v3+json',
		'Content-Type': 'application/json',
	};

	try {
		const repoResponse = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}`, {
			headers,
		});
		if (!repoResponse.ok) {
			return c.json({ error: `Failed to fetch repository info: ${repoResponse.status}` }, 500);
		}
		const repoData = (await repoResponse.json()) as { default_branch: string };
		const defaultBranch = repoData.default_branch;

		const refResponse = await fetch(
			`https://api.github.com/repos/${githubOwner}/${githubRepo}/git/refs/heads/${defaultBranch}`,
			{ headers }
		);
		if (!refResponse.ok) return c.json({ error: 'Failed to fetch branch info' }, 500);
		const refData = (await refResponse.json()) as { object: { sha: string } };
		const baseSha = refData.object.sha;

		const createBranchResponse = await fetch(
			`https://api.github.com/repos/${githubOwner}/${githubRepo}/git/refs`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
			}
		);
		if (!createBranchResponse.ok) return c.json({ error: 'Failed to create branch' }, 500);

		const gameData = {
			id: String(timestamp),
			title,
			description,
			slug: gameSlug,
			htmlFile: `/games/${gameSlug}.html`,
			thumbnail: `/screenshots/${gameSlug}.jpg`,
			tags,
			difficulty,
			complexity,
			controls,
			community: true,
			author: author.name,
			submittedAt,
		};

		const communityGamesPath = 'src/data/community-games.json';
		let communityGames: unknown[] = [];

		const existingFileResponse = await fetch(
			`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${communityGamesPath}?ref=${defaultBranch}`,
			{ headers }
		);
		if (existingFileResponse.ok) {
			const existingFile = (await existingFileResponse.json()) as { content: string };
			const content = Buffer.from(existingFile.content, 'base64').toString('utf-8');
			communityGames = JSON.parse(content);
		}
		communityGames.push(gameData);

		const filesToCreate = [
			{
				path: `public/games/${gameSlug}.html`,
				content: Buffer.from(files.html.content).toString('base64'),
			},
			{
				path: `public/screenshots/${gameSlug}.jpg`,
				content: files.screenshot.content.split(',')[1],
			},
			{
				path: communityGamesPath,
				content: Buffer.from(JSON.stringify(communityGames, null, 2)).toString('base64'),
			},
		];

		for (const file of filesToCreate) {
			const res = await fetch(
				`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${file.path}`,
				{
					method: 'PUT',
					headers,
					body: JSON.stringify({
						message: `Add community game: ${title}`,
						content: file.content,
						branch: branchName,
					}),
				}
			);
			if (!res.ok) return c.json({ error: `Failed to create file ${file.path}` }, 500);
		}

		const prBody = `## Neues Community-Spiel: ${title}

### Spiel-Details
- **Autor:** ${author.name}${author.github ? ` (@${author.github})` : ''}
- **Beschreibung:** ${description}
- **Schwierigkeit:** ${difficulty}
- **Komplexität:** ${complexity}
- **Steuerung:** ${controls}
- **Tags:** ${(tags as string[]).join(', ')}

### Dateien
- HTML: \`public/games/${gameSlug}.html\`
- Screenshot: \`public/screenshots/${gameSlug}.jpg\`

### Checkliste für Review
- [ ] Spiel funktioniert einwandfrei
- [ ] Keine externen Abhängigkeiten oder Sicherheitsprobleme
- [ ] Familienfreundlicher Inhalt
- [ ] Screenshot zeigt das Spiel korrekt

---
*Eingereicht am: ${new Date(submittedAt).toLocaleString('de-DE')}*
${author.email ? `*Kontakt: ${author.email}*` : ''}`;

		const prResponse = await fetch(
			`https://api.github.com/repos/${githubOwner}/${githubRepo}/pulls`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify({
					title: `Community: ${title}`,
					body: prBody,
					head: branchName,
					base: defaultBranch,
				}),
			}
		);
		if (!prResponse.ok) return c.json({ error: 'Failed to create pull request' }, 500);

		const prData = (await prResponse.json()) as { html_url: string; number: number };
		return c.json({
			success: true,
			message: 'Game submitted successfully',
			prUrl: prData.html_url,
			prNumber: prData.number,
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return c.json({ error: `Failed to submit game: ${message}` }, 500);
	}
});
