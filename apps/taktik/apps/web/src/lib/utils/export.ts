/**
 * CSV Export utility for time entries
 */

import type { TimeEntry, Project, Client } from '@taktik/shared';

export function exportEntriesToCSV(
	entries: TimeEntry[],
	projects: Project[],
	clients: Client[]
): void {
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
			e.startTime
				? new Date(e.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
				: '',
			e.endTime
				? new Date(e.endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
				: '',
		];
	});

	const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
	const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
	const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `taktik-export-${new Date().toISOString().split('T')[0]}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}
