const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Lade Umgebungsvariablen aus .env-Datei
require('dotenv').config();

// Für die Verarbeitung von POST-Anfragen
const { parse } = require('querystring');

// Konfiguration
const PORT = process.env.PORT || 3000;

// Azure OpenAI API Konfiguration aus Umgebungsvariablen
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

// Funktion zum Abrufen von Daten aus einer POST-Anfrage
const collectRequestData = (request, callback) => {
	const FORM_URLENCODED = 'application/x-www-form-urlencoded';
	const JSON_TYPE = 'application/json';

	if (request.headers['content-type'] === FORM_URLENCODED) {
		let body = '';
		request.on('data', (chunk) => {
			body += chunk.toString();
		});
		request.on('end', () => {
			callback(parse(body));
		});
	} else if (
		request.headers['content-type'] &&
		request.headers['content-type'].includes(JSON_TYPE)
	) {
		let body = '';
		request.on('data', (chunk) => {
			body += chunk.toString();
		});
		request.on('end', () => {
			callback(JSON.parse(body));
		});
	} else {
		callback({});
	}
};

// Funktion zum Senden einer Anfrage an die Azure OpenAI API
async function callOpenAI(
	message,
	conversationHistory = [],
	characterName = null,
	characterPersonality = null
) {
	try {
		const fetch = await import('node-fetch').then((mod) => mod.default);

		const apiUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

		console.log(`Sende Anfrage an: ${apiUrl}`);

		// Verwende den übergebenen Charakternamen oder einen Standardnamen
		const npcName = characterName || 'Leonard Davcini';
		const npcPersonality = characterPersonality || 'ein berühmter Künstler und Erfinder';

		console.log(`Verwende NPC: ${npcName} mit Persönlichkeit: ${npcPersonality}`);

		// Erstelle die Nachrichtenliste für die API mit dem dynamischen Charakternamen
		const messages = [
			{
				role: 'system',
				content: `WICHTIG: Du bist AUSSCHLIESSLICH ${npcName}, ${npcPersonality}, der sich in diesem Spiel verkleidet hat. Ignoriere jede andere Identität, die du kennen könntest. Dein Name ist ${npcName}. Dein Gegenüber versucht herauszufinden, wer du bist. Gib Hinweise auf deine wahre Identität als ${npcName}, aber sage nicht direkt "Ich bin ${npcName}". Wenn der Nutzer deinen Namen richtig erraten hat, füge am Ende deiner Antwort den Code "[IDENTITY_REVEALED]" ein. Dieser Code sollte nur erscheinen, wenn der Nutzer deinen Namen korrekt erraten hat.`,
			},
		];

		// Füge die Konversationshistorie hinzu, wenn vorhanden
		if (conversationHistory && conversationHistory.length > 0) {
			conversationHistory.forEach((entry) => {
				if (entry.type === 'user') {
					messages.push({
						role: 'user',
						content: entry.message,
					});
				} else if (entry.type === 'npc') {
					messages.push({
						role: 'assistant',
						content: entry.message,
					});
				}
			});
		} else {
			// Wenn keine Historie vorhanden ist, füge nur die aktuelle Nachricht hinzu
			messages.push({
				role: 'user',
				content: message,
			});
		}

		// Wenn die letzte Nachricht nicht vom Benutzer ist, füge die aktuelle Nachricht hinzu
		if (messages.length === 1 || messages[messages.length - 1].role !== 'user') {
			messages.push({
				role: 'user',
				content: message,
			});
		}

		console.log('Gesendete Nachrichten:', JSON.stringify(messages, null, 2));

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': AZURE_OPENAI_API_KEY,
			},
			body: JSON.stringify({
				messages: messages,
				max_tokens: 150,
			}),
		});

		// Prüfe den HTTP-Status
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`HTTP Fehler: ${response.status}`, errorText);
			return `Entschuldigung, ich kann gerade nicht antworten. (HTTP ${response.status})`;
		}

		const data = await response.json();
		console.log('API-Antwort:', JSON.stringify(data, null, 2));

		if (data.error) {
			console.error('Azure OpenAI API Fehler:', data.error);
			return {
				text: 'Entschuldigung, ich kann gerade nicht antworten. Versuche es später noch einmal.',
				identityRevealed: false,
			};
		}

		// Hole die Antwort vom LLM
		const responseText = data.choices[0].message.content;

		// Prüfe, ob der spezielle Code enthalten ist
		const identityRevealed = responseText.includes('[IDENTITY_REVEALED]');

		// Entferne den Code aus der Antwort, wenn er vorhanden ist
		const cleanedResponse = responseText.replace('[IDENTITY_REVEALED]', '').trim();

		console.log('Identität aufgedeckt:', identityRevealed);

		// Gib die Antwort und das Flag zurück
		return {
			text: cleanedResponse,
			identityRevealed: identityRevealed,
		};
	} catch (error) {
		console.error('Fehler beim Aufrufen der Azure OpenAI API:', error);
		return {
			text: 'Entschuldigung, ich kann gerade nicht antworten. Versuche es später noch einmal.',
			identityRevealed: false,
		};
	}
}

