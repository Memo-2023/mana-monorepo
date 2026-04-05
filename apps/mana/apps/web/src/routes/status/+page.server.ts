import type { PageServerLoad } from './$types';

interface ServiceStatus {
	name: string;
	url: string;
	status: 'up' | 'down' | 'degraded';
	responseTimeMs: number;
	details?: string;
}

const SERVICES = [
	{ name: 'Auth', url: process.env.PUBLIC_MANA_AUTH_URL || 'http://localhost:3001' },
	{ name: 'Todo API', url: process.env.PUBLIC_TODO_API_URL || 'http://localhost:3031' },
	{ name: 'Calendar API', url: process.env.PUBLIC_CALENDAR_API_URL || 'http://localhost:3032' },
	{ name: 'Contacts API', url: process.env.PUBLIC_CONTACTS_API_URL || 'http://localhost:3033' },
	{ name: 'Chat API', url: process.env.PUBLIC_CHAT_API_URL || 'http://localhost:3030' },
	{ name: 'Storage API', url: process.env.PUBLIC_STORAGE_API_URL || 'http://localhost:3034' },
	{ name: 'Cards API', url: process.env.PUBLIC_CARDS_API_URL || 'http://localhost:3036' },
	{ name: 'Music API', url: process.env.PUBLIC_MUSIC_API_URL || 'http://localhost:3037' },
	{ name: 'NutriPhi API', url: process.env.PUBLIC_NUTRIPHI_API_URL || 'http://localhost:3038' },
	{ name: 'Uload Server', url: process.env.PUBLIC_ULOAD_SERVER_URL || 'http://localhost:3070' },
	{ name: 'Memoro Server', url: process.env.PUBLIC_MEMORO_SERVER_URL || 'http://localhost:3015' },
	{ name: 'Media', url: process.env.PUBLIC_MANA_MEDIA_URL || 'http://localhost:3011' },
	{ name: 'LLM', url: process.env.PUBLIC_MANA_LLM_URL || 'http://localhost:3025' },
];

async function checkService(service: { name: string; url: string }): Promise<ServiceStatus> {
	const start = performance.now();
	try {
		const res = await fetch(`${service.url}/health`, {
			signal: AbortSignal.timeout(5000),
		});
		const responseTimeMs = Math.round(performance.now() - start);

		if (res.ok) {
			return {
				name: service.name,
				url: service.url,
				status: responseTimeMs > 2000 ? 'degraded' : 'up',
				responseTimeMs,
			};
		}
		return {
			name: service.name,
			url: service.url,
			status: 'down',
			responseTimeMs,
			details: `HTTP ${res.status}`,
		};
	} catch (e) {
		return {
			name: service.name,
			url: service.url,
			status: 'down',
			responseTimeMs: Math.round(performance.now() - start),
			details: e instanceof Error ? e.message : 'Connection failed',
		};
	}
}

export const load: PageServerLoad = async () => {
	const results = await Promise.all(SERVICES.map(checkService));
	const upCount = results.filter((s) => s.status === 'up').length;
	const degradedCount = results.filter((s) => s.status === 'degraded').length;
	const downCount = results.filter((s) => s.status === 'down').length;

	let overallStatus: 'operational' | 'degraded' | 'outage' = 'operational';
	if (downCount > 0) overallStatus = downCount > results.length / 2 ? 'outage' : 'degraded';
	else if (degradedCount > 0) overallStatus = 'degraded';

	return {
		services: results,
		summary: { up: upCount, degraded: degradedCount, down: downCount, total: results.length },
		overallStatus,
		checkedAt: new Date().toISOString(),
	};
};
