<!--
  Times — DetailView (inline editable time entry overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { Trash } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalTimeEntry, LocalProject, LocalClient } from '../types';

	let { navigate, goBack, params }: ViewProps = $props();
	let entryId = $derived(params.entryId as string);

	let entry = $state<LocalTimeEntry | null>(null);
	let projects = $state<LocalProject[]>([]);
	let clients = $state<LocalClient[]>([]);
	let confirmDelete = $state(false);

	// Edit fields
	let editDescription = $state('');
	let editDate = $state('');
	let editDurationH = $state(0);
	let editDurationM = $state(0);
	let editDurationS = $state(0);
	let editProjectId = $state<string | null>(null);
	let editBillable = $state(false);

	let focused = $state(false);

	$effect(() => {
		entryId;
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(() => db.table<LocalTimeEntry>('timeEntries').get(entryId)).subscribe(
			(val) => {
				entry = val ?? null;
				if (val && !focused) {
					editDescription = val.description ?? '';
					editDate = val.date ?? '';
					const dur = val.duration ?? 0;
					editDurationH = Math.floor(dur / 3600);
					editDurationM = Math.floor((dur % 3600) / 60);
					editDurationS = dur % 60;
					editProjectId = val.projectId ?? null;
					editBillable = val.isBillable;
				}
			}
		);
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () =>
			db
				.table<LocalProject>('timesProjects')
				.toArray()
				.then((all) => all.filter((p) => !p.deletedAt && !p.isArchived))
		).subscribe((val) => {
			projects = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () =>
			db
				.table<LocalClient>('timeClients')
				.toArray()
				.then((all) => all.filter((c) => !c.deletedAt))
		).subscribe((val) => {
			clients = val ?? [];
		});
		return () => sub.unsubscribe();
	});

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
		focused = false;
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

