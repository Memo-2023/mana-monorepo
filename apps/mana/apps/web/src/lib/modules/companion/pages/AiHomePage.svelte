<!--
  Default "home" page of the Companion carousel. Shows a compact summary
  of AI activity + one-click buttons to open each of the other pages
  alongside.
-->
<script lang="ts">
	import { PageShell } from '$lib/components/page-carousel';
	import { COMPANION_PAGE_META, ALL_COMPANION_PAGE_IDS } from './page-meta';
	import { companionWorkbenchSettings } from '../stores/workbench-settings.svelte';
	import type { CompanionPageId } from '../stores/workbench-settings.svelte';
	import { useAiProposals } from '$lib/data/ai/proposals/queries';
	import { useMissions } from '$lib/data/ai/missions/queries';

	interface Props {
		widthPx: number;
		maximized?: boolean;
		onClose: () => void;
		onMaximize: () => void;
		onResize: (widthPx: number, heightPx?: number) => void;
		onMoveLeft?: () => void;
		onMoveRight?: () => void;
	}

	let {
		widthPx,
		maximized = false,
		onClose,
		onMaximize,
		onResize,
		onMoveLeft,
		onMoveRight,
	}: Props = $props();

	const meta = COMPANION_PAGE_META.home;

	const proposals = $derived(useAiProposals({ status: 'pending' }));
	const missions = $derived(useMissions({ state: 'active' }));

	function openOrFocus(id: CompanionPageId) {
		companionWorkbenchSettings.openPage(id);
	}

	function isOpen(id: CompanionPageId): boolean {
		return companionWorkbenchSettings.openPages.some((p) => p.id === id);
	}

	// Everything except home — home is always already the current page.
	const shortcuts = $derived(
		ALL_COMPANION_PAGE_IDS.filter((id) => id !== 'home').map((id) => COMPANION_PAGE_META[id])
	);
</script>

<PageShell
	{widthPx}
	{maximized}
	{onClose}
	{onMaximize}
	{onResize}
	{onMoveLeft}
	{onMoveRight}
	title={meta.title}
	color={meta.color}
	icon={meta.icon}
>
	<div class="home">
		<section class="stats">
			<div class="stat">
				<span class="stat-value">{proposals.value.length}</span>
				<span class="stat-label">wartende Vorschläge</span>
			</div>
			<div class="stat">
				<span class="stat-value">{missions.value.length}</span>
				<span class="stat-label">aktive Missions</span>
			</div>
		</section>

		<section class="section">
			<h3 class="section-title">Bereiche öffnen</h3>
			<div class="shortcut-grid">
				{#each shortcuts as s (s.id)}
					{@const open = isOpen(s.id)}
					<button
						type="button"
						class="shortcut"
						class:open
						onclick={() => openOrFocus(s.id)}
						style="--accent: {s.color};"
					>
						<span class="shortcut-icon">
							<s.icon size={20} weight="bold" />
						</span>
						<span class="shortcut-body">
							<span class="shortcut-title">
								{s.title}
								{#if open}<span class="badge-open">offen</span>{/if}
							</span>
							<span class="shortcut-desc">{s.description}</span>
						</span>
					</button>
				{/each}
			</div>
		</section>

		<section class="section hint">
			<p>
				Jeder Bereich lebt als eigene Page in diesem Carousel. Du kannst mehrere gleichzeitig offen
				haben, einzeln schließen oder per „×" in der Header-Leiste beenden. Das Layout merkt sich
				deine Auswahl.
			</p>
		</section>
	</div>
</PageShell>

<style>
	.home {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1rem 1.25rem 1.5rem;
	}

	.stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.stat {
		padding: 0.75rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-surface));
		display: flex;
		flex-direction: column;
	}
	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		font-variant-numeric: tabular-nums;
	}
	.stat-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--color-muted-foreground));
		margin: 0 0 0.5rem;
	}

	.shortcut-grid {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.shortcut {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.625rem;
		align-items: start;
		padding: 0.625rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-surface));
		text-align: left;
		cursor: pointer;
		font: inherit;
		color: hsl(var(--color-foreground));
		transition:
			border-color 120ms ease,
			background 120ms ease;
	}
	.shortcut:hover {
		border-color: var(--accent, hsl(var(--color-primary)));
		background: color-mix(
			in oklab,
			var(--accent, hsl(var(--color-primary))) 8%,
			hsl(var(--color-surface))
		);
	}
	.shortcut.open {
		border-left: 3px solid var(--accent, hsl(var(--color-primary)));
	}
	.shortcut-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.375rem;
		background: color-mix(in oklab, var(--accent, hsl(var(--color-primary))) 14%, transparent);
		color: var(--accent, hsl(var(--color-primary)));
	}
	.shortcut-body {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.shortcut-title {
		font-weight: 600;
		font-size: 0.9375rem;
		display: inline-flex;
		gap: 0.375rem;
		align-items: center;
	}
	.shortcut-desc {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.badge-open {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.125rem 0.375rem;
		border-radius: 999px;
		background: color-mix(in oklab, var(--accent, hsl(var(--color-primary))) 20%, transparent);
		color: var(--accent, hsl(var(--color-primary)));
	}

	.hint p {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.45;
	}
</style>
