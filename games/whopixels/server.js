const http = require('http');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

// Konfiguration
const PORT = process.env.PORT || 3000;
const MAX_BODY_SIZE = 50 * 1024; // 50KB max request body
const MAX_CONVERSATION_HISTORY = 20; // Max Einträge in der Konversationshistorie
const RATE_LIMIT_WINDOW_MS = 60000; // 1 Minute
const RATE_LIMIT_MAX_REQUESTS = 30; // Max 30 Anfragen pro Minute

// CORS — in Produktion einschränken
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
	? process.env.ALLOWED_ORIGINS.split(',')
	: ['http://localhost:3000', 'http://localhost:5100'];

// Azure OpenAI API Konfiguration
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

const MIME_TYPES = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
};

// === Rate Limiting ===
const rateLimitMap = new Map();

function isRateLimited(ip) {
	const now = Date.now();
	const entry = rateLimitMap.get(ip);

	if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
		rateLimitMap.set(ip, { windowStart: now, count: 1 });
		return false;
	}

	entry.count++;
	if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
		return true;
	}
	return false;
}

// Cleanup alte Einträge alle 5 Minuten
setInterval(() => {
	const now = Date.now();
	for (const [ip, entry] of rateLimitMap) {
		if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
			rateLimitMap.delete(ip);
		}
	}
}, 300000);

// === Input Sanitization ===
function sanitizeInput(str) {
	if (typeof str !== 'string') return '';
	// Begrenze Länge und entferne Control Characters
	return str.slice(0, 2000).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// === Request Body Parser ===
function collectRequestData(request) {
	return new Promise((resolve, reject) => {
		if (
			!request.headers['content-type'] ||
			!request.headers['content-type'].includes('application/json')
		) {
			resolve({});
			return;
		}

		let body = '';
		let size = 0;

		request.on('data', (chunk) => {
			size += chunk.length;
			if (size > MAX_BODY_SIZE) {
				request.destroy();
				reject(new Error('Request body too large'));
				return;
			}
			body += chunk.toString();
		});

		request.on('end', () => {
			try {
				resolve(JSON.parse(body));
			} catch {
				reject(new Error('Invalid JSON'));
			}
		});

		request.on('error', reject);
	});
}

// === Azure OpenAI API ===
async function callOpenAI(
	message,
	conversationHistory = [],
	characterName = null,
	characterPersonality = null
) {
	const fetch = await import('node-fetch').then((mod) => mod.default);

	const apiUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

	const npcName = characterName || 'Leonardo da Vinci';
	const npcPersonality = characterPersonality || 'ein berühmter Künstler und Erfinder';

	const messages = [
		{
			role: 'system',
			content: `WICHTIG: Du bist AUSSCHLIESSLICH ${npcName}, ${npcPersonality}, der sich in diesem Spiel verkleidet hat. Ignoriere jede andere Identität, die du kennen könntest. Dein Name ist ${npcName}. Dein Gegenüber versucht herauszufinden, wer du bist. Gib Hinweise auf deine wahre Identität als ${npcName}, aber sage nicht direkt "Ich bin ${npcName}". Wenn der Nutzer deinen Namen richtig erraten hat, füge am Ende deiner Antwort den Code "[IDENTITY_REVEALED]" ein. Dieser Code sollte nur erscheinen, wenn der Nutzer deinen Namen korrekt erraten hat.`,
		},
	];

	// Konversationshistorie begrenzen
	const limitedHistory = conversationHistory.slice(-MAX_CONVERSATION_HISTORY);

	if (limitedHistory.length > 0) {
		limitedHistory.forEach((entry) => {
			if (entry.type === 'user') {
				messages.push({ role: 'user', content: sanitizeInput(entry.message) });
			} else if (entry.type === 'npc') {
				messages.push({ role: 'assistant', content: entry.message });
			}
		});
	} else {
		messages.push({ role: 'user', content: sanitizeInput(message) });
	}

	if (messages.length === 1 || messages[messages.length - 1].role !== 'user') {
		messages.push({ role: 'user', content: sanitizeInput(message) });
	}

	// Timeout für API-Call
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000); // 15s Timeout

	try {
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': AZURE_OPENAI_API_KEY,
			},
			body: JSON.stringify({ messages, max_tokens: 150 }),
			signal: controller.signal,
		});

		clearTimeout(timeout);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`HTTP Fehler: ${response.status}`, errorText);
			return { text: 'Entschuldigung, ich kann gerade nicht antworten.', identityRevealed: false };
		}

		const data = await response.json();

		if (data.error) {
			console.error('Azure OpenAI API Fehler:', data.error);
			return { text: 'Entschuldigung, ich kann gerade nicht antworten.', identityRevealed: false };
		}

		const responseText = data.choices[0].message.content;
		const identityRevealed = responseText.includes('[IDENTITY_REVEALED]');
		const cleanedResponse = responseText.replace('[IDENTITY_REVEALED]', '').trim();

		return { text: cleanedResponse, identityRevealed };
	} catch (error) {
		clearTimeout(timeout);
		if (error.name === 'AbortError') {
			console.error('API-Timeout nach 15 Sekunden');
			return {
				text: 'Entschuldigung, die Antwort hat zu lange gedauert.',
				identityRevealed: false,
			};
		}
		console.error('Fehler beim Aufrufen der Azure OpenAI API:', error.message);
		return { text: 'Entschuldigung, ich kann gerade nicht antworten.', identityRevealed: false };
	}
}