<div class="detail-view">
	{#if !entry}
		<p class="empty">Eintrag nicht gefunden</p>
	{:else}
		<!-- Description -->
		<div class="section">
			<input
				class="title-input"
				bind:value={editDescription}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Beschreibung..."
			/>
		</div>

		<!-- Time info -->
		{#if entry.startTime || entry.endTime}
			<div class="time-range">
				{#if entry.startTime}{fmtTime(entry.startTime)}{/if}
				{#if entry.startTime && entry.endTime}
					&ndash;
				{/if}
				{#if entry.endTime}{fmtTime(entry.endTime)}{/if}
			</div>
		{/if}

		<!-- Properties -->
		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Datum</span>
				<input
					type="date"
					class="prop-input"
					bind:value={editDate}
					onfocus={() => (focused = true)}
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
							onfocus={() => (focused = true)}
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
							onfocus={() => (focused = true)}
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
							onfocus={() => (focused = true)}
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
								{#if client}
									&middot; {client.name}{/if}
							{/if}
						</option>
					{/each}
				</select>
			</div>

			<div class="prop-row">
				<span class="prop-label">Abrechenbar</span>
				<button class="billable-toggle" class:active={editBillable} onclick={handleBillableChange}>
					{editBillable ? 'Ja' : 'Nein'}
				</button>
			</div>

			{#if selectedProject}
				<div class="prop-row">
					<span class="prop-label">Projekt</span>
					<div class="flex items-center gap-1.5">
						<span class="color-dot" style="background-color: {selectedProject.color}"></span>
						<span class="prop-value">{selectedProject.name}</span>
					</div>
				</div>
			{/if}

			{#if selectedClient}
				<div class="prop-row">
					<span class="prop-label">Kunde</span>
					<span class="prop-value">{selectedClient.name}</span>
				</div>
			{/if}
		</div>

		<!-- Metadata -->
		<div class="meta">
			{#if entry.createdAt}
				<span>Erstellt: {new Date(entry.createdAt).toLocaleDateString('de')}</span>
			{/if}
			{#if entry.source?.app}
				<span>Quelle: {entry.source.app}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Eintrag wirklich loschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deleteEntry}>Loschen</button>
					<button class="action-btn" onclick={() => (confirmDelete = false)}>Abbrechen</button>
				</div>
			{:else}
				<button class="action-btn danger-subtle" onclick={() => (confirmDelete = true)}>
					<Trash size={14} /> Loschen
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.detail-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		height: 100%;
		overflow-y: auto;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}

	/* Title */
	.title-input {
		width: 100%;
		font-size: 1.125rem;
		font-weight: 600;
		border: none;
		background: transparent;
		outline: none;
		color: #374151;
		padding: 0;
	}
	.title-input:focus {
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .title-input {
		color: #f3f4f6;
	}
	:global(.dark) .title-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* Time range */
	.time-range {
		font-size: 0.8125rem;
		color: #9ca3af;
		font-variant-numeric: tabular-nums;
	}

	/* Properties */
	.properties {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.prop-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0;
	}
	.prop-label {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	.prop-value {
		font-size: 0.8125rem;
		color: #374151;
	}
	:global(.dark) .prop-value {
		color: #e5e7eb;
	}
	.prop-select,
	.prop-input {
		font-size: 0.8125rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
		transition: border-color 0.15s;
	}
	.prop-select:hover,
	.prop-input:hover,
	.prop-select:focus,
	.prop-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .prop-select,
	:global(.dark) .prop-input {
		color: #e5e7eb;
	}
	:global(.dark) .prop-select:hover,
	:global(.dark) .prop-input:hover,
	:global(.dark) .prop-select:focus,
	:global(.dark) .prop-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* Duration inputs */
	.duration-inputs {
		display: flex;
		gap: 0.375rem;
	}
	.dur-field {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}
	.dur-input {
		width: 2.5rem;
		font-size: 0.8125rem;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
		text-align: right;
		font-variant-numeric: tabular-nums;
		-moz-appearance: textfield;
	}
	.dur-input::-webkit-outer-spin-button,
	.dur-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.dur-input:hover,
	.dur-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .dur-input {
		color: #e5e7eb;
	}
	:global(.dark) .dur-input:hover,
	:global(.dark) .dur-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	.dur-unit {
		font-size: 0.6875rem;
		color: #9ca3af;
	}

	/* Billable toggle */
	.billable-toggle {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}
	.billable-toggle.active {
		border-color: #22c55e;
		color: #22c55e;
		background: rgba(34, 197, 94, 0.08);
	}
	:global(.dark) .billable-toggle {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .billable-toggle.active {
		border-color: #22c55e;
	}

	/* Color dot */
	.color-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	/* Section */
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	/* Meta & actions */
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		font-size: 0.6875rem;
		color: #9ca3af;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .meta {
		border-color: rgba(255, 255, 255, 0.06);
	}
	.danger-zone {
		padding-top: 0.5rem;
	}
	.confirm-text {
		font-size: 0.8125rem;
		color: #ef4444;
		margin: 0 0 0.5rem;
	}
	.confirm-actions {
		display: flex;
		gap: 0.5rem;
	}
	.action-btn {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: transparent;
		font-size: 0.75rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}
	.action-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #374151;
	}
	.action-btn.danger {
		background: #ef4444;
		border-color: #ef4444;
		color: white;
	}
	.action-btn.danger-subtle {
		color: #ef4444;
		border-color: transparent;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	:global(.dark) .action-btn {
		border-color: rgba(255, 255, 255, 0.1);
		color: #9ca3af;
	}
	:global(.dark) .action-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e5e7eb;
	}

	@media (max-width: 640px) {
		.detail-view {
			padding: 0.75rem;
		}
		.action-btn,
		.billable-toggle {
			min-height: 44px;
		}
		.prop-select,
		.prop-input,
		.dur-input {
			min-height: 44px;
		}
	}
</style>
