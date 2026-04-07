<!--
  Dreams — Symbol detail
  Editable name + meaning + color, mood distribution, co-occurring symbols, dream list.
-->
<script lang="ts">
	import {
		formatDreamDate,
		getCooccurringSymbols,
		getDreamsWithSymbol,
		getMoodDistribution,
		useAllDreams,
		useAllDreamSymbols,
	} from '../queries';
	import { dreamsStore } from '../stores/dreams.svelte';
	import { MOOD_COLORS, MOOD_LABELS, type Dream, type DreamMood } from '../types';

	let {
		symbolId,
		onBack,
		onSelectSymbol,
		onOpenDream,
	}: {
		symbolId: string;
		onBack: () => void;
		onSelectSymbol?: (id: string) => void;
		onOpenDream?: (dream: Dream) => void;
	} = $props();

	let symbols$ = useAllDreamSymbols();
	let dreams$ = useAllDreams();

	let symbols = $derived(symbols$.value);
	let dreams = $derived(dreams$.value);
	let symbol = $derived(symbols.find((s) => s.id === symbolId));

	// Local edit buffer
	let editName = $state('');
	let editMeaning = $state('');
	let editColor = $state<string>('#6366f1');
	let lastInitId = $state<string | null>(null);

	$effect(() => {
		if (symbol && lastInitId !== symbol.id) {
			editName = symbol.name;
			editMeaning = symbol.meaning ?? '';
			editColor = symbol.color ?? '#6366f1';
			lastInitId = symbol.id;
		}
	});

	let dirty = $derived(
		symbol !== undefined &&
			(editName !== symbol.name ||
				editMeaning !== (symbol.meaning ?? '') ||
				editColor !== (symbol.color ?? '#6366f1'))
	);

	let savedHint = $state(false);

	// Debounced auto-save
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		// react to edit fields
		void editName;
		void editMeaning;
		void editColor;

		if (!dirty || !symbol) return;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			void save();
		}, 500);
		return () => {
			if (saveTimer) clearTimeout(saveTimer);
		};
	});

	let dreamsWithSymbol = $derived(symbol ? getDreamsWithSymbol(dreams, symbol.name) : []);
	let moodDist = $derived(symbol ? getMoodDistribution(dreams, symbol.name) : []);
	let cooccurring = $derived(symbol ? getCooccurringSymbols(dreams, symbol.name) : []);
	let totalForBars = $derived(moodDist.reduce((sum, m) => sum + m.count, 0) || 1);

	// Merge target candidates
	let mergeOpen = $state(false);
	let mergeTargetId = $state('');
	let mergeCandidates = $derived(
		symbol
			? symbols
					.filter((s) => s.id !== symbol.id && s.count > 0)
					.sort((a, b) => a.name.localeCompare(b.name, 'de'))
			: []
	);

	const PALETTE = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899'];

	async function save() {
		if (!symbol || !dirty) return;
		await dreamsStore.updateSymbol(symbol.id, {
			name: editName.trim() || symbol.name,
			meaning: editMeaning.trim() || null,
			color: editColor,
		});
		savedHint = true;
		setTimeout(() => (savedHint = false), 1500);
	}

	async function handleDelete() {
		if (!symbol) return;
		const ok = confirm(
			`Symbol "${symbol.name}" wirklich löschen? Es wird aus allen Träumen entfernt.`
		);
		if (!ok) return;
		await dreamsStore.deleteSymbol(symbol.id);
		onBack();
	}

	async function handleMerge() {
		if (!symbol || !mergeTargetId) return;
		const target = symbols.find((s) => s.id === mergeTargetId);
		if (!target) return;
		const ok = confirm(
			`"${symbol.name}" in "${target.name}" zusammenführen? Alle Träume werden umgeschrieben.`
		);
		if (!ok) return;
		await dreamsStore.mergeSymbols(symbol.id, mergeTargetId);
		mergeOpen = false;
		mergeTargetId = '';
		onBack();
	}

	function navigateToCooccurring(name: string) {
		const target = symbols.find((s) => s.name === name);
		if (target && onSelectSymbol) onSelectSymbol(target.id);
	}

	function moodColor(mood: string): string {
		if (mood in MOOD_COLORS) return MOOD_COLORS[mood as DreamMood];
		return '#9ca3af';
	}

	function moodLabel(mood: string): string {
		if (mood in MOOD_LABELS) return MOOD_LABELS[mood as DreamMood];
		return 'Unbekannt';
	}
</script>

