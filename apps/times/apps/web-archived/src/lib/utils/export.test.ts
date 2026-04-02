import { describe, it, expect } from 'vitest';
import type { TimeEntry, Project, Client } from '@times/shared';

// We test the CSV generation logic without triggering DOM download.
// This mirrors the core logic from export.ts.

function generateCSVContent(entries: TimeEntry[], projects: Project[], clients: Client[]): string {
	const projectMap = new Map(projects.map((p) => [p.id, p]));
	const clientMap = new Map(clients.map((c) => [c.id, c]));

	const headers = [
		'Datum',
		'Beschreibung',
		'Projekt',
		'Kunde',
		'Dauer (h)',
		'Dauer (min)',
		'Abrechenbar',
		'Tags',
		'Startzeit',
		'Endzeit',
	];

	const rows = entries.map((e) => {
		const project = e.projectId ? projectMap.get(e.projectId) : undefined;
		const client = e.clientId ? clientMap.get(e.clientId) : undefined;
		const hours = Math.floor(e.duration / 3600);
		const minutes = Math.floor((e.duration % 3600) / 60);

		return [
			e.date,
			`"${(e.description || '').replace(/"/g, '""')}"`,
			`"${(project?.name || '').replace(/"/g, '""')}"`,
			`"${(client?.name || '').replace(/"/g, '""')}"`,
			hours.toString(),
			(hours * 60 + minutes).toString(),
			e.isBillable ? 'Ja' : 'Nein',
			`"${e.tags.join(', ')}"`,
			'',
			'',
		];
	});

	return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
}

// ─── Test Data ───────────────────────────────────────────

const projects: Project[] = [
	{
		id: 'p1',
		name: 'Website Redesign',
		color: '#3b82f6',
		isArchived: false,
		isBillable: true,
		visibility: 'private',
		order: 0,
		createdAt: '',
		updatedAt: '',
	},
];

const clients: Client[] = [
	{
		id: 'c1',
		name: 'Acme Corp',
		color: '#3b82f6',
		isArchived: false,
		order: 0,
		createdAt: '',
		updatedAt: '',
	},
];

// ─── Tests ───────────────────────────────────────────────

describe('CSV Export', () => {
	it('generates correct CSV headers', () => {
		const csv = generateCSVContent([], projects, clients);
		expect(csv).toContain('Datum;Beschreibung;Projekt;Kunde');
	});

	it('generates correct row data', () => {
		const entries: TimeEntry[] = [
			{
				id: 'e1',
				projectId: 'p1',
				clientId: 'c1',
				description: 'API work',
				date: '2024-01-15',
				duration: 5400,
				isBillable: true,
				isRunning: false,
				tags: ['dev', 'api'],
				visibility: 'private',
				createdAt: '',
				updatedAt: '',
			},
		];

		const csv = generateCSVContent(entries, projects, clients);
		const lines = csv.split('\n');
		expect(lines).toHaveLength(2);

		const row = lines[1];
		expect(row).toContain('2024-01-15');
		expect(row).toContain('"API work"');
		expect(row).toContain('"Website Redesign"');
		expect(row).toContain('"Acme Corp"');
		expect(row).toContain('1'); // 1 hour
		expect(row).toContain('90'); // 90 minutes
		expect(row).toContain('Ja');
		expect(row).toContain('"dev, api"');
	});

	it('escapes quotes in descriptions', () => {
		const entries: TimeEntry[] = [
			{
				id: 'e1',
				description: 'Fix "bug" in API',
				date: '2024-01-15',
				duration: 3600,
				isBillable: false,
				isRunning: false,
				tags: [],
				visibility: 'private',
				createdAt: '',
				updatedAt: '',
			},
		];

		const csv = generateCSVContent(entries, projects, clients);
		expect(csv).toContain('"Fix ""bug"" in API"');
	});

	it('handles entries without project or client', () => {
		const entries: TimeEntry[] = [
			{
				id: 'e1',
				description: 'Internal work',
				date: '2024-01-15',
				duration: 1800,
				isBillable: false,
				isRunning: false,
				tags: [],
				visibility: 'private',
				createdAt: '',
				updatedAt: '',
			},
		];

		const csv = generateCSVContent(entries, projects, clients);
		expect(csv).toContain('""'); // empty project/client
		expect(csv).toContain('Nein');
	});

	it('handles empty entries', () => {
		const csv = generateCSVContent([], projects, clients);
		const lines = csv.split('\n');
		expect(lines).toHaveLength(1); // headers only
	});
});
