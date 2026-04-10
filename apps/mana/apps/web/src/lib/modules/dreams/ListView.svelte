<!--
  Dreams — Workbench ListView
  Quick capture, inline edit, mood + lucid + symbol affordances.
-->
<script lang="ts">
	import {
		computeInsights,
		formatDreamDate,
		groupByMonth,
		searchDreams,
		useAllDreams,
	} from './queries';
	import { dreamsStore } from './stores/dreams.svelte';
	import VoiceCaptureBar from '$lib/components/voice/VoiceCaptureBar.svelte';
	import { MOOD_COLORS, MOOD_LABELS, type Dream, type DreamMood, type SleepQuality } from './types';
	import type { ViewProps } from '$lib/app-registry';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
	import { PencilSimple, PushPin, Trash } from '@mana/shared-icons';
	import SymbolsView from './views/SymbolsView.svelte';

	let { navigate, goBack, params }: ViewProps = $props();

	type ViewMode = 'list' | 'symbols';
	let viewMode = $state<ViewMode>('list');

	let dreams$ = useAllDreams();
	let dreams = $derived(dreams$.value);

	type FilterMode = 'all' | 'lucid' | 'nightmare' | 'recurring';
	let filterMode = $state<FilterMode>('all');
	let symbolFilter = $state<string | null>(null);

	let searchQuery = $state('');
	let editingId = $state<string | null>(null);
	let editTitle = $state('');
	let editContent = $state('');
	let editSymbols = $state('');
	let editMood = $state<DreamMood | null>(null);
	let editIsLucid = $state(false);
	let editIsRecurring = $state(false);
	let editDreamDate = $state('');
	let editBedtime = $state('');
	let editWakeTime = $state('');
	let editSleepQuality = $state<SleepQuality | null>(null);
	let newTitle = $state('');

	let filteredByMode = $derived.by(() => {
		switch (filterMode) {
			case 'lucid':
				return dreams.filter((d) => d.isLucid);
			case 'nightmare':
				return dreams.filter((d) => d.mood === 'albtraum');
			case 'recurring':
				return dreams.filter((d) => d.isRecurring);
			default:
				return dreams;
		}
	});
	let filteredBySymbol = $derived(
		symbolFilter ? filteredByMode.filter((d) => d.symbols?.includes(symbolFilter!)) : filteredByMode
	);
	let filtered = $derived(searchDreams(filteredBySymbol, searchQuery));

	// While the inline editor is open, the `dreams` array updates whenever the
	// transcript lands. If the user hasn't typed anything yet, fold the fresh
	// content into the edit buffer so they see the transcription appear inline.
	$effect(() => {
		if (!editingId) return;
		const live = dreams.find((d) => d.id === editingId);
		if (!live) return;
		if (!editContent.trim() && live.content.trim()) {
			editContent = live.content;
		}
	});
	let grouped = $derived(groupByMonth(filtered));
	let insights = $derived(computeInsights(dreams));

	function selectSymbol(name: string) {
		symbolFilter = symbolFilter === name ? null : name;
	}

	async function handleQuickCreate(e: KeyboardEvent) {
		if (e.key !== 'Enter' || !newTitle.trim()) return;
		e.preventDefault();
		const dream = await dreamsStore.createDream({ title: newTitle.trim() });
		newTitle = '';
		startEdit(dream);
	}

	function startEdit(dream: Dream) {
		if (editingId && editingId !== dream.id) saveEdit();
		editingId = dream.id;
		editTitle = dream.title ?? '';
		editContent = dream.content;
		editSymbols = (dream.symbols ?? []).join(', ');
		editMood = dream.mood;
		editIsLucid = dream.isLucid;
		editIsRecurring = dream.isRecurring;
		editDreamDate = dream.dreamDate;
		editBedtime = dream.bedtime ?? '';
		editWakeTime = dream.wakeTime ?? '';
		editSleepQuality = dream.sleepQuality;
	}

	async function saveEdit() {
		if (!editingId) return;
		const symbols = editSymbols
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		await dreamsStore.updateDream(editingId, {
			title: editTitle.trim() || null,
			content: editContent,
			symbols,
			mood: editMood,
			isLucid: editIsLucid,
			isRecurring: editIsRecurring,
			dreamDate: editDreamDate || new Date().toISOString().slice(0, 10),
			bedtime: editBedtime || null,
			wakeTime: editWakeTime || null,
			sleepQuality: editSleepQuality,
		});
		editingId = null;
	}

	function setSleepQuality(q: SleepQuality) {
		editSleepQuality = editSleepQuality === q ? null : q;
	}

	async function handleDelete(id: string) {
		await dreamsStore.deleteDream(id);
		if (editingId === id) editingId = null;
	}

	const ctxMenu = useItemContextMenu<Dream>();

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.state.target
			? [
					{
						id: 'edit',
						label: 'Bearbeiten',
						icon: PencilSimple,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) startEdit(target);
						},
					},
					{
						id: 'pin',
						label: ctxMenu.state.target.isPinned ? 'Lösen' : 'Pinnen',
						icon: PushPin,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) dreamsStore.togglePin(target.id);
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) handleDelete(target.id);
						},
					},
				]
			: []
	);

	const MOODS: DreamMood[] = ['angenehm', 'neutral', 'unangenehm', 'albtraum'];

	// ── Voice capture ─────────────────────────────────────────
	// All MediaRecorder + auth gating + error handling lives in
	// <VoiceCaptureBar> in $lib/components/voice/. This module just
	// passes the host-specific bits via props and a callback.
	async function handleVoiceComplete(blob: Blob, durationMs: number) {
		const dream = await dreamsStore.createFromVoice(blob, durationMs, 'de');
		// Open the dream so the user sees the transcript appear inline
		viewMode = 'list';
		startEdit(dream);
	}
