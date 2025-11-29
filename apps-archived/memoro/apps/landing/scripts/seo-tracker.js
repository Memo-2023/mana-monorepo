// Google Search Console API Data Collector
// Sammelt SEO-Daten und speichert sie für Dashboard

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

// Konfiguration
const SITE_URL = 'https://memoro.ai/';
const CREDENTIALS_FILE = './credentials.json'; // Service Account JSON
const DATA_DIR = './data/seo';

// Wichtige Keywords zum Tracken
const TRACKED_KEYWORDS = [
	'meeting protokoll software',
	'ki transkription',
	'automatische protokollierung',
	'gesprächsprotokoll app',
	'meeting dokumentation',
	'spracherkennung meetings',
	'protokoll automatisch erstellen',
	'memoro',
];

// Wichtige Seiten zum Tracken
const TRACKED_PAGES = [
	'/de/meeting-protokoll-software',
	'/de/',
	'/de/features',
	'/de/pricing',
	'/de/blog',
];

class SEOTracker {
	constructor() {
		this.auth = null;
		this.searchConsole = null;
	}

	async initialize() {
		// Auth Setup
		const auth = new google.auth.GoogleAuth({
			keyFile: CREDENTIALS_FILE,
			scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
		});

		this.auth = await auth.getClient();
		this.searchConsole = google.searchconsole({
			version: 'v1',
			auth: this.auth,
		});

		// Erstelle Data Directory wenn nicht vorhanden
		await fs.mkdir(DATA_DIR, { recursive: true });
	}

	// Hole Performance-Daten für Keywords
	async getKeywordPerformance(startDate, endDate) {
		const response = await this.searchConsole.searchanalytics.query({
			siteUrl: SITE_URL,
			requestBody: {
				startDate,
				endDate,
				dimensions: ['query', 'page', 'country', 'device'],
				dimensionFilterGroups: [
					{
						filters: [
							{
								dimension: 'query',
								operator: 'contains',
								expression: 'protokoll',
							},
						],
					},
				],
				rowLimit: 1000,
				dataState: 'final',
			},
		});

		return response.data.rows || [];
	}

	// Hole Performance-Daten für spezifische Seiten
	async getPagePerformance(startDate, endDate) {
		const results = [];

		for (const page of TRACKED_PAGES) {
			try {
				const response = await this.searchConsole.searchanalytics.query({
					siteUrl: SITE_URL,
					requestBody: {
						startDate,
						endDate,
						dimensions: ['page', 'query'],
						dimensionFilterGroups: [
							{
								filters: [
									{
										dimension: 'page',
										operator: 'equals',
										expression: SITE_URL + page.substring(1),
									},
								],
							},
						],
						rowLimit: 100,
						dataState: 'final',
					},
				});

				if (response.data.rows) {
					results.push({
						page,
						data: response.data.rows,
						totals: {
							clicks: response.data.rows.reduce((sum, row) => sum + row.clicks, 0),
							impressions: response.data.rows.reduce((sum, row) => sum + row.impressions, 0),
							ctr:
								response.data.rows.reduce((sum, row) => sum + row.ctr, 0) /
								response.data.rows.length,
							position:
								response.data.rows.reduce((sum, row) => sum + row.position, 0) /
								response.data.rows.length,
						},
					});
				}
			} catch (error) {
				console.error(`Error fetching data for ${page}:`, error.message);
			}
		}

		return results;
	}

	// Hole Top-Suchanfragen
	async getTopQueries(startDate, endDate, limit = 50) {
		const response = await this.searchConsole.searchanalytics.query({
			siteUrl: SITE_URL,
			requestBody: {
				startDate,
				endDate,
				dimensions: ['query'],
				rowLimit: limit,
				dataState: 'final',
			},
		});

		return response.data.rows || [];
	}

	// Speichere Daten als JSON
	async saveData(data, filename) {
		const filepath = path.join(DATA_DIR, filename);
		await fs.writeFile(filepath, JSON.stringify(data, null, 2));
		console.log(`✅ Daten gespeichert: ${filepath}`);
	}

