<!--
  JobsList — index of all bulk-import jobs in the active space, newest
  first. Click → /articles/import/[jobId].

  Plan: docs/plans/articles-bulk-import.md.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { useImportJobs } from '../queries';
	import type { ArticleImportJob } from '../types';

	const jobs$ = useImportJobs();
	const jobs = $derived(jobs$.value);

	function progress(job: ArticleImportJob): string {
		const done = job.savedCount + job.duplicateCount + job.errorCount;
		return `${done} / ${job.totalUrls}`;
	}

	function statusLabel(s: ArticleImportJob['status']): string {
		switch (s) {
			case 'queued':
				return 'Wartet';
			case 'running':
				return 'Läuft';
			case 'paused':
				return 'Pausiert';
			case 'done':
				return 'Fertig';
			case 'cancelled':
				return 'Abgebrochen';
		}
	}
</script>

{#if jobs.length > 0}
	<section class="jobs-list">
		<h2>Bisherige Imports</h2>
		<ul>
			{#each jobs as job (job.id)}
				<button type="button" class="row" onclick={() => goto(`/articles/import/${job.id}`)}>
					<span class="status status-{job.status}">{statusLabel(job.status)}</span>
					<span class="progress">{progress(job)}</span>
					<span class="meta">
						{#if job.errorCount > 0}<span class="meta-err">{job.errorCount} Fehler</span>{/if}
						{#if job.duplicateCount > 0}
							<span class="meta-dup">{job.duplicateCount} Duplikate</span>
						{/if}
						{#if job.warningCount > 0}
							<span class="meta-warn">{job.warningCount} Warnungen</span>
						{/if}
					</span>
					<span class="when">{new Date(job.createdAt).toLocaleString('de-DE')}</span>
				</button>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.jobs-list {
		max-width: 760px;
		margin: 1.5rem auto 0;
		padding: 0 1.5rem;
	}
	.jobs-list h2 {
		margin: 0 0 0.65rem 0;
		font-size: 1.05rem;
	}
	.jobs-list ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.row {
		display: grid;
		grid-template-columns: 6rem 5rem 1fr auto;
		gap: 0.65rem;
		align-items: center;
		padding: 0.55rem 0.75rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		border-radius: 0.55rem;
		background: var(--color-surface, transparent);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	.row:hover {
		border-color: color-mix(in srgb, #f97316 60%, transparent);
	}
	.status {
		font-size: 0.78rem;
		font-weight: 500;
		padding: 0.12rem 0.5rem;
		border-radius: 999px;
		text-align: center;
	}
	.status-queued,
	.status-paused {
		background: color-mix(in srgb, #64748b 12%, transparent);
		color: #475569;
	}
	.status-running {
		background: color-mix(in srgb, #f97316 14%, transparent);
		color: #ea580c;
	}
	.status-done {
		background: color-mix(in srgb, #16a34a 14%, transparent);
		color: #16a34a;
	}
	.status-cancelled {
		background: rgba(239, 68, 68, 0.14);
		color: #ef4444;
	}
	.progress {
		font-variant-numeric: tabular-nums;
		font-size: 0.9rem;
	}
	.meta {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		font-size: 0.78rem;
		color: var(--color-text-muted, #64748b);
	}
	.meta-err {
		color: #ef4444;
	}
	.meta-warn {
		color: #b45309;
	}
	.meta-dup {
		color: var(--color-text-muted, #64748b);
	}
	.when {
		font-size: 0.78rem;
		color: var(--color-text-muted, #64748b);
		white-space: nowrap;
	}
</style>