</script>

<div class="app-view">
	<!-- View switcher -->
	<div class="view-tabs">
		<button class="view-tab" class:active={viewMode === 'list'} onclick={() => (viewMode = 'list')}>
			Träume
		</button>
		<button
			class="view-tab"
			class:active={viewMode === 'symbols'}
			onclick={() => (viewMode = 'symbols')}
		>
			Symbole
		</button>
	</div>

	{#if viewMode === 'symbols'}
		<SymbolsView
			onOpenDream={(d) => {
				viewMode = 'list';
				startEdit(d);
			}}
		/>
	{:else}
		<!-- Voice capture -->
		<VoiceCaptureBar
			idleLabel="Traum sprechen"
			feature="dreams-voice-capture"
			reason="Sprach-Aufnahmen werden verschlüsselt in deinem persönlichen Tagebuch gespeichert. Dafür brauchst du ein Mana-Konto."
			onComplete={handleVoiceComplete}
		/>

		<!-- Quick create -->
		<form onsubmit={(e) => e.preventDefault()} class="quick-add">
			<span class="add-icon">&#x1f319;</span>
			<input
				class="add-input"
				type="text"
				placeholder="Was hast du geträumt? (Enter)"
				bind:value={newTitle}
				onkeydown={handleQuickCreate}
			/>
		</form>

		<!-- Insights ribbon -->
		{#if insights.total > 0}
			<div class="insights">
				<span class="ins-stat">{insights.total} Träume</span>
				{#if insights.lucidCount > 0}
					<span class="ins-stat">&#x2728; {insights.lucidCount} Klarträume</span>
				{/if}
				{#each insights.topSymbols as sym}
					<button
						class="ins-symbol"
						class:active={symbolFilter === sym.name}
						onclick={() => selectSymbol(sym.name)}
					>
						{sym.name} · {sym.count}
					</button>
				{/each}
				{#if symbolFilter}
					<button class="ins-clear" onclick={() => (symbolFilter = null)}>×&nbsp;Filter</button>
				{/if}
			</div>
		{/if}

		<!-- Filter tabs -->
		{#if dreams.length > 0}
			<div class="filter-tabs">
				<button
					class="filter-tab"
					class:active={filterMode === 'all'}
					onclick={() => (filterMode = 'all')}
				>
					Alle
				</button>
				<button
					class="filter-tab"
					class:active={filterMode === 'lucid'}
					onclick={() => (filterMode = 'lucid')}
				>
					&#x2728; Klarträume
				</button>
				<button
					class="filter-tab"
					class:active={filterMode === 'nightmare'}
					onclick={() => (filterMode = 'nightmare')}
				>
					Albträume
				</button>
				<button
					class="filter-tab"
					class:active={filterMode === 'recurring'}
					onclick={() => (filterMode = 'recurring')}
				>
					Wiederkehrend
				</button>
			</div>
		{/if}

		<!-- Search -->
		{#if dreams.length > 5}
			<input
				class="search-input"
				type="text"
				placeholder="Träume durchsuchen..."
				bind:value={searchQuery}
			/>
		{/if}

		<!-- Dream list -->
		<div class="dream-list">
			{#each grouped as group (group.label)}
				<div class="month-label">{group.label}</div>
				{#each group.dreams as dream (dream.id)}
					{#if editingId === dream.id}
						<!-- Inline editor -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="dream-item editing"
							onkeydown={(e) => {
								if (e.key === 'Escape') saveEdit();
							}}
						>
							<!-- svelte-ignore a11y_autofocus -->
							<input
								class="ed-title"
								type="text"
								bind:value={editTitle}
								placeholder="Titel (optional)..."
								autofocus
							/>
							{#if dream.processingStatus === 'transcribing'}
								<div class="ed-status">
									<span class="ed-status-dots">●●●</span>
									Transkribiert deine Aufnahme…
								</div>
							{:else if dream.processingStatus === 'failed'}
								<div class="ed-status failed">
									Transkription fehlgeschlagen{dream.processingError
										? `: ${dream.processingError}`
										: ''}
								</div>
							{:else if dream.transcript && dream.transcriptModel}
								<div class="ed-status muted" title="STT-Pipeline, die den Transkript erzeugt hat">
									Transkribiert via <strong>{dream.transcriptModel}</strong>
								</div>
							{/if}
							<textarea
								class="ed-content"
								bind:value={editContent}
								placeholder="Erzähl mir den Traum..."
								rows="5"
							></textarea>
							<input
								class="ed-symbols"
								type="text"
								bind:value={editSymbols}
								placeholder="Symbole (Komma-getrennt): Wasser, Fliegen, Tür"
							/>

							<div class="ed-row">
								<div class="mood-picker">
									{#each MOODS as mood}
										<button
											class="mood-btn"
											class:active={editMood === mood}
											style="--mood-color: {MOOD_COLORS[mood]}"
											onclick={() => (editMood = editMood === mood ? null : mood)}
											title={MOOD_LABELS[mood]}
										>
											<span class="mood-dot"></span>
											{MOOD_LABELS[mood]}
										</button>
									{/each}
								</div>
							</div>

							<div class="ed-row sleep-row">
								<label class="ed-field">
									<span class="ed-label">Nacht</span>
									<input type="date" bind:value={editDreamDate} class="ed-input-sm" />
								</label>
								<label class="ed-field">
									<span class="ed-label">Ins Bett</span>
									<input type="time" bind:value={editBedtime} class="ed-input-sm" />
								</label>
								<label class="ed-field">
									<span class="ed-label">Aufgewacht</span>
									<input type="time" bind:value={editWakeTime} class="ed-input-sm" />
								</label>
							</div>

							<div class="ed-row">
								<div class="ed-field">
									<span class="ed-label">Schlafqualität</span>
									<div class="stars">
										{#each [1, 2, 3, 4, 5] as q}
											<button
												class="star"
												class:filled={editSleepQuality !== null && editSleepQuality >= q}
												onclick={() => setSleepQuality(q as SleepQuality)}
												aria-label={`${q} Sterne`}
											>
												★
											</button>
										{/each}
									</div>
								</div>
								<div class="toggles">
									<label class="lucid-toggle">
										<input type="checkbox" bind:checked={editIsLucid} />
										&#x2728; Klartraum
									</label>
									<label class="lucid-toggle">
										<input type="checkbox" bind:checked={editIsRecurring} />
										&#x21bb; Wiederkehrend
									</label>
								</div>
							</div>

							<div class="ed-actions">
								<button class="ed-btn danger" onclick={() => handleDelete(dream.id)}>Löschen</button
								>
								<button class="ed-btn primary" onclick={saveEdit}>Fertig</button>
							</div>
						</div>
					{:else}
						<!-- Dream row -->
						<div
							class="dream-item"
							role="button"
							tabindex="0"
							onclick={() => startEdit(dream)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									startEdit(dream);
								}
							}}
							oncontextmenu={(e) => ctxMenu.open(e, dream)}
						>
							{#if dream.mood}
								<span class="mood-dot-row" style="background: {MOOD_COLORS[dream.mood]}"></span>
							{:else}
								<span class="mood-dot-row empty"></span>
							{/if}

							<div class="dream-content">
								<div class="dream-top">
									<span class="dream-title">{dream.title || 'Traum ohne Titel'}</span>
									{#if dream.processingStatus === 'transcribing'}
										<span class="badge transcribing" title="Wird transkribiert…">●●●</span>
									{:else if dream.processingStatus === 'failed'}
										<span class="badge failed" title={dream.processingError ?? 'Fehler'}>!</span>
									{/if}
									{#if dream.isLucid}<span class="badge lucid">&#x2728;</span>{/if}
									{#if dream.isRecurring}<span class="badge">&#x21bb;</span>{/if}
									{#if dream.isPinned}<span class="badge">&#x1f4cc;</span>{/if}
									{#if dream.isPrivate}<span class="badge">&#x1f512;</span>{/if}
								</div>
								{#if dream.content}
									<p class="dream-preview">{dream.content.split('\n')[0]}</p>
								{/if}
								<div class="dream-meta">
									<span>{formatDreamDate(dream.dreamDate)}</span>
									{#if dream.transcriptModel}
										<span class="dot">·</span>
										<span class="stt-chip" title="STT-Pipeline">
											&#x1f3a4; {dream.transcriptModel}
										</span>
									{/if}
									{#if dream.symbols.length > 0}
										<span class="dot">·</span>
										<span class="symbol-chips">
											{#each dream.symbols.slice(0, 3) as sym}
												<button
													class="symbol-chip"
													class:active={symbolFilter === sym}
													onclick={(e) => {
														e.stopPropagation();
														selectSymbol(sym);
													}}
												>
													{sym}
												</button>
											{/each}
										</span>
									{/if}
								</div>
							</div>
						</div>
					{/if}
				{/each}
			{/each}

			{#if filtered.length === 0 && dreams.length > 0}
				<p class="empty">Keine Treffer</p>
			{/if}
		</div>

		{#if dreams.length === 0}
			<p class="empty">Tippe oben, um deinen ersten Traum festzuhalten.</p>
		{/if}

		<ContextMenu
			visible={ctxMenu.state.visible}
			x={ctxMenu.state.x}
			y={ctxMenu.state.y}
			items={ctxMenuItems}
			onClose={ctxMenu.close}
		/>
	{/if}
</div>

<style>
	.app-view {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 1rem;
		height: 100%;
	}

	/* Voice capture styles live in $lib/components/voice/VoiceCaptureBar.svelte */

	/* ── View Tabs ─────────────────────────────── */
	.view-tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
		padding-bottom: 0.5rem;
		margin-bottom: 0.25rem;
	}
	.view-tab {
		background: transparent;
		border: none;
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		border-radius: 0.25rem;
		font-weight: 500;
	}
	.view-tab:hover {
		color: hsl(var(--color-primary));
	}
	.view-tab.active {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.08);
	}

	/* ── Quick Add ─────────────────────────────── */
	.quick-add {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
	}
	.add-icon {
		font-size: 0.875rem;
	}
	.add-input {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}
	.add-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Insights ──────────────────────────────── */
	.insights {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.375rem 0.25rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.ins-stat {
		font-weight: 500;
	}
	.ins-symbol {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: hsl(var(--color-primary) / 0.08);
		color: hsl(var(--color-primary));
		border: 1px solid transparent;
		font-size: 0.6875rem;
		cursor: pointer;
	}
	.ins-symbol:hover {
		background: hsl(var(--color-primary) / 0.16);
	}
	.ins-symbol.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.ins-clear {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border: 1px dashed hsl(var(--color-border));
		font-size: 0.6875rem;
		cursor: pointer;
	}
	.ins-clear:hover {
		color: hsl(var(--color-error));
		border-color: hsl(var(--color-error));
	}

	/* ── Filter Tabs ───────────────────────────── */
	.filter-tabs {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.filter-tab {
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.filter-tab:hover {
		color: hsl(var(--color-primary));
	}
	.filter-tab.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}

	/* ── Search ────────────────────────────────── */
	.search-input {
		padding: 0.3rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
		outline: none;
	}
	.search-input:focus {
		border-color: hsl(var(--color-primary));
	}

	/* ── Dream List ────────────────────────────── */
	.dream-list {
		flex: 1;
		overflow-y: auto;
	}

	.month-label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		padding: 0.75rem 0.25rem 0.25rem;
		font-weight: 600;
	}

	.dream-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.25rem;
		border: none;
		background: transparent;
		text-align: left;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.dream-item:hover {
		background: hsl(var(--color-surface-hover));
	}

	.mood-dot-row {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		flex-shrink: 0;
		margin-top: 0.4375rem;
	}
	.mood-dot-row.empty {
		background: hsl(var(--color-border));
	}

	.dream-content {
		min-width: 0;
		flex: 1;
	}

	.dream-top {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.dream-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badge {
		font-size: 0.625rem;
	}
	.badge.transcribing {
		color: hsl(var(--color-primary));
		font-size: 0.5rem;
		letter-spacing: 0.0625rem;
		animation: dots-pulse 1.4s ease-in-out infinite;
	}
	@keyframes dots-pulse {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 1;
		}
	}
	.badge.failed {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 13px;
		height: 13px;
		border-radius: 9999px;
		background: hsl(var(--color-error) / 0.15);
		color: hsl(var(--color-error));
		font-size: 0.5625rem;
		font-weight: 700;
	}

	.dream-preview {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dream-meta {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.125rem;
	}
	.dream-meta .dot {
		opacity: 0.5;
	}
	.stt-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
		padding: 0 0.375rem;
		border-radius: 9999px;
		background: hsl(var(--color-muted) / 0.6);
		color: hsl(var(--color-muted-foreground));
		font-size: 0.5625rem;
		font-variant-numeric: tabular-nums;
	}
	.symbol-chips {
		display: inline-flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.symbol-chip {
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		border: 1px solid transparent;
		background: hsl(var(--color-primary) / 0.08);
		color: hsl(var(--color-primary));
		font-size: 0.625rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.symbol-chip:hover {
		background: hsl(var(--color-primary) / 0.18);
	}
	.symbol-chip.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	/* ── Inline Editor ─────────────────────────── */
	.dream-item.editing {
		cursor: default;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.625rem;
		border: 1px solid hsl(var(--color-primary) / 0.3);
		border-radius: 0.375rem;
		background: hsl(var(--color-primary) / 0.03);
	}
	.dream-item.editing:hover {
		background: hsl(var(--color-primary) / 0.03);
	}

	.ed-title {
		width: 100%;
		background: transparent;
		border: none;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 0;
		outline: none;
	}

	.ed-status {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-primary) / 0.06);
		color: hsl(var(--color-primary));
		font-size: 0.6875rem;
	}
	.ed-status.failed {
		background: hsl(var(--color-error) / 0.06);
		color: hsl(var(--color-error));
	}
	.ed-status.muted {
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.625rem;
		padding: 0.125rem 0;
	}
	.ed-status.muted strong {
		color: hsl(var(--color-foreground));
		font-weight: 600;
	}
	.ed-status-dots {
		font-size: 0.5rem;
		letter-spacing: 0.0625rem;
		animation: dots-pulse 1.4s ease-in-out infinite;
	}

	.ed-content {
		width: 100%;
		background: transparent;
		border: none;
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		padding: 0;
		outline: none;
		resize: vertical;
		min-height: 4rem;
		font-family: inherit;
		line-height: 1.5;
	}

	.ed-symbols {
		width: 100%;
		background: transparent;
		border: none;
		border-top: 1px dashed hsl(var(--color-border));
		padding: 0.25rem 0 0;
		font-size: 0.6875rem;
		color: hsl(var(--color-primary));
		outline: none;
	}
	.ed-symbols::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.ed-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.mood-picker {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.mood-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}
	.mood-btn .mood-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		background: var(--mood-color);
	}
	.mood-btn.active {
		border-color: var(--mood-color);
		color: var(--mood-color);
		background: color-mix(in srgb, var(--mood-color) 10%, transparent);
	}

	.lucid-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}

	.toggles {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.sleep-row {
		justify-content: flex-start;
		gap: 0.75rem;
	}

	.ed-field {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.ed-label {
		font-size: 0.5625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		font-weight: 600;
	}

	.ed-input-sm {
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		padding: 0.125rem 0.375rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-foreground));
		outline: none;
		font-family: inherit;
	}
	.ed-input-sm:focus {
		border-color: hsl(var(--color-primary));
	}

	.stars {
		display: inline-flex;
		gap: 0.0625rem;
	}
	.star {
		background: transparent;
		border: none;
		font-size: 0.875rem;
		color: hsl(var(--color-border-strong));
		cursor: pointer;
		padding: 0 0.0625rem;
		line-height: 1;
	}
	.star.filled {
		color: hsl(var(--color-warning));
	}
	.star:hover {
		color: hsl(var(--color-warning));
	}

	.ed-actions {
		display: flex;
		gap: 0.25rem;
		justify-content: flex-end;
	}

	.ed-btn {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s;
	}
	.ed-btn:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.ed-btn.primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.ed-btn.primary:hover {
		background: hsl(var(--color-primary));
		filter: brightness(0.9);
	}
	.ed-btn.danger:hover {
		color: hsl(var(--color-error));
		background: hsl(var(--color-error) / 0.08);
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	@media (max-width: 640px) {
		.app-view {
			padding: 0.75rem;
		}
		.dream-item {
			min-height: 44px;
		}
	}
</style>