	// Hauptfunktion zum Sammeln aller Daten
	async collectDailyData() {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		const startDate = yesterday.toISOString().split('T')[0];
		const endDate = startDate;

		console.log(`📊 Sammle SEO-Daten für ${startDate}...`);

		try {
			// Sammle verschiedene Metriken
			const [keywordData, pageData, topQueries] = await Promise.all([
				this.getKeywordPerformance(startDate, endDate),
				this.getPagePerformance(startDate, endDate),
				this.getTopQueries(startDate, endDate),
			]);

			// Strukturiere Daten für Dashboard
			const dashboardData = {
				date: startDate,
				timestamp: new Date().toISOString(),
				summary: {
					totalClicks: topQueries.reduce((sum, q) => sum + q.clicks, 0),
					totalImpressions: topQueries.reduce((sum, q) => sum + q.impressions, 0),
					avgCTR: topQueries.reduce((sum, q) => sum + q.ctr, 0) / topQueries.length,
					avgPosition: topQueries.reduce((sum, q) => sum + q.position, 0) / topQueries.length,
				},
				keywords: this.processKeywordData(keywordData),
				pages: pageData,
				topQueries: topQueries.slice(0, 20),
				trackedKeywords: this.filterTrackedKeywords(keywordData),
			};

			// Speichere Tages-Snapshot
			await this.saveData(dashboardData, `seo-data-${startDate}.json`);

			// Update aggregierte Daten
			await this.updateAggregatedData(dashboardData);

			return dashboardData;
		} catch (error) {
			console.error('❌ Fehler beim Sammeln der Daten:', error);
			throw error;
		}
	}

	// Filtere und strukturiere Keyword-Daten
	processKeywordData(data) {
		const keywordMap = {};

		data.forEach((row) => {
			const query = row.keys[0];
			if (!keywordMap[query]) {
				keywordMap[query] = {
					query,
					clicks: 0,
					impressions: 0,
					positions: [],
					devices: {},
					pages: new Set(),
				};
			}

			keywordMap[query].clicks += row.clicks;
			keywordMap[query].impressions += row.impressions;
			keywordMap[query].positions.push(row.position);

			const device = row.keys[3];
			keywordMap[query].devices[device] = (keywordMap[query].devices[device] || 0) + row.clicks;

			const page = row.keys[1];
			keywordMap[query].pages.add(page);
		});

		// Berechne Durchschnittswerte
		return Object.values(keywordMap)
			.map((kw) => ({
				query: kw.query,
				clicks: kw.clicks,
				impressions: kw.impressions,
				ctr: kw.clicks / kw.impressions,
				avgPosition: kw.positions.reduce((a, b) => a + b, 0) / kw.positions.length,
				devices: kw.devices,
				pageCount: kw.pages.size,
			}))
			.sort((a, b) => b.clicks - a.clicks);
	}

	// Filtere tracked Keywords
	filterTrackedKeywords(data) {
		return TRACKED_KEYWORDS.map((keyword) => {
			const matches = data.filter((row) =>
				row.keys[0].toLowerCase().includes(keyword.toLowerCase())
			);

			if (matches.length === 0) {
				return {
					keyword,
					status: 'not_ranking',
					clicks: 0,
					impressions: 0,
					position: null,
				};
			}

			const totals = matches.reduce(
				(acc, row) => ({
					clicks: acc.clicks + row.clicks,
					impressions: acc.impressions + row.impressions,
					positions: [...acc.positions, row.position],
				}),
				{ clicks: 0, impressions: 0, positions: [] }
			);

			return {
				keyword,
				status: 'ranking',
				clicks: totals.clicks,
				impressions: totals.impressions,
				ctr: totals.clicks / totals.impressions,
				position: totals.positions.reduce((a, b) => a + b, 0) / totals.positions.length,
				trend: null, // Wird später berechnet
			};
		});
	}

	// Update aggregierte Daten für Trends
	async updateAggregatedData(newData) {
		const aggregatedFile = path.join(DATA_DIR, 'aggregated-seo-data.json');

		let aggregated = { history: [], keywords: {} };

		try {
			const existing = await fs.readFile(aggregatedFile, 'utf-8');
			aggregated = JSON.parse(existing);
		} catch (error) {
			// File existiert noch nicht
		}

		// Füge neue Daten zur Historie hinzu
		aggregated.history.push({
			date: newData.date,
			summary: newData.summary,
			topKeywords: newData.keywords.slice(0, 10).map((k) => ({
				query: k.query,
				clicks: k.clicks,
				position: k.avgPosition,
			})),
		});

		// Behalte nur die letzten 90 Tage
		if (aggregated.history.length > 90) {
			aggregated.history = aggregated.history.slice(-90);
		}

		// Update Keyword-Trends
		newData.trackedKeywords.forEach((kw) => {
			if (!aggregated.keywords[kw.keyword]) {
				aggregated.keywords[kw.keyword] = [];
			}

			aggregated.keywords[kw.keyword].push({
				date: newData.date,
				position: kw.position,
				clicks: kw.clicks,
				impressions: kw.impressions,
			});

			// Behalte nur die letzten 30 Datenpunkte pro Keyword
			if (aggregated.keywords[kw.keyword].length > 30) {
				aggregated.keywords[kw.keyword] = aggregated.keywords[kw.keyword].slice(-30);
			}
		});

		await this.saveData(aggregated, 'aggregated-seo-data.json');
	}