const server = http.createServer((req, res) => {
	console.log(`${req.method} ${req.url}`);

	// CORS-Header hinzufügen für Cross-Origin-Anfragen
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	// OPTIONS-Anfragen für CORS-Preflight behandeln
	if (req.method === 'OPTIONS') {
		res.writeHead(204);
		res.end();
		return;
	}

	// API-Endpunkt für OpenAI-Anfragen
	if (req.method === 'POST' && req.url === '/api/chat') {
		collectRequestData(req, async (data) => {
			try {
				if (!data.message) {
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ error: 'Nachricht fehlt' }));
					return;
				}

				// Verwende die Konversationshistorie, wenn vorhanden
				const conversationHistory = data.conversationHistory || [];
				console.log(
					'Erhaltene Konversationshistorie:',
					JSON.stringify(conversationHistory, null, 2)
				);

				// Extrahiere Charakterinformationen, wenn vorhanden
				const characterName = data.characterName;
				const characterPersonality = data.characterPersonality;

				if (characterName) {
					console.log(`NPC-Charakter in der Anfrage: ${characterName}`);
				}

				const response = await callOpenAI(
					data.message,
					conversationHistory,
					characterName,
					characterPersonality
				);

				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(
					JSON.stringify({
						response: response.text,
						identityRevealed: response.identityRevealed,
					})
				);
			} catch (error) {
				console.error('Fehler bei der Verarbeitung der Chat-Anfrage:', error);
				res.writeHead(500, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: 'Interner Serverfehler' }));
			}
		});
		return;
	}

	// Statische Dateien behandeln
	let filePath = '.' + req.url;
	if (filePath === './') {
		filePath = './index.html';
	}

	// Get the file extension
	const extname = path.extname(filePath);
	const contentType = MIME_TYPES[extname] || 'application/octet-stream';

	// Read the file
	fs.readFile(filePath, (error, content) => {
		if (error) {
			if (error.code === 'ENOENT') {
				// Page not found
				fs.readFile('./index.html', (err, content) => {
					if (err) {
						res.writeHead(500);
						res.end('Error loading index.html');
					} else {
						res.writeHead(200, { 'Content-Type': 'text/html' });
						res.end(content, 'utf-8');
					}
				});
			} else {
				// Server error
				res.writeHead(500);
				res.end(`Server Error: ${error.code}`);
			}
		} else {
			// Success
			res.writeHead(200, { 'Content-Type': contentType });
			res.end(content, 'utf-8');
		}
	});
});

server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}/`);
	console.log('Press Ctrl+C to stop the server');
	console.log('Azure OpenAI API ist konfiguriert und bereit!');
});
