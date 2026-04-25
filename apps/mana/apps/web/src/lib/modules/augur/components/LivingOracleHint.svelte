<!--
  Augur — Living Oracle Hint

  Shows a deterministic reflection drawn from the user's *own* past
  resolved signs that resemble the current input. Cold-start gated: we
  refuse to speak under 50 resolved entries (set in living-oracle.ts).

  Two modes:
    - 'live': computes against the current EntryForm input as the user
      types. Renders the breakdown only when the engine has something
      to say.
    - 'snapshot': renders a stored `livingOracleSnapshot` string from a
      resolved entry. Used in DetailView to show what the oracle said
      *at the time*, alongside what actually happened.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import {
		findMatches,
		fingerprint,
		makeReflection,
		shouldSpeak,
		type Fingerprint,
	} from '../lib/living-oracle';
	import type { AugurEntry, AugurKind, AugurSourceCategory, AugurVibe } from '../types';

	type Props =
		| {
				mode?: 'live';
				input: {
					kind?: AugurKind | null;
					sourceCategory?: AugurSourceCategory | null;
					vibe?: AugurVibe | null;
					tags?: string[] | null;
					source?: string | null;
					claim?: string | null;
				};
				history: AugurEntry[];
				excludeId?: string;
				onreflection?: (text: string | null) => void;
				snapshot?: never;
		  }
		| {
				mode: 'snapshot';
				snapshot: string | null;
				input?: never;
				history?: never;
				excludeId?: never;
				onreflection?: never;
		  };

	let props: Props = $props();

	const liveResult = $derived.by(() => {
		if (props.mode === 'snapshot') return null;
		const fp: Fingerprint | null = fingerprint(props.input);
		if (!fp) return null;
		const set = findMatches(fp, props.history, props.excludeId);
		if (!shouldSpeak(props.history.length, set)) return null;
		const text = makeReflection(set);
		return text ? { text, set } : null;
	});

	$effect(() => {
		if (props.mode === 'snapshot') return;
		props.onreflection?.(liveResult?.text ?? null);
	});
</script>

{#if props.mode === 'snapshot'}
	{#if props.snapshot}
		<aside class="hint snapshot">
			<header>
				<span class="dot"></span>
				<span class="title">{$_('augur.oracleHint.titleSnapshot')}</span>
			</header>
			<p class="text">{props.snapshot}</p>
		</aside>
	{/if}
{:else if liveResult}
	<aside class="hint live">
		<header>
			<span class="dot"></span>
			<span class="title">{$_('augur.oracleHint.titleLive')}</span>
		</header>
		<p class="text">{liveResult.text}</p>
		<div class="bars">
			{#if liveResult.set.fulfilled > 0}
				<span
					class="bar yes"
					style:flex={liveResult.set.fulfilled}
					title={$_('augur.oracleHint.hit')}
				></span>
			{/if}
			{#if liveResult.set.partly > 0}
				<span
					class="bar partly"
					style:flex={liveResult.set.partly}
					title={$_('augur.oracleHint.partly')}
				></span>
			{/if}
			{#if liveResult.set.notFulfilled > 0}
				<span
					class="bar no"
					style:flex={liveResult.set.notFulfilled}
					title={$_('augur.oracleHint.no')}
				></span>
			{/if}
		</div>
	</aside>
{/if}

<style>
	.hint {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.7rem 0.85rem;
		border-radius: 0.65rem;
		border: 1px solid color-mix(in srgb, #7c3aed 40%, transparent);
		background: color-mix(in srgb, #7c3aed 10%, transparent);
	}
	header {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}
	.dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		background: #c4b5fd;
		box-shadow: 0 0 0 4px color-mix(in srgb, #7c3aed 25%, transparent);
		flex-shrink: 0;
	}
	.title {
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #c4b5fd;
		font-weight: 500;
	}
	.text {
		margin: 0;
		font-size: 0.92rem;
		color: var(--color-text, inherit);
		line-height: 1.4;
	}
	.bars {
		display: flex;
		height: 0.45rem;
		border-radius: 999px;
		overflow: hidden;
		gap: 1px;
	}
	.bar.yes {
		background: #10b981;
	}
	.bar.partly {
		background: #f59e0b;
	}
	.bar.no {
		background: #ef4444;
	}
	.bar {
		min-width: 0;
	}
	.snapshot {
		border-color: color-mix(in srgb, #94a3b8 35%, transparent);
		background: color-mix(in srgb, #94a3b8 8%, transparent);
	}
	.snapshot .dot {
		background: #cbd5e1;
		box-shadow: 0 0 0 4px color-mix(in srgb, #94a3b8 22%, transparent);
	}
	.snapshot .title {
		color: #cbd5e1;
	}
</style>