<div class="detail-view">
	<div class="header">
		<button class="back-btn" onclick={onBack}>← Symbole</button>
		<div class="header-actions">
			{#if savedHint}
				<span class="saved-hint">Gespeichert</span>
			{/if}
			{#if symbol && mergeCandidates.length > 0}
				<button class="meta-btn" onclick={() => (mergeOpen = !mergeOpen)}>Zusammenführen…</button>
			{/if}
			{#if symbol}
				<button class="del-btn" onclick={handleDelete}>Löschen</button>
			{/if}
		</div>
	</div>

	{#if mergeOpen && symbol}
		<div class="merge-panel">
			<span class="merge-label">"{symbol.name}" zusammenführen mit:</span>
			<select class="merge-select" bind:value={mergeTargetId}>
				<option value="">– Symbol wählen –</option>
				{#each mergeCandidates as c}
					<option value={c.id}>{c.name} ({c.count})</option>
				{/each}
			</select>
			<button class="merge-confirm" disabled={!mergeTargetId} onclick={handleMerge}>OK</button>
			<button class="merge-cancel" onclick={() => ((mergeOpen = false), (mergeTargetId = ''))}
				>Abbrechen</button
			>
		</div>
	{/if}

	{#if !symbol}
		<p class="empty">Symbol nicht gefunden.</p>
	{:else}
		<!-- Editable header -->
		<div class="sym-header">
			<input
				class="name-input"
				type="text"
				bind:value={editName}
				placeholder="Symbolname"
				style="color: {editColor}"
			/>
			<span class="count-badge">{symbol.count} {symbol.count === 1 ? 'Traum' : 'Träume'}</span>
		</div>

		<!-- Color picker -->
		<div class="palette">
			{#each PALETTE as color}
				<button
					class="palette-swatch"
					class:active={editColor === color}
					style="background: {color}"
					onclick={() => (editColor = color)}
					aria-label={`Farbe ${color}`}
				></button>
			{/each}
		</div>

		<!-- Meaning -->
		<div class="section">
			<span class="section-label">Meine Bedeutung</span>
			<textarea
				class="meaning-input"
				bind:value={editMeaning}
				placeholder="Was bedeutet dieses Symbol für dich? (optional)"
				rows="3"
			></textarea>
		</div>

		<!-- Mood distribution -->
		{#if moodDist.length > 0}
			<div class="section">
				<span class="section-label">Stimmungs-Verteilung</span>
				<div class="bars">
					{#each moodDist as m}
						<div class="bar-row">
							<span class="bar-label" style="color: {moodColor(m.mood)}">{moodLabel(m.mood)}</span>
							<div class="bar-track">
								<div
									class="bar-fill"
									style="width: {(m.count / totalForBars) * 100}%; background: {moodColor(m.mood)}"
								></div>
							</div>
							<span class="bar-count">{m.count}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Co-occurring -->
		{#if cooccurring.length > 0}
			<div class="section">
				<span class="section-label">Häufig zusammen mit</span>
				<div class="cooc-row">
					{#each cooccurring as c}
						<button
							class="cooc-chip"
							onclick={() => navigateToCooccurring(c.name)}
							title={`Zu "${c.name}" wechseln`}
						>
							{c.name} <span class="cooc-count">{c.count}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Dream list -->
		{#if dreamsWithSymbol.length > 0}
			<div class="section">
				<span class="section-label">Träume mit diesem Symbol</span>
				<div class="dream-refs">
					{#each dreamsWithSymbol as d (d.id)}
						<button class="dream-ref" onclick={() => onOpenDream?.(d)} disabled={!onOpenDream}>
							{#if d.mood}
								<span class="ref-dot" style="background: {MOOD_COLORS[d.mood]}"></span>
							{:else}
								<span class="ref-dot empty"></span>
							{/if}
							<div class="ref-content">
								<span class="ref-title">{d.title || 'Traum ohne Titel'}</span>
								<span class="ref-date">{formatDreamDate(d.dreamDate)}</span>
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.detail-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.back-btn {
		background: transparent;
		border: none;
		color: #6366f1;
		font-size: 0.75rem;
		cursor: pointer;
		padding: 0.25rem 0;
	}
	.back-btn:hover {
		text-decoration: underline;
	}

	.saved-hint {
		font-size: 0.625rem;
		color: #22c55e;
		font-weight: 500;
		animation: fade-in 0.2s ease-out;
	}
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-2px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.meta-btn {
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.08);
		color: #6b7280;
		font-size: 0.6875rem;
		padding: 0.25rem 0.625rem;
		border-radius: 0.25rem;
		cursor: pointer;
	}
	.meta-btn:hover {
		border-color: #6366f1;
		color: #6366f1;
	}
	:global(.dark) .meta-btn {
		border-color: rgba(255, 255, 255, 0.08);
		color: #9ca3af;
	}

	.del-btn {
		background: transparent;
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
		font-size: 0.6875rem;
		padding: 0.25rem 0.625rem;
		border-radius: 0.25rem;
		cursor: pointer;
	}
	.del-btn:hover {
		background: rgba(239, 68, 68, 0.08);
	}

	/* Merge panel */
	.merge-panel {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		background: rgba(99, 102, 241, 0.05);
		border: 1px solid rgba(99, 102, 241, 0.2);
	}
	.merge-label {
		font-size: 0.6875rem;
		color: #6b7280;
	}
	.merge-select {
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.25rem;
		padding: 0.1875rem 0.375rem;
		font-size: 0.6875rem;
		color: #374151;
		outline: none;
		font-family: inherit;
	}
	:global(.dark) .merge-select {
		border-color: rgba(255, 255, 255, 0.12);
		color: #f3f4f6;
		color-scheme: dark;
	}
	.merge-confirm {
		padding: 0.1875rem 0.625rem;
		border-radius: 0.25rem;
		border: none;
		background: #6366f1;
		color: white;
		font-size: 0.6875rem;
		cursor: pointer;
	}
	.merge-confirm:disabled {
		background: rgba(99, 102, 241, 0.3);
		cursor: not-allowed;
	}
	.merge-cancel {
		padding: 0.1875rem 0.5rem;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: #9ca3af;
		font-size: 0.6875rem;
		cursor: pointer;
	}
	.merge-cancel:hover {
		color: #374151;
	}

	.sym-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.name-input {
		flex: 1;
		background: transparent;
		border: none;
		font-size: 1.125rem;
		font-weight: 600;
		padding: 0;
		outline: none;
	}

	.count-badge {
		font-size: 0.625rem;
		color: #9ca3af;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: rgba(0, 0, 0, 0.04);
	}
	:global(.dark) .count-badge {
		background: rgba(255, 255, 255, 0.06);
	}

	.palette {
		display: flex;
		gap: 0.375rem;
	}

	.palette-swatch {
		width: 20px;
		height: 20px;
		border-radius: 9999px;
		border: 2px solid transparent;
		cursor: pointer;
		padding: 0;
	}
	.palette-swatch.active {
		border-color: #374151;
		transform: scale(1.1);
	}
	:global(.dark) .palette-swatch.active {
		border-color: #f3f4f6;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.section-label {
		font-size: 0.5625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #c0bfba;
		font-weight: 600;
	}
	:global(.dark) .section-label {
		color: #4b5563;
	}

	.meaning-input {
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 0.375rem;
		padding: 0.5rem;
		font-size: 0.75rem;
		color: #374151;
		outline: none;
		resize: vertical;
		font-family: inherit;
		line-height: 1.5;
	}
	.meaning-input:focus {
		border-color: #6366f1;
	}
	:global(.dark) .meaning-input {
		border-color: rgba(255, 255, 255, 0.08);
		color: #f3f4f6;
	}

	/* Bars */
	.bars {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.bar-row {
		display: grid;
		grid-template-columns: 80px 1fr 24px;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.6875rem;
	}
	.bar-label {
		font-weight: 500;
	}
	.bar-track {
		background: rgba(0, 0, 0, 0.04);
		border-radius: 9999px;
		height: 6px;
		overflow: hidden;
	}
	:global(.dark) .bar-track {
		background: rgba(255, 255, 255, 0.06);
	}
	.bar-fill {
		height: 100%;
		border-radius: 9999px;
		transition: width 0.3s;
	}
	.bar-count {
		font-size: 0.625rem;
		color: #9ca3af;
		text-align: right;
	}

	/* Co-occurring */
	.cooc-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.cooc-chip {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: rgba(99, 102, 241, 0.08);
		color: #6366f1;
		font-size: 0.6875rem;
		border: 1px solid transparent;
		cursor: pointer;
		font-family: inherit;
		transition: all 0.15s;
	}
	.cooc-chip:hover {
		background: rgba(99, 102, 241, 0.18);
		border-color: #6366f1;
	}
	.cooc-count {
		font-size: 0.5625rem;
		opacity: 0.7;
		margin-left: 0.125rem;
	}

	/* Dream refs */
	.dream-refs {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.dream-ref {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.375rem;
		border-radius: 0.25rem;
		background: transparent;
		border: none;
		width: 100%;
		text-align: left;
		cursor: pointer;
		font-family: inherit;
	}
	.dream-ref:disabled {
		cursor: default;
	}
	.dream-ref:not(:disabled):hover {
		background: rgba(0, 0, 0, 0.03);
	}
	:global(.dark) .dream-ref:not(:disabled):hover {
		background: rgba(255, 255, 255, 0.04);
	}

	.ref-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.ref-dot.empty {
		background: rgba(0, 0, 0, 0.08);
	}
	:global(.dark) .ref-dot.empty {
		background: rgba(255, 255, 255, 0.08);
	}

	.ref-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex: 1;
		min-width: 0;
	}

	.ref-title {
		font-size: 0.75rem;
		color: #374151;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.dark) .ref-title {
		color: #e5e7eb;
	}

	.ref-date {
		font-size: 0.625rem;
		color: #c0bfba;
		flex-shrink: 0;
		margin-left: 0.5rem;
	}
	:global(.dark) .ref-date {
		color: #4b5563;
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}
</style>
