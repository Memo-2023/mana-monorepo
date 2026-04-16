<!--
  Web-Context — URL crawler tool.
  Crawls web pages and appends the content to the user's profile freeform context.
-->
<script lang="ts">
	import { LinkSimple, X } from '@mana/shared-icons';
	import { crawlUrlViaApi, type CrawlMode } from './api';
	import { requireAuth } from '$lib/auth/require-auth.svelte';
	import { userContextStore } from '$lib/modules/profile/stores/user-context.svelte';

	let importUrl = $state('');
	let importMode = $state<CrawlMode>('single');
	let importSummarize = $state(false);
	let importing = $state(false);
	let importPhase = $state<'idle' | 'crawling' | 'summarizing' | 'appending'>('idle');
	let importElapsed = $state(0);
	let importError = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	let importPhases = $derived.by(() => {
		const steps: Array<{ key: 'crawling' | 'summarizing' | 'appending'; label: string }> = [
			{
				key: 'crawling',
				label: importMode === 'deep' ? 'Website crawlen (bis 20 Seiten)' : 'Seite laden',
			},
			...(importSummarize ? [{ key: 'summarizing' as const, label: 'Mit KI zusammenfassen' }] : []),
			{ key: 'appending', label: 'In Profil-Kontext speichern' },
		];
		const order = steps.map((s) => s.key);
		const currentIdx = order.indexOf(importPhase as never);
		return steps.map((s, i) => ({
			key: s.key,
			label: s.label,
			active: currentIdx === i,
			done: currentIdx > i,
		}));
	});

	function reset() {
		importUrl = '';
		importMode = 'single';
		importSummarize = false;
		importPhase = 'idle';
		importElapsed = 0;
		importError = null;
	}

	async function handleImport(e: Event) {
		e.preventDefault();
		const trimmed = importUrl.trim();
		if (!trimmed) return;
		const ok = await requireAuth({
			feature: 'web-context-import',
			reason:
				'Das Crawlen einer Web-Seite läuft serverseitig (robots.txt, Rate-Limits, optionale KI-Zusammenfassung) und erfordert ein Mana-Konto.',
		});
		if (!ok) return;
		importing = true;
		importError = null;
		successMessage = null;
		importPhase = 'crawling';
		importElapsed = 0;
		const started = performance.now();
		const tick = setInterval(() => {
			importElapsed = Math.floor((performance.now() - started) / 1000);
		}, 250);
		let phaseTimer: ReturnType<typeof setTimeout> | null = null;
		if (importSummarize) {
			const crawlBudgetMs = importMode === 'deep' ? 25_000 : 4_000;
			phaseTimer = setTimeout(() => {
				if (importing) importPhase = 'summarizing';
			}, crawlBudgetMs);
		}
		try {
			const result = await crawlUrlViaApi({
				url: trimmed,
				mode: importMode,
				summarize: importSummarize,
			});
			if (phaseTimer) clearTimeout(phaseTimer);
			importPhase = 'appending';
			const header = `## ${result.title}\n\n_Quelle: ${result.sourceUrl}_\n\n`;
			await userContextStore.appendFreeform(header + result.content);
			successMessage = `"${result.title}" wurde deinem Profil-Kontext hinzugefügt (${result.pageCount} Seite${result.pageCount > 1 ? 'n' : ''})`;
			reset();
		} catch (err) {
			importError = err instanceof Error ? err.message : 'Import fehlgeschlagen';
		} finally {
			if (phaseTimer) clearTimeout(phaseTimer);
			clearInterval(tick);
			importing = false;
		}
	}
</script>

