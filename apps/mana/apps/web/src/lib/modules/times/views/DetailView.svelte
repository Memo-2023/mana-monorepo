<!--
  Times — DetailView (inline editable time entry overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { db } from '$lib/data/database';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { toTimeEntry } from '../queries';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalTimeEntry, LocalProject, LocalClient, TimeEntry } from '../types';
	import type { LocalTimeBlock } from '$lib/data/time-blocks/types';

	let { params, goBack }: ViewProps = $props();
	let entryId = $derived(params.entryId as string);

	let editDescription = $state('');
	let editDate = $state('');
	let editDurationH = $state(0);
	let editDurationM = $state(0);
	let editDurationS = $state(0);
	let editProjectId = $state<string | null>(null);
	let editBillable = $state(false);

	const detail = useDetailEntity<TimeEntry>({
		id: () => entryId,
		loader: async (id) => {
			const local = await db.table<LocalTimeEntry>('timeEntries').get(id);
			if (!local) return null;
			const block = local.timeBlockId
				? await db.table<LocalTimeBlock>('timeBlocks').get(local.timeBlockId)
				: null;
			return toTimeEntry(local, block);
		},
		onLoad: (val) => {
			editDescription = val.description ?? '';
			editDate = val.date ?? '';
			const dur = val.duration ?? 0;
			editDurationH = Math.floor(dur / 3600);
			editDurationM = Math.floor((dur % 3600) / 60);
			editDurationS = dur % 60;
			editProjectId = val.projectId ?? null;
			editBillable = val.isBillable;
		},
	});

	const projectsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalProject>('timesProjects').toArray();
		return all.filter((p) => !p.deletedAt && !p.isArchived);
	}, [] as LocalProject[]);

	const clientsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalClient>('timeClients').toArray();
		return all.filter((c) => !c.deletedAt);
	}, [] as LocalClient[]);

	const projects = $derived(projectsQuery.value);
	const clients = $derived(clientsQuery.value);

	let selectedProject = $derived(
		editProjectId ? projects.find((p) => p.id === editProjectId) : null
	);

	let selectedClient = $derived(
		selectedProject?.clientId ? clients.find((c) => c.id === selectedProject!.clientId) : null
	);

	function durationSeconds(): number {
		return editDurationH * 3600 + editDurationM * 60 + editDurationS;
	}

	function fmtTime(iso?: string | null): string {
		if (!iso) return '';
		const d = new Date(iso);
		return d.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });
	}

	async function saveField() {
		detail.blur();
		await db.table('timeEntries').update(entryId, {
			description: editDescription.trim(),
			date: editDate,
			duration: durationSeconds(),
			projectId: editProjectId,
			clientId: selectedProject?.clientId ?? null,
			isBillable: editBillable,
		});
	}

	async function handleProjectChange(projectId: string | null) {
		editProjectId = projectId;
		const project = projectId ? projects.find((p) => p.id === projectId) : null;
		if (project) editBillable = project.isBillable;
		await db.table('timeEntries').update(entryId, {
			projectId: projectId,
			clientId: project?.clientId ?? null,
			isBillable: project?.isBillable ?? editBillable,
		});
	}

	async function handleBillableChange() {
		editBillable = !editBillable;
		await db.table('timeEntries').update(entryId, { isBillable: editBillable });
	}

	async function deleteEntry() {
		await db.table('timeEntries').update(entryId, { deletedAt: new Date().toISOString() });
		goBack();
	}
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Eintrag nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel="Eintrag wirklich löschen?"
	onConfirmDelete={deleteEntry}
>
	{#snippet body(entry)}
		<input
			class="title-input"
			bind:value={editDescription}
			onfocus={detail.focus}
			onblur={saveField}
			placeholder="Beschreibung..."
		/>

		{#if entry.startTime || entry.endTime}
			<div class="time-range">
				{#if entry.startTime}{fmtTime(entry.startTime)}{/if}
				{#if entry.startTime && entry.endTime}–{/if}
				{#if entry.endTime}{fmtTime(entry.endTime)}{/if}
			</div>
		{/if}

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Datum</span>
				<input
					type="date"
					class="prop-input"
					bind:value={editDate}
					onfocus={detail.focus}
					onblur={saveField}
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Dauer</span>
				<div class="duration-inputs">
					<label class="dur-field">
						<input
							type="number"
							min="0"
							class="dur-input"
							bind:value={editDurationH}
							onfocus={detail.focus}
							onblur={saveField}
						/>
						<span class="dur-unit">h</span>
					</label>
					<label class="dur-field">
						<input
							type="number"
							min="0"
							max="59"
							class="dur-input"
							bind:value={editDurationM}
							onfocus={detail.focus}
							onblur={saveField}
						/>
						<span class="dur-unit">m</span>
					</label>
					<label class="dur-field">
						<input
							type="number"
							min="0"
							max="59"
							class="dur-input"
							bind:value={editDurationS}
							onfocus={detail.focus}
							onblur={saveField}
						/>
						<span class="dur-unit">s</span>
					</label>
				</div>
			</div>

			<div class="prop-row">
				<span class="prop-label">Projekt</span>
				<select
					class="prop-select"
					value={editProjectId ?? ''}
					onchange={(e) => {
						const val = (e.target as HTMLSelectElement).value;
						handleProjectChange(val || null);
					}}
				>
					<option value="">Kein Projekt</option>
					{#each projects as project}
						<option value={project.id}>
							{project.name}
							{#if project.clientId}
								{@const client = clients.find((c) => c.id === project.clientId)}
								{#if client}· {client.name}{/if}
							{/if}
						</option>
					{/each}
				</select>
			</div>

			<div class="prop-row">
				<span class="prop-label">Abrechenbar</span>
				<button class="toggle-btn" class:active={editBillable} onclick={handleBillableChange}>
					{editBillable ? 'Ja' : 'Nein'}
				</button>
			</div>

			{#if selectedClient}
				<div class="prop-row">
					<span class="prop-label">Kunde</span>
					<span class="prop-value">{selectedClient.name}</span>
				</div>
			{/if}
		</div>

		<div class="meta">
			{#if entry.createdAt}
				<span>Erstellt: {new Date(entry.createdAt).toLocaleDateString('de')}</span>
			{/if}
			{#if entry.source?.app}
				<span>Quelle: {entry.source.app}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>

<style>
	.time-range {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	.duration-inputs {
		display: flex;
		gap: 0.375rem;
		align-items: center;
	}
	.dur-field {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}
	.dur-input {
		width: 2.5rem;
		font-size: 0.8125rem;
		text-align: right;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
	}
	.dur-input:hover,
	.dur-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	.dur-unit {
		font-size: 0.6875rem;
		color: #9ca3af;
	}
	:global(.dark) .dur-input {
		color: #e5e7eb;
	}
	:global(.dark) .dur-input:hover,
	:global(.dark) .dur-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
</style>
