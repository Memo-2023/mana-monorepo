<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	/**
	 * TasksTodayWidget — Aufgaben fällig heute oder überfällig.
	 *
	 * Liest direkt aus der unified IndexedDB (tasks table).
	 * Reaktiv via Dexie liveQuery — aktualisiert automatisch.
	 */

	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import type { BaseRecord } from '@mana/local-store';

	interface Task extends BaseRecord {
		title: string;
		priority: 'low' | 'medium' | 'high' | 'urgent';
		isCompleted: boolean;
		completedAt?: string | null;
		dueDate?: string | null;
		dueTime?: string | null;
		order: number;
		subtasks?: { id: string; title: string; isCompleted: boolean; order: number }[] | null;
	}

	const priorityColors: Record<string, string> = {
		urgent: '#ef4444',
		high: '#f97316',
		medium: '#eab308',
		low: '#22c55e',
	};

	const todayStr = new Date().toISOString().slice(0, 10);

	let tasks: Task[] = $state([]);
	let loading = $state(true);

	$effect(() => {
		const sub = liveQuery(async () => {
			const all = await db.table<Task>('tasks').toArray();
			const visible = all.filter((t) => {
				if (t.isCompleted || t.deletedAt) return false;
				if (!t.dueDate) return false;
				return t.dueDate.slice(0, 10) <= todayStr;
			});
			// task.title is encrypted on disk; decrypt before rendering.
			const decrypted = await decryptRecords('tasks', visible);
			return decrypted.sort((a, b) => a.order - b.order);
		}).subscribe({
			next: (val) => {
				tasks = val;
				loading = false;
			},
			error: () => {
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});

	const MAX_DISPLAY = 5;
	const displayed = $derived(tasks.slice(0, MAX_DISPLAY));
	const remaining = $derived(Math.max(0, tasks.length - MAX_DISPLAY));

	function isOverdue(dueDate: string): boolean {
		return dueDate.slice(0, 10) < todayStr;
	}

	function formatDue(dueDate: string): string {
		if (dueDate.slice(0, 10) === todayStr) return 'Heute';
		const d = new Date(dueDate);
		return formatDate(d, { day: 'numeric', month: 'short' });
	}

	async function toggleComplete(task: Task) {
		await db.table('tasks').update(task.id, {
			isCompleted: true,
			completedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	}
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">Aufgaben heute</h3>
		{#if tasks.length > 0}
			<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
				{tasks.length}
			</span>
		{/if}
	</div>

	{#if loading}
		<div class="space-y-2">
			{#each Array(4) as _}
				<div class="h-8 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if tasks.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">&#127881;</div>
			<p class="text-sm text-muted-foreground">Keine Aufgaben fällig — alles erledigt!</p>
		</div>
	{:else}
		<div class="space-y-1">
			{#each displayed as task (task.id)}
				<a
					href="/todo"
					class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
				>
					<div
						class="h-2 w-2 flex-shrink-0 rounded-full"
						style="background-color: {priorityColors[task.priority] || priorityColors.medium}"
					></div>

					<button
						onclick={(e) => {
							e.stopPropagation();
							e.preventDefault();
							toggleComplete(task);
						}}
						class="flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded border-2 border-muted-foreground/40 transition-colors hover:border-primary/60"
						aria-label="Als erledigt markieren"
					></button>

					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<p class="truncate text-sm font-medium">{task.title}</p>
							{#if task.dueDate}
								<span
									class="flex-shrink-0 text-xs {isOverdue(task.dueDate)
										? 'text-red-500 font-semibold'
										: 'text-muted-foreground'}"
								>
									{formatDue(task.dueDate)}
								</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}

			{#if remaining > 0}
				<a
					href="/todo"
					class="block rounded-lg py-2 text-center text-sm text-primary hover:bg-primary/5"
				>
					+{remaining} weitere Aufgaben
				</a>
			{/if}
		</div>
	{/if}
</div>
