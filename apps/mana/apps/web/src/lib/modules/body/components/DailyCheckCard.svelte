<!--
  DailyCheckCard — 1-5 button rows for the daily energy / sleep /
  soreness / mood self-rating. Upserts to bodyChecks per day, so
  re-tapping a button overwrites that field for today.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { BodyCheck } from '../types';
	import { bodyStore } from '../stores/body.svelte';
	import { todayDateStr } from '../queries';

	interface Props {
		checks: BodyCheck[];
	}
	const { checks }: Props = $props();

	let today = todayDateStr();
	let todayCheck = $derived(checks.find((c) => c.date === today) ?? null);

	const FIELDS = [
		{ key: 'energy', label: 'Energie' },
		{ key: 'sleep', label: 'Schlaf' },
		{ key: 'soreness', label: 'Muskelkater' },
		{ key: 'mood', label: 'Stimmung' },
	] as const;

	type CheckField = (typeof FIELDS)[number]['key'];

	async function rate(field: CheckField, value: number) {
		await bodyStore.upsertCheck({ [field]: value });
	}

	function valueOf(field: CheckField): number | null {
		return todayCheck ? (todayCheck[field] ?? null) : null;
	}
</script>

<div class="check-card">
	{#each FIELDS as field (field.key)}
		<div class="check-row">
			<div class="check-label">{$_(`body.check.${field.key}`, { default: field.label })}</div>
			<div class="check-buttons">
				{#each [1, 2, 3, 4, 5] as n (n)}
					{@const active = valueOf(field.key) === n}
					<button
						type="button"
						class="dot"
						class:active
						onclick={() => rate(field.key, n)}
						aria-label={`${field.label} ${n}`}
					>
						{n}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.check-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.check-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.check-label {
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}
	.check-buttons {
		display: flex;
		gap: 0.25rem;
	}
	.dot {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
	}
	.dot.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}
</style>