	// Generiere Wochenbericht
	async generateWeeklyReport() {
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 7);

		const start = startDate.toISOString().split('T')[0];
		const end = endDate.toISOString().split('T')[0];

		console.log(`📈 Generiere Wochenbericht ${start} bis ${end}...`);

		const [keywordData, pageData, topQueries] = await Promise.all([
			this.getKeywordPerformance(start, end),
			this.getPagePerformance(start, end),
			this.getTopQueries(start, end, 100),
		]);

		const report = {
			period: { start, end },
			generated: new Date().toISOString(),
			summary: {
				totalClicks: topQueries.reduce((sum, q) => sum + q.clicks, 0),
				totalImpressions: topQueries.reduce((sum, q) => sum + q.impressions, 0),
				avgCTR:
					((topQueries.reduce((sum, q) => sum + q.ctr, 0) / topQueries.length) * 100).toFixed(2) +
					'%',
				avgPosition: (
					topQueries.reduce((sum, q) => sum + q.position, 0) / topQueries.length
				).toFixed(1),
			},
			topPerformingQueries: topQueries.slice(0, 20),
			pagePerformance: pageData,
			newKeywords: this.findNewKeywords(keywordData),
			positionChanges: await this.calculatePositionChanges(),
		};

		await this.saveData(report, `weekly-report-${end}.json`);
		return report;
	}

	// Finde neue Keywords
	findNewKeywords(currentData) {
		// Hier würdest du mit historischen Daten vergleichen
		return currentData
			.filter((row) => row.impressions > 10 && row.position < 50)
			.map((row) => ({
				query: row.keys[0],
				impressions: row.impressions,
				position: row.position,
				opportunity: row.position > 10 ? 'high' : 'medium',
			}))
			.slice(0, 20);
	}

	// Berechne Positionsänderungen
	async calculatePositionChanges() {
		const aggregatedFile = path.join(DATA_DIR, 'aggregated-seo-data.json');

		try {
			const data = await fs.readFile(aggregatedFile, 'utf-8');
			const aggregated = JSON.parse(data);

			return Object.entries(aggregated.keywords)
				.map(([keyword, history]) => {
					if (history.length < 2) return null;

					const current = history[history.length - 1];
					const previous = history[history.length - 7] || history[0];

					return {
						keyword,
						currentPosition: current.position,
						previousPosition: previous.position,
						change: previous.position - current.position,
						trend:
							current.position < previous.position
								? 'improving'
								: current.position > previous.position
									? 'declining'
									: 'stable',
					};
				})
				.filter(Boolean);
		} catch (error) {
			return [];
		}
	}
}

// CLI Interface
async function main() {
	const tracker = new SEOTracker();
	await tracker.initialize();

	const command = process.argv[2];

	switch (command) {
		case 'daily':
			await tracker.collectDailyData();
			break;

		case 'weekly':
			await tracker.generateWeeklyReport();
			break;

		case 'test':
			// Test mit den letzten 7 Tagen
			const endDate = new Date().toISOString().split('T')[0];
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - 7);
			const start = startDate.toISOString().split('T')[0];

			console.log(`Test: Hole Daten von ${start} bis ${endDate}`);
			const data = await tracker.getTopQueries(start, endDate, 10);
			console.log('Top Queries:', data);
			break;

		default:
			console.log(`
        SEO Tracker - Verwendung:
        
        node seo-tracker.js daily   - Sammle tägliche Daten
        node seo-tracker.js weekly  - Generiere Wochenbericht  
        node seo-tracker.js test    - Teste API-Verbindung
      `);
	}
}

// Führe aus wenn direkt aufgerufen
if (require.main === module) {
	main().catch(console.error);
}

module.exports = SEOTracker;
