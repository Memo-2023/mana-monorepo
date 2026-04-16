/**
 * Times Tools — LLM-accessible operations for time tracking.
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { db } from '$lib/data/database';
import { formatDurationCompact, toTimeEntry, toProject, toClient } from './queries';
import type { LocalTimeEntry, LocalProject, LocalClient } from './types';
import type { LocalTimeBlock } from '$lib/data/time-blocks/types';

export const timesTools: ModuleTool[] = [
	{
		name: 'start_timer',
		module: 'times',
		description: 'Startet einen Zeitmess-Timer mit optionaler Beschreibung und Projekt.',
		parameters: [
			{
				name: 'description',
				type: 'string',
				description: 'Beschreibung der Taetigkeit',
				required: false,
			},
			{
				name: 'projectId',
				type: 'string',
				description: 'ID eines Projekts (aus list_projects)',
				required: false,
			},
		],
		async execute(params) {
			const { timerStore } = await import('./stores/timer.svelte');
			await timerStore.start({
				description: params.description as string | undefined,
				projectId: params.projectId as string | undefined,
			});
			return {
				success: true,
				message: `Timer gestartet${params.description ? `: "${params.description}"` : ''}`,
			};
		},
	},

	{
		name: 'stop_timer',
		module: 'times',
		description: 'Stoppt den laufenden Timer und speichert den Zeiteintrag.',
		parameters: [],
		async execute() {
			const { timerStore } = await import('./stores/timer.svelte');
			const entry = await timerStore.stop();
			if (!entry) return { success: false, message: 'Kein Timer aktiv' };
			return {
				success: true,
				data: entry,
				message: `Timer gestoppt (${formatDurationCompact(entry.duration)})`,
			};
		},
	},

	{
		name: 'get_timer_status',
		module: 'times',
		description: 'Gibt den Status des laufenden Timers zurueck (ob aktiv, Dauer, Beschreibung).',
		parameters: [],
		async execute() {
			const { timerStore } = await import('./stores/timer.svelte');
			if (!timerStore.isRunning) {
				return { success: true, data: { running: false }, message: 'Kein Timer aktiv' };
			}
			const entry = timerStore.runningEntry;
			return {
				success: true,
				data: {
					running: true,
					elapsed: timerStore.elapsedSeconds,
					elapsedFormatted: formatDurationCompact(timerStore.elapsedSeconds),
					description: entry?.description ?? '',
					projectId: entry?.projectId ?? null,
				},
				message: `Timer laeuft: ${formatDurationCompact(timerStore.elapsedSeconds)}${entry?.description ? ` — "${entry.description}"` : ''}`,
			};
		},
	},

	{
		name: 'get_time_stats',
		module: 'times',
		description:
			'Gibt Zeiterfassungs-Statistiken zurueck: Stunden heute, diese Woche, und Aufschluesselung nach Projekt.',
		parameters: [
			{
				name: 'period',
				type: 'string',
				description: 'Zeitraum (Standard: week)',
				required: false,
				enum: ['today', 'week', 'month'],
			},
		],
		async execute(params) {
			const period = (params.period as string) ?? 'week';
			const now = new Date();
			const todayStr = now.toISOString().split('T')[0];

			// Determine date range
			let fromDate: string;
			if (period === 'today') {
				fromDate = todayStr;
			} else if (period === 'week') {
				const d = new Date(now);
				d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)); // Monday
				fromDate = d.toISOString().split('T')[0];
			} else {
				fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
			}

			// Fetch entries + blocks + projects
			const [allEntries, allBlocks, allProjects, allClients] = await Promise.all([
				db.table<LocalTimeEntry>('timeEntries').toArray(),
				db.table<LocalTimeBlock>('timeBlocks').toArray(),
				db.table<LocalProject>('timeProjects').toArray(),
				db.table<LocalClient>('timeClients').toArray(),
			]);

			const blocksById = new Map(allBlocks.map((b) => [b.id, b]));
			const entries = allEntries
				.filter((e) => !e.deletedAt)
				.map((e) => toTimeEntry(e, blocksById.get(e.timeBlockId)))
				.filter((e) => e.date >= fromDate && e.date <= todayStr);

			const projects = allProjects.filter((p) => !p.deletedAt).map(toProject);
			const clients = allClients.filter((c) => !c.deletedAt).map(toClient);

			// Aggregate
			const totalSeconds = entries.reduce((s, e) => s + e.duration, 0);
			const billableSeconds = entries
				.filter((e) => e.isBillable)
				.reduce((s, e) => s + e.duration, 0);

			// By project
			const byProject = new Map<string, number>();
			for (const e of entries) {
				const key = e.projectId ?? '_none';
				byProject.set(key, (byProject.get(key) ?? 0) + e.duration);
			}

			const projectBreakdown = [...byProject.entries()]
				.sort((a, b) => b[1] - a[1])
				.map(([projId, secs]) => {
					const proj = projects.find((p) => p.id === projId);
					const client = proj?.clientId ? clients.find((c) => c.id === proj.clientId) : null;
					return {
						project: proj?.name ?? 'Ohne Projekt',
						client: client?.name ?? null,
						duration: formatDurationCompact(secs),
						seconds: secs,
					};
				});

			return {
				success: true,
				data: {
					period,
					from: fromDate,
					to: todayStr,
					entries: entries.length,
					total: formatDurationCompact(totalSeconds),
					totalSeconds,
					billable: formatDurationCompact(billableSeconds),
					billableSeconds,
					byProject: projectBreakdown,
				},
				message: `${period}: ${formatDurationCompact(totalSeconds)} gesamt (${formatDurationCompact(billableSeconds)} abrechenbar), ${entries.length} Eintraege`,
			};
		},
	},

	{
		name: 'list_projects',
		module: 'times',
		description: 'Listet alle aktiven Zeiterfassungs-Projekte mit Kunden-Info auf.',
		parameters: [],
		async execute() {
			const [allProjects, allClients] = await Promise.all([
				db.table<LocalProject>('timeProjects').toArray(),
				db.table<LocalClient>('timeClients').toArray(),
			]);

			const clients = allClients.filter((c) => !c.deletedAt).map(toClient);
			const projects = allProjects
				.filter((p) => !p.deletedAt && !p.isArchived)
				.map(toProject)
				.map((p) => {
					const client = p.clientId ? clients.find((c) => c.id === p.clientId) : null;
					return {
						id: p.id,
						name: p.name,
						client: client?.name ?? null,
						isBillable: p.isBillable,
						color: p.color,
					};
				});

			return {
				success: true,
				data: projects,
				message: `${projects.length} aktive Projekte`,
			};
		},
	},
];
