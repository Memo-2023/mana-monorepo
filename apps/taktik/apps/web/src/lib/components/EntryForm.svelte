<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { timeEntryCollection } from '$lib/data/local-store';
	import type { Project, Client } from '@taktik/shared';

	let {
		visible = false,
		onClose,
	}: {
		visible: boolean;
		onClose: () => void;
	} = $props();

	const allProjects = getContext<{ value: Project[] }>('projects');
	const allClients = getContext<{ value: Client[] }>('clients');

	let description = $state('');
	let projectId = $state('');
	let date = $state(new Date().toISOString().split('T')[0]);
	let durationHours = $state(1);
	let durationMinutes = $state(0);
	let isBillable = $state(false);

	let activeProjects = $derived(
		allProjects.value.filter((p) => !p.isArchived).sort((a, b) => a.order - b.order)
	);

	function resetForm() {
		description = '';
		projectId = '';
		date = new Date().toISOString().split('T')[0];
		durationHours = 1;
		durationMinutes = 0;
		isBillable = false;
	}

	async function handleSubmit() {
		const totalSeconds = durationHours * 3600 + durationMinutes * 60;
		if (totalSeconds <= 0) return;

		const project = projectId ? allProjects.value.find((p) => p.id === projectId) : null;

		await timeEntryCollection.insert({
			id: crypto.randomUUID(),
			projectId: projectId || null,
			clientId: project?.clientId ?? null,
			description,
			date,
			startTime: null,
			endTime: null,
			duration: totalSeconds,
			isBillable,
			isRunning: false,
			tags: [],
			billingRate: null,
			visibility: 'private',
			guildId: null,
			source: { app: 'manual' },
		});

		resetForm();
		onClose();
	}

	function handleProjectChange(id: string) {
		projectId = id;
		const project = allProjects.value.find((p) => p.id === id);
		if (project) {
			isBillable = project.isBillable;
		}
	}

	// Quick duration buttons
	const quickDurations = [
		{ label: '15m', h: 0, m: 15 },
		{ label: '30m', h: 0, m: 30 },
		{ label: '1h', h: 1, m: 0 },
		{ label: '1.5h', h: 1, m: 30 },
		{ label: '2h', h: 2, m: 0 },
		{ label: '4h', h: 4, m: 0 },
	];
</script>

{#if visible}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="w-full max-w-lg rounded-t-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xl sm:rounded-2xl"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">
					{$_('entry.manual')}
				</h2>
				<button
					onclick={onClose}
					class="rounded-lg p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-4"
			>
				<!-- Description -->
				<input
					type="text"
					bind:value={description}
					placeholder={$_('entry.description')}
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
				/>

				<!-- Project -->
				<select
					value={projectId}
					onchange={(e) => handleProjectChange((e.target as HTMLSelectElement).value)}
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2.5 text-sm text-[hsl(var(--foreground))]"
				>
					<option value="">{$_('project.internal')}</option>
					{#each activeProjects as proj}
						<option value={proj.id}>
							{proj.name}
							{#if proj.clientId}
								{@const client = allClients.value.find((c) => c.id === proj.clientId)}
								{#if client}
									· {client.name}{/if}
							{/if}
						</option>
					{/each}
				</select>

				<!-- Date -->
				<input
					type="date"
					bind:value={date}
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))]"
				/>

				<!-- Quick Duration Buttons -->
				<div>
					<label class="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
						{$_('entry.duration')}
					</label>
					<div class="mb-2 flex flex-wrap gap-2">
						{#each quickDurations as qd}
							<button
								type="button"
								onclick={() => {
									durationHours = qd.h;
									durationMinutes = qd.m;
								}}
								class="rounded-lg border px-3 py-1.5 text-xs transition-colors {durationHours ===
									qd.h && durationMinutes === qd.m
									? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
									: 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.5)]'}"
							>
								{qd.label}
							</button>
						{/each}
					</div>

					<!-- Custom Duration -->
					<div class="flex items-center gap-2">
						<input
							type="number"
							bind:value={durationHours}
							min="0"
							max="24"
							class="w-16 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-center text-sm text-[hsl(var(--foreground))]"
						/>
						<span class="text-xs text-[hsl(var(--muted-foreground))]">h</span>
						<input
							type="number"
							bind:value={durationMinutes}
							min="0"
							max="59"
							step="5"
							class="w-16 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-center text-sm text-[hsl(var(--foreground))]"
						/>
						<span class="text-xs text-[hsl(var(--muted-foreground))]">min</span>
					</div>
				</div>

				<!-- Billable -->
				<div class="flex items-center gap-3">
					<button
						type="button"
						onclick={() => (isBillable = !isBillable)}
						class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors {isBillable
							? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
							: 'text-[hsl(var(--muted-foreground))]'}"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						{isBillable ? $_('entry.billable') : $_('entry.notBillable')}
					</button>
				</div>

				<!-- Submit -->
				<div class="flex gap-2">
					<button
						type="button"
						onclick={onClose}
						class="flex-1 rounded-lg border border-[hsl(var(--border))] py-2.5 text-sm text-[hsl(var(--muted-foreground))]"
					>
						{$_('common.cancel')}
					</button>
					<button
						type="submit"
						class="flex-1 rounded-lg bg-[hsl(var(--primary))] py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))]"
					>
						{$_('common.create')}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
