<!--
  Lasts — DueBanner

  In-app surfacing of today's anniversary lasts + recognition anniversaries
  + inbox-notify hint. No OS push integration (M5.b). Each toggle is
  opt-in via /lasts/settings.

  Hard cap: bannerMaxItems (default 3). Items prioritised:
    1. Anniversaries (date)        — most personal
    2. Recognition anniversaries   — when something was first marked as a last
    3. Inbox-notify                — single info row
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { CATEGORY_COLORS } from '../types';
	import type { Last } from '../types';
	import {
		findAnniversaryLasts,
		findRecognitionAnniversaryLasts,
		yearsBetween,
	} from '../lib/reminders';
	import { lastsSettings } from '../stores/settings.svelte';

	let {
		lasts,
		inboxCount,
	}: {
		lasts: Last[];
		inboxCount: number;
	} = $props();

	function todayIso(): string {
		return new Date().toISOString().slice(0, 10);
	}

	type BannerRow =
		| { kind: 'anniversary'; last: Last; years: number }
		| { kind: 'recognition'; last: Last; years: number }
		| { kind: 'inbox'; count: number };

	let rows = $derived.by<BannerRow[]>(() => {
		const today = todayIso();
		const collected: BannerRow[] = [];

		if (lastsSettings.anniversaryReminders) {
			for (const l of findAnniversaryLasts(lasts, today)) {
				collected.push({
					kind: 'anniversary',
					last: l,
					years: yearsBetween(l.date ?? today, today),
				});
			}
		}

		if (lastsSettings.recognitionReminders) {
			for (const l of findRecognitionAnniversaryLasts(lasts, today)) {
				// Avoid double-listing the same last if its date already matched.
				if (
					lastsSettings.anniversaryReminders &&
					l.status === 'confirmed' &&
					l.date &&
					l.date.slice(5, 10) === today.slice(5, 10) &&
					(l.date.slice(0, 4) ?? '') < today.slice(0, 4)
				) {
					continue;
				}
				collected.push({
					kind: 'recognition',
					last: l,
					years: yearsBetween(l.recognisedAt, today),
				});
			}
		}

		if (lastsSettings.inboxNotify && inboxCount > 0) {
			collected.push({ kind: 'inbox', count: inboxCount });
		}

		const cap = Math.max(1, lastsSettings.bannerMaxItems ?? 3);
		return collected.slice(0, cap);
	});

	function handleClick(row: BannerRow) {
		if (row.kind === 'inbox') {
			goto('/lasts/inbox');
		} else {
			goto(`/lasts/entry/${row.last.id}`);
		}
	}
</script>

{#if rows.length > 0}
	<aside class="banner">
		<header class="banner-head">
			<span class="dot"></span>
			<span class="banner-title">{$_('lasts.banner.title')}</span>
		</header>
		<ul class="rows">
			{#each rows as row, i (i)}
				{#if row.kind === 'anniversary'}
					<li>
						<button class="row" onclick={() => handleClick(row)}>
							<span class="row-dot" style="background: {CATEGORY_COLORS[row.last.category]}"></span>
							<span class="row-text">
								<span class="row-prefix"
									>{$_('lasts.banner.anniversary', { values: { years: row.years } })}</span
								>
								<span class="row-title">{row.last.title}</span>
							</span>
						</button>
					</li>
				{:else if row.kind === 'recognition'}
					<li>
						<button class="row" onclick={() => handleClick(row)}>
							<span class="row-dot" style="background: {CATEGORY_COLORS[row.last.category]}"></span>
							<span class="row-text">
								<span class="row-prefix"
									>{$_('lasts.banner.recognition', { values: { years: row.years } })}</span
								>
								<span class="row-title">{row.last.title}</span>
							</span>
						</button>
					</li>
				{:else}
					<li>
						<button class="row inbox" onclick={() => handleClick(row)}>
							<span class="row-dot inbox-dot"></span>
							<span class="row-text">
								<span class="row-prefix"
									>{$_('lasts.banner.inbox', { values: { count: row.count } })}</span
								>
							</span>
						</button>
					</li>
				{/if}
			{/each}
		</ul>
	</aside>
{/if}

<style>
	.banner {
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-primary) / 0.3);
		background: hsl(var(--color-primary) / 0.04);
		overflow: hidden;
	}
	.banner-head {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.625rem;
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
		color: hsl(var(--color-primary));
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		background: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.2);
	}
	.banner-title {
		opacity: 0.85;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		border-top: 1px solid hsl(var(--color-primary) / 0.15);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: 0;
		border-bottom: 1px solid hsl(var(--color-primary) / 0.08);
		text-align: left;
		font: inherit;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		transition: background 0.15s;
	}
	.row:last-child {
		border-bottom: 0;
	}
	.row:hover {
		background: hsl(var(--color-primary) / 0.06);
	}

	.row-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.inbox-dot {
		background: hsl(var(--color-primary));
	}
	.row-text {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		min-width: 0;
		flex: 1;
	}
	.row-prefix {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--color-muted-foreground));
		font-weight: 600;
	}
	.row-title {
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.inbox .row-prefix {
		color: hsl(var(--color-primary));
	}
</style>
