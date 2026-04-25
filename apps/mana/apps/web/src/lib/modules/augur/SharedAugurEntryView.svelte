<!--
  Shared-Augur-Entry view — public render of a single sign behind an
  unlisted share link.

  Whitelist (set by buildAugurEntryBlob): source, claim, kind, vibe,
  encounteredAt, outcome, outcomeNote (when resolved), resolvedAt.
  feltMeaning / expectedOutcome / probability / tags / livingOracleSnapshot
  / sourceCategory all stay PRIVATE.

  Tone: respectful — divinatory captures are personal even when the
  user chose to share. No analytics, no oracle stats here.
-->
<script lang="ts">
	interface AugurEntryBlob {
		source: string;
		claim: string;
		kind: 'omen' | 'fortune' | 'hunch';
		vibe: 'good' | 'bad' | 'mysterious';
		encounteredAt: string;
		outcome: 'open' | 'fulfilled' | 'partly' | 'not-fulfilled';
		outcomeNote: string | null;
		resolvedAt: string | null;
	}

	let {
		blob,
	}: {
		blob: Record<string, unknown>;
		token: string;
		expiresAt: string | null;
	} = $props();

	const entry = $derived(blob as unknown as AugurEntryBlob);

	const KIND_LABELS: Record<AugurEntryBlob['kind'], string> = {
		omen: 'Omen',
		fortune: 'Wahrsagung',
		hunch: 'Bauchgefühl',
	};

	const VIBE_COLORS: Record<AugurEntryBlob['vibe'], string> = {
		good: '#22c55e',
		bad: '#ef4444',
		mysterious: '#8b5cf6',
	};

	const VIBE_LABELS: Record<AugurEntryBlob['vibe'], string> = {
		good: 'Gutes Zeichen',
		bad: 'Warnung',
		mysterious: 'Rätselhaft',
	};

	const OUTCOME_LABELS: Record<AugurEntryBlob['outcome'], string> = {
		open: 'Noch offen',
		fulfilled: 'Eingetreten',
		partly: 'Teilweise eingetreten',
		'not-fulfilled': 'Nicht eingetreten',
	};

	const OUTCOME_COLORS: Record<AugurEntryBlob['outcome'], string> = {
		open: '#94a3b8',
		fulfilled: '#10b981',
		partly: '#f59e0b',
		'not-fulfilled': '#ef4444',
	};

	const isResolved = $derived(entry.outcome !== 'open');
</script>

<article class="card" style:--vibe={VIBE_COLORS[entry.vibe]}>
	<header>
		<div class="meta">
			<span class="kind">{KIND_LABELS[entry.kind]}</span>
			<span class="dot">·</span>
			<span class="date">{entry.encounteredAt}</span>
		</div>
		<h1 class="source">{entry.source}</h1>
		<p class="claim">{entry.claim}</p>
		<div class="badges">
			<span class="vibe">{VIBE_LABELS[entry.vibe]}</span>
			<span class="outcome" style:--outcome-color={OUTCOME_COLORS[entry.outcome]}>
				{OUTCOME_LABELS[entry.outcome]}
			</span>
		</div>
	</header>

	{#if isResolved && entry.outcomeNote}
		<section class="resolved">
			<h2>Wie es kam</h2>
			<p>{entry.outcomeNote}</p>
			{#if entry.resolvedAt}
				<p class="resolved-meta">{entry.resolvedAt.slice(0, 10)}</p>
			{/if}
		</section>
	{/if}

	<footer>
		<small>via Mana Augur</small>
	</footer>
</article>

<style>
	.card {
		max-width: 36rem;
		margin: 4rem auto;
		padding: 2rem 2.25rem;
		background: white;
		border-radius: 1rem;
		border: 1px solid #e5e7eb;
		border-left: 5px solid var(--vibe);
		box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		color: #0f172a;
	}
	.meta {
		display: flex;
		gap: 0.45rem;
		font-size: 0.78rem;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}
	.kind {
		color: var(--vibe);
		font-weight: 600;
	}
	.dot {
		opacity: 0.5;
	}
	.source {
		font-size: 1.65rem;
		font-weight: 600;
		margin: 0 0 0.4rem;
		line-height: 1.25;
	}
	.claim {
		margin: 0 0 1rem;
		font-size: 1.05rem;
		color: #334155;
		line-height: 1.55;
	}
	.badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.vibe {
		font-size: 0.78rem;
		padding: 0.2rem 0.65rem;
		border-radius: 999px;
		color: var(--vibe);
		background: color-mix(in srgb, var(--vibe) 12%, white);
		font-weight: 500;
	}
	.outcome {
		font-size: 0.78rem;
		padding: 0.2rem 0.65rem;
		border-radius: 999px;
		color: var(--outcome-color);
		background: color-mix(in srgb, var(--outcome-color) 12%, white);
		font-weight: 500;
	}
	.resolved {
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid #f1f5f9;
	}
	.resolved h2 {
		margin: 0 0 0.4rem;
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #64748b;
		font-weight: 500;
	}
	.resolved p {
		margin: 0;
		font-size: 1rem;
		line-height: 1.55;
		color: #1f2937;
	}
	.resolved-meta {
		margin-top: 0.4rem !important;
		font-size: 0.82rem !important;
		color: #94a3b8 !important;
	}
	footer {
		margin-top: 1.75rem;
		text-align: center;
		font-size: 0.75rem;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
</style>
