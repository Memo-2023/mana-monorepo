<script lang="ts">
	/**
	 * SourceBadge — small inline label that tells the user which LLM tier
	 * produced an AI result. Use it next to any displayed LLM output so
	 * the user can see at a glance whether their data stayed on-device,
	 * went to our server, or went to Google.
	 *
	 * The badge respects `llmSettingsState.showSourceInUi` — if the user
	 * has explicitly hidden source badges in settings, this component
	 * renders nothing.
	 *
	 * Usage:
	 *   <SourceBadge tier={result.source} />
	 *   <SourceBadge tier={result.source} latencyMs={result.latencyMs} />
	 */
	import { llmSettingsState, tierLabel, type LlmTier } from '@mana/shared-llm';
	import { Lightning, Cpu, HardDrive, Cloud } from '@mana/shared-icons';

	interface Props {
		tier: LlmTier;
		latencyMs?: number;
	}

	let { tier, latencyMs }: Props = $props();

	const settings = $derived(llmSettingsState.current);

	// Per-tier visual treatment — color encodes privacy gradient.
	const tierStyles: Record<LlmTier, { color: string; icon: typeof Lightning }> = {
		none: {
			color: 'border-muted-foreground/30 bg-muted/20 text-muted-foreground',
			icon: Lightning, // "fast" — rules-based is instant
		},
		browser: {
			color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
			icon: Cpu, // on-device hardware
		},
		'mana-server': {
			color: 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400',
			icon: HardDrive, // our infrastructure
		},
		cloud: {
			color: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
			icon: Cloud, // remote
		},
	};

	const style = $derived(tierStyles[tier]);
</script>

{#if settings.showSourceInUi}
	<span
		class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium {style.color}"
		title="Diese Antwort wurde auf der Schicht '{tierLabel(tier)}' erzeugt"
	>
		<style.icon size={10} weight="fill" />
		<span>{tierLabel(tier)}</span>
		{#if latencyMs !== undefined}
			<span class="opacity-60">· {latencyMs}ms</span>
		{/if}
	</span>
{/if}
