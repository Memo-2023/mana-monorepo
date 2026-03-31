<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { timeEntryCollection } from '$lib/data/local-store';
	import { X, CurrencyDollar } from '@manacore/shared-icons';
	import type { Project, Client } from '@times/shared';
	import {
		parseMultiEntryInput,
		resolveEntryIds,
		formatParsedEntryPreview,
	} from '$lib/utils/entry-parser';
	import { getContext as getCtx } from 'svelte';

	let {
		visible = false,
		onClose,
	}: {
		visible: boolean;
		onClose: () => void;
	} = $props();

	const allProjects = getContext<{ value: Project[] }>('projects');
	const allClients = getContext<{ value: Client[] }>('clients');
	const allTags = getContext<{ value: { id: string; name: string }[] }>('tags');

	let description = $state('');
	let projectId = $state('');
	let date = $state(new Date().toISOString().split('T')[0]);
	let durationHours = $state(1);
	let durationMinutes = $state(0);
	let isBillable = $state(false);

	// Quick-input state
	let quickInput = $state('');
	let quickPreview = $state('');
	let quickEntryCount = $state(0);

	let activeProjects = $derived(
		allProjects.value.filter((p) => !p.isArchived).sort((a, b) => a.order - b.order)
	);

	function handleQuickInput(e: Event) {
		const text = (e.target as HTMLInputElement).value;
		quickInput = text;

		if (!text.trim()) {
			quickPreview = '';
			quickEntryCount = 0;
			return;
		}

		const entries = parseMultiEntryInput(text);
		quickEntryCount = entries.length;

		const previews = entries.map((e) => formatParsedEntryPreview(e)).filter(Boolean);
		if (entries.length > 1) previews.unshift(`${entries.length} Einträge`);
		quickPreview = previews.join(' · ');
	}

	async function handleQuickSubmit() {
		if (!quickInput.trim()) return;

		const entries = parseMultiEntryInput(quickInput);
		const projects = allProjects.value.map((p) => ({ id: p.id, name: p.name }));
		const tags = allTags?.value?.map((t) => ({ id: t.id, name: t.name })) ?? [];

		for (const parsed of entries) {
			const resolved = resolveEntryIds(parsed, projects, tags);

			const totalSeconds = resolved.duration || durationHours * 3600 + durationMinutes * 60;
			if (totalSeconds <= 0) continue;

			const project = resolved.projectId
				? allProjects.value.find((p) => p.id === resolved.projectId)
				: null;

			await timeEntryCollection.insert({
				id: crypto.randomUUID(),
				projectId: resolved.projectId || null,
				clientId: project?.clientId ?? null,
				description: resolved.description,
				date: resolved.date ? new Date(resolved.date).toISOString().split('T')[0] : date,
				startTime: resolved.startTime || null,
				endTime: resolved.endTime || null,
				duration: totalSeconds,
				isBillable: resolved.isBillable ?? isBillable,
				isRunning: false,
				tags: resolved.tagIds,
				billingRate: null,
				visibility: 'private',
				guildId: null,
				source: { app: 'manual' },
			});
		}

		quickInput = '';
		quickPreview = '';
		quickEntryCount = 0;
		resetForm();
		onClose();
	}

	function handleQuickKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleQuickSubmit();
		}
	}

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
					<X size={20} />
				</button>
			</div>

			<!-- Quick Input Bar -->
			<div class="mb-4">
				<input
					type="text"
					value={quickInput}
					oninput={handleQuickInput}
					onkeydown={handleQuickKeydown}
					placeholder="Schnelleingabe: Meeting 2h @Projekt $; Review 1h"
					class="w-full rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-xs placeholder:text-[hsl(var(--muted-foreground))] focus:border-solid focus:border-[hsl(var(--primary)/0.5)] focus:bg-[hsl(var(--input))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.1)]"
				/>
				{#if quickPreview}
					<div class="mt-1 px-1 text-[0.7rem] text-[hsl(var(--muted-foreground))]">
						{quickPreview}
					</div>
				{/if}
			</div>

			<div class="mb-3 flex items-center gap-2">
				<div class="h-px flex-1 bg-[hsl(var(--border))]"></div>
				<span class="text-[0.65rem] text-[hsl(var(--muted-foreground))]">oder manuell</span>
				<div class="h-px flex-1 bg-[hsl(var(--border))]"></div>
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
						<CurrencyDollar size={16} />
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