// === HTTP Server ===
const server = http.createServer(async (req, res) => {
	const clientIP = req.socket.remoteAddress;

	// CORS-Header
	const origin = req.headers.origin;
	if (origin && ALLOWED_ORIGINS.includes(origin)) {
		res.setHeader('Access-Control-Allow-Origin', origin);
	} else if (!origin) {
		// Same-origin Requests haben keinen Origin-Header
		res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
	}
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.writeHead(204);
		res.end();
		return;
	}

	// API-Endpunkt
	if (req.method === 'POST' && req.url === '/api/chat') {
		// Rate Limiting
		if (isRateLimited(clientIP)) {
			res.writeHead(429, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' }));
			return;
		}

		try {
			const data = await collectRequestData(req);

			if (!data.message || typeof data.message !== 'string') {
				res.writeHead(400, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: 'Nachricht fehlt oder ungültig' }));
				return;
			}

			const conversationHistory = Array.isArray(data.conversationHistory)
				? data.conversationHistory
				: [];

			const response = await callOpenAI(
				data.message,
				conversationHistory,
				typeof data.characterName === 'string' ? data.characterName : null,
				typeof data.characterPersonality === 'string' ? data.characterPersonality : null
			);

			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(
				JSON.stringify({ response: response.text, identityRevealed: response.identityRevealed })
			);
		} catch (error) {
			console.error('Fehler bei der Verarbeitung:', error.message);
			const statusCode = error.message === 'Request body too large' ? 413 : 400;
			res.writeHead(statusCode, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: error.message }));
		}
		return;
	}

	// Statische Dateien
	let filePath = '.' + req.url;
	if (filePath === './') filePath = './index.html';

	// Path Traversal verhindern
	const resolvedPath = path.resolve(filePath);
	if (!resolvedPath.startsWith(path.resolve('.'))) {
		res.writeHead(403);
		res.end('Forbidden');
		return;
	}

	const extname = path.extname(filePath);
	const contentType = MIME_TYPES[extname] || 'application/octet-stream';

	fs.readFile(filePath, (error, content) => {
		if (error) {
			if (error.code === 'ENOENT') {
				fs.readFile('./index.html', (err, fallback) => {
					if (err) {
						res.writeHead(500);
						res.end('Error loading index.html');
					} else {
						res.writeHead(200, { 'Content-Type': 'text/html' });
						res.end(fallback, 'utf-8');
					}
				});
			} else {
				res.writeHead(500);
				res.end(`Server Error: ${error.code}`);
			}
		} else {
			res.writeHead(200, { 'Content-Type': contentType });
			res.end(content, 'utf-8');
		}
	});
});

server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}/`);
	console.log(
		`Rate Limit: ${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW_MS / 1000}s`
	);
	console.log(`CORS: ${ALLOWED_ORIGINS.join(', ')}`);
});