<div class="app-view">
	<header class="header">
		<div class="header-icon">
			<LinkSimple size={20} />
		</div>
		<div>
			<h2 class="title">Web-Context</h2>
			<p class="subtitle">Crawle Webseiten und speichere den Inhalt in deinem Profil-Kontext</p>
		</div>
	</header>

	<form class="crawl-form" onsubmit={handleImport}>
		<div class="url-row">
			<input
				type="url"
				bind:value={importUrl}
				required
				placeholder="https://example.com/article"
				disabled={importing}
				class="url-input"
			/>
			<button type="submit" disabled={importing || !importUrl.trim()} class="url-submit">
				{#if importing}
					{importPhase === 'crawling'
						? 'Crawle…'
						: importPhase === 'summarizing'
							? 'Fasse zusammen…'
							: 'Speichere…'}
				{:else}
					Importieren
				{/if}
			</button>
		</div>

		<div class="url-opts">
			<label class:disabled={importing}>
				<input type="radio" bind:group={importMode} value="single" disabled={importing} />
				Nur diese Seite
			</label>
			<label class:disabled={importing}>
				<input type="radio" bind:group={importMode} value="deep" disabled={importing} />
				Ganze Website (max. 20)
			</label>
			<span class="url-sep">·</span>
			<label class:disabled={importing}>
				<input type="checkbox" bind:checked={importSummarize} disabled={importing} />
				Mit KI zusammenfassen
			</label>
		</div>

		{#if importing || importPhase !== 'idle'}
			<ol class="phase-list" aria-live="polite">
				{#each importPhases as phase (phase.key)}
					<li class="phase" class:active={phase.active} class:done={phase.done}>
						<span class="phase-dot" aria-hidden="true">
							{#if phase.done}
								✓
							{:else if phase.active}
								<span class="phase-spinner"></span>
							{:else}
								·
							{/if}
						</span>
						<span class="phase-label">{phase.label}</span>
						{#if phase.active}
							<span class="phase-elapsed">{importElapsed}s</span>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}

		{#if importError}
			<p class="error">{importError}</p>
		{/if}
	</form>

	{#if successMessage}
		<div class="success">
			<p>{successMessage}</p>
		</div>
	{/if}

	<div class="info">
		<p>Importierte Inhalte werden im <strong>Freitext-Tab</strong> deines Profils gespeichert.</p>
		<p>Der Crawler respektiert robots.txt und nutzt Rate-Limits.</p>
	</div>
</div>

<style>
	.app-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		height: 100%;
	}

	.header {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}
	.header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		flex-shrink: 0;
	}
	.title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}
	.subtitle {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.crawl-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-card));
	}
	.url-row {
		display: flex;
		align-items: stretch;
		gap: 0.375rem;
	}
	.url-input {
		flex: 1;
		min-width: 0;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		outline: none;
	}
	.url-input:focus {
		border-color: hsl(var(--color-ring));
	}
	.url-submit {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}
	.url-submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.url-opts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.url-opts label {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		cursor: pointer;
	}
	.url-opts label.disabled {
		opacity: 0.5;
	}
	.url-sep {
		opacity: 0.4;
	}

	.phase-list {
		list-style: none;
		margin: 0;
		padding: 0.25rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.phase {
		display: grid;
		grid-template-columns: 1rem 1fr auto;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.phase.active {
		color: hsl(var(--color-primary));
		font-weight: 500;
	}
	.phase.done {
		color: hsl(var(--color-success, var(--color-primary)));
	}
	.phase-dot {
		width: 1rem;
		height: 1rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.phase-spinner {
		width: 0.75rem;
		height: 0.75rem;
		border: 1.5px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.phase-elapsed {
		font-variant-numeric: tabular-nums;
		font-size: 0.75rem;
		opacity: 0.7;
	}

	.error {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-destructive, 0 84% 60%));
	}

	.success {
		padding: 0.75rem 1rem;
		border: 1px solid hsl(142 71% 45% / 0.3);
		border-radius: 0.5rem;
		background: hsl(142 71% 45% / 0.08);
		color: hsl(142 71% 45%);
		font-size: 0.8125rem;
	}
	.success p {
		margin: 0;
	}

	.info {
		margin-top: auto;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.info p {
		margin: 0.25rem 0;
	}
</style>
