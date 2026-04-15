<!--
  Health page — runner status + manual trigger. Shows foreground tick
  state directly; the server-side mana-ai status falls through to the
  status.mana.how check link because cross-origin /metrics scraping
  from the browser isn't worth the CORS dance.
-->
<script lang="ts">
	import { PageShell } from '$lib/components/page-carousel';
	import { COMPANION_PAGE_META } from './page-meta';
	import { isMissionTickRunning } from '$lib/data/ai/missions/setup';
	import { runDueMissions } from '$lib/data/ai/missions/runner';
	import { productionDeps } from '$lib/data/ai/missions/setup';

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

	const meta = COMPANION_PAGE_META.health;

	let lastRunStats = $state<{ at: string; plansProduced: number; errors: number } | null>(null);
	let manualRunning = $state(false);

	async function triggerManual() {
		manualRunning = true;
		try {
			const results = await runDueMissions(new Date(), productionDeps);
			let plansProduced = 0;
			let errors = 0;
			for (const r of results) {
				plansProduced += r.plannedSteps;
				errors += r.failedSteps;
			}
			lastRunStats = {
				at: new Date().toLocaleString('de-DE'),
				plansProduced,
				errors,
			};
		} catch (err) {
			console.error('[health] manual tick failed:', err);
			lastRunStats = {
				at: new Date().toLocaleString('de-DE'),
				plansProduced: 0,
				errors: 1,
			};
		} finally {
			manualRunning = false;
		}
	}
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
	<div class="h">
		<section>
			<h3>Foreground-Runner (dieser Tab)</h3>
			<dl>
				<dt>Status</dt>
				<dd>
					{#if isMissionTickRunning()}
						<span class="ok">● aktiv · 60 s Interval</span>
					{:else}
						<span class="ko">● nicht aktiv</span>
					{/if}
				</dd>
				{#if lastRunStats}
					<dt>Letzter Manual-Tick</dt>
					<dd>
						{lastRunStats.at} · {lastRunStats.plansProduced} Plans ·
						{lastRunStats.errors} Fehler
					</dd>
				{/if}
			</dl>
			<button type="button" class="run" onclick={triggerManual} disabled={manualRunning}>
				{manualRunning ? 'Läuft…' : '⚡ Manual Tick'}
			</button>
		</section>

		<section>
			<h3>Server-Runner (mana-ai)</h3>
			<p class="desc">
				Läuft unabhängig vom Browser. Status + Uptime werden von Prometheus gescrapet und auf dem
				Status-Dashboard angezeigt.
			</p>
			<a class="external" href="https://status.mana.how" target="_blank" rel="noreferrer">
				status.mana.how öffnen →
			</a>
		</section>

		<section>
			<h3>Datenlage (lokal)</h3>
			<p class="desc">
				Alles in diesem Carousel kommt aus IndexedDB. Kein Server-Call außer beim Planner selbst.
			</p>
		</section>
	</div>
</PageShell>

<style>
	.h {
		padding: 0.75rem 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	section h3 {
		margin: 0 0 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: hsl(var(--color-muted-foreground));
	}
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25rem 0.75rem;
		margin: 0 0 0.5rem;
		font-size: 0.8125rem;
	}
	dt {
		color: hsl(var(--color-muted-foreground));
	}
	dd {
		margin: 0;
	}
	.ok {
		color: #1b7a3a;
	}
	.ko {
		color: #8a1b1b;
	}
	.run {
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-surface));
		cursor: pointer;
		font: inherit;
		font-size: 0.8125rem;
	}
	.run:disabled {
		opacity: 0.5;
	}
	.desc {
		margin: 0 0 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.45;
	}
	.external {
		font-size: 0.8125rem;
		color: hsl(var(--color-primary));
	}
</style>
