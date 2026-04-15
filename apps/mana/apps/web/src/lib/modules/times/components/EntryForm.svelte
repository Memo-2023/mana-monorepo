<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { timeEntryTable } from '$lib/modules/times/collections';
	import { createBlock } from '$lib/data/time-blocks/service';
	import { X, CurrencyDollar } from '@mana/shared-icons';
	import { TagField } from '@mana/shared-ui';
	import type { Project, Client } from '$lib/modules/times/types';
	import {
		parseMultiEntryInput,
		resolveEntryIds,
		formatParsedEntryPreview,
	} from '$lib/modules/times/utils/entry-parser';

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
	let selectedTagIds = $state<string[]>([]);

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

			const entryId = crypto.randomUUID();
			const entryDate = resolved.date ? new Date(resolved.date).toISOString().split('T')[0] : date;
			const startDate = resolved.startTime || `${entryDate}T00:00:00`;
			const endDate = resolved.endTime || null;

			// Create TimeBlock first
			const timeBlockId = await createBlock({
				startDate,
				endDate,
				kind: 'logged',
				type: 'timeEntry',
				sourceModule: 'times',
				sourceId: entryId,
				title: resolved.description || 'Time Entry',
				projectId: resolved.projectId || null,
			});

			await timeEntryTable.add({
				id: entryId,
				timeBlockId,
				projectId: resolved.projectId || null,
				clientId: project?.clientId ?? null,
				description: resolved.description,
				duration: totalSeconds,
				isBillable: resolved.isBillable ?? isBillable,
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
		selectedTagIds = [];
	}

	async function handleSubmit() {
		const totalSeconds = durationHours * 3600 + durationMinutes * 60;
		if (totalSeconds <= 0) return;

		const project = projectId ? allProjects.value.find((p) => p.id === projectId) : null;
		const entryId = crypto.randomUUID();

		// Create TimeBlock first
		const timeBlockId = await createBlock({
			startDate: `${date}T00:00:00`,
			endDate: null,
			kind: 'logged',
			type: 'timeEntry',
			sourceModule: 'times',
			sourceId: entryId,
			title: description || 'Time Entry',
			projectId: projectId || null,
		});

		await timeEntryTable.add({
			id: entryId,
			timeBlockId,
			projectId: projectId || null,
			clientId: project?.clientId ?? null,
			description,
			duration: totalSeconds,
			isBillable,
			tags: selectedTagIds,
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
			class="w-full max-w-lg rounded-t-2xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-6 shadow-xl sm:rounded-2xl"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-[hsl(var(--color-foreground))]">
					{$_('entry.manual')}
				</h2>
				<button
					onclick={onClose}
					class="rounded-lg p-1 text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
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
					class="w-full rounded-lg border border-dashed border-[hsl(var(--color-border))] bg-[hsl(var(--color-muted)/0.3)] px-4 py-2.5 text-sm text-[hsl(var(--color-foreground))] placeholder:text-xs placeholder:text-[hsl(var(--color-muted-foreground))] focus:border-solid focus:border-[hsl(var(--color-primary)/0.5)] focus:bg-[hsl(var(--color-input))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary)/0.1)]"
				/>
				{#if quickPreview}
					<div class="mt-1 px-1 text-[0.7rem] text-[hsl(var(--color-muted-foreground))]">
						{quickPreview}
					</div>
				{/if}
			</div>

			<div class="mb-3 flex items-center gap-2">
				<div class="h-px flex-1 bg-[hsl(var(--color-border))]"></div>
				<span class="text-[0.65rem] text-[hsl(var(--color-muted-foreground))]">oder manuell</span>
				<div class="h-px flex-1 bg-[hsl(var(--color-border))]"></div>
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
					class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-4 py-2.5 text-sm text-[hsl(var(--color-foreground))] focus:border-[hsl(var(--color-primary))] focus:outline-none"
				/>

				<!-- Project -->
				<select
					value={projectId}
					onchange={(e) => handleProjectChange((e.target as HTMLSelectElement).value)}
					class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2.5 text-sm text-[hsl(var(--color-foreground))]"
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
					class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-4 py-2.5 text-sm text-[hsl(var(--color-foreground))]"
				/>

				<!-- Quick Duration Buttons -->
				<div>
					<span class="mb-1.5 block text-xs font-medium text-[hsl(var(--color-muted-foreground))]">
						{$_('entry.duration')}
					</span>
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
									? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary)/0.1)] text-[hsl(var(--color-primary))]'
									: 'border-[hsl(var(--color-border))] text-[hsl(var(--color-muted-foreground))] hover:border-[hsl(var(--color-primary)/0.5)]'}"
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
							class="w-16 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-center text-sm text-[hsl(var(--color-foreground))]"
						/>
						<span class="text-xs text-[hsl(var(--color-muted-foreground))]">h</span>
						<input
							type="number"
							bind:value={durationMinutes}
							min="0"
							max="59"
							step="5"
							class="w-16 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-center text-sm text-[hsl(var(--color-foreground))]"
						/>
						<span class="text-xs text-[hsl(var(--color-muted-foreground))]">min</span>
					</div>
				</div>

				<!-- Billable -->
				<div class="flex items-center gap-3">
					<button
						type="button"
						onclick={() => (isBillable = !isBillable)}
						class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors {isBillable
							? 'bg-[hsl(var(--color-primary)/0.1)] text-[hsl(var(--color-primary))]'
							: 'text-[hsl(var(--color-muted-foreground))]'}"
					>
						<CurrencyDollar size={16} />
						{isBillable ? $_('entry.billable') : $_('entry.notBillable')}
					</button>
				</div>

				<!-- Tags -->
				<div>
					<span class="mb-1.5 block text-xs font-medium text-[hsl(var(--color-muted-foreground))]"
						>Tags</span
					>
					<TagField
						tags={allTags.value}
						selectedIds={selectedTagIds}
						onChange={(ids) => (selectedTagIds = ids)}
					/>
				</div>

				<!-- Submit -->
				<div class="flex gap-2">
					<button
						type="button"
						onclick={onClose}
						class="flex-1 rounded-lg border border-[hsl(var(--color-border))] py-2.5 text-sm text-[hsl(var(--color-muted-foreground))]"
					>
						{$_('common.cancel')}
					</button>
					<button
						type="submit"
						class="flex-1 rounded-lg bg-[hsl(var(--color-primary))] py-2.5 text-sm font-medium text-[hsl(var(--color-primary-foreground))]"
					>
						{$_('common.create')}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
