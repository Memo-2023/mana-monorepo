<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { locale } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { authStore } from '$lib/stores/auth.svelte';
	import { fetchSubmissions, deleteSubmission, type SubmissionEntry } from '../publish';

	interface Props {
		siteId: string;
	}

	let { siteId }: Props = $props();

	let entries = $state<SubmissionEntry[] | null>(null);
	let loadError = $state<string | null>(null);
	let loading = $state(false);

	async function load() {
		loading = true;
		loadError = null;
		try {
			const token = await authStore.getValidToken();
			if (!token) throw new Error($_('website.submissions.err_unauth'));
			entries = await fetchSubmissions(siteId, token);
		} catch (err) {
			loadError = err instanceof Error ? err.message : String(err);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		siteId;
		void load();
	});

	async function remove(submissionId: string) {
		if (!confirm($_('website.submissions.confirm_delete'))) return;
		const token = await authStore.getValidToken();
		if (!token) return;
		await deleteSubmission(siteId, submissionId, token);
		entries = entries?.filter((e) => e.id !== submissionId) ?? [];
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString(get(locale) ?? 'de');
	}
</script>

<div class="wb-submissions">
	<header class="wb-submissions__head">
		<div>
			<h2>{$_('website.submissions.heading')}</h2>
			<p>{$_('website.submissions.subtitle')}</p>
		</div>
		<button class="wb-btn wb-btn--ghost" onclick={load} disabled={loading}>
			{loading
				? $_('website.submissions.action_loading')
				: $_('website.submissions.action_refresh')}
		</button>
	</header>

	{#if loadError}
		<p class="wb-error">{loadError}</p>
	{:else if entries === null}
		<div class="wb-submissions__empty">{$_('website.submissions.loading')}</div>
	{:else if entries.length === 0}
		<div class="wb-submissions__empty">
			<p>{$_('website.submissions.empty_title')}</p>
			<small>{$_('website.submissions.empty_hint')}</small>
		</div>
	{:else}
		<ul class="wb-submissions__list">
			{#each entries as entry (entry.id)}
				<li class="wb-submission">
					<div class="wb-submission__head">
						<span class="wb-submission__time">{formatDate(entry.createdAt)}</span>
						<div class="wb-submission__actions">
							<span class="wb-pill wb-pill--{entry.status}">{entry.status}</span>
							<button class="wb-btn wb-btn--icon wb-btn--danger" onclick={() => remove(entry.id)}>
								×
							</button>
						</div>
					</div>
					<dl class="wb-submission__payload">
						{#each Object.entries(entry.payload) as [key, value] (key)}
							<dt>{key}</dt>
							<dd>{value}</dd>
						{/each}
					</dl>
					{#if entry.errorMessage}
						<p class="wb-submission__error">{entry.errorMessage}</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.wb-submissions {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 60rem;
		margin: 0 auto;
	}
	.wb-submissions__head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.wb-submissions__head h2 {
		margin: 0;
		font-size: 1.25rem;
	}
	.wb-submissions__head p {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		opacity: 0.6;
	}
	.wb-submissions__empty {
		padding: 3rem 1.5rem;
		text-align: center;
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		opacity: 0.65;
	}
	.wb-submissions__empty small {
		display: block;
		margin-top: 0.25rem;
		opacity: 0.7;
	}
	.wb-submissions__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.wb-submission {
		padding: 0.875rem 1rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
	}
	.wb-submission__head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	.wb-submission__time {
		font-size: 0.8125rem;
		opacity: 0.6;
	}
	.wb-submission__actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.wb-submission__payload {
		display: grid;
		grid-template-columns: 7rem 1fr;
		gap: 0.2rem 0.75rem;
		margin: 0;
		font-size: 0.875rem;
	}
	.wb-submission__payload dt {
		font-weight: 500;
		opacity: 0.6;
	}
	.wb-submission__payload dd {
		margin: 0;
		word-break: break-word;
	}
	.wb-submission__error {
		margin: 0.5rem 0 0;
		color: rgb(248, 113, 113);
		font-size: 0.8125rem;
	}
	.wb-pill {
		font-size: 0.7rem;
		padding: 0.1rem 0.5rem;
		border-radius: 9999px;
	}
	.wb-pill--received {
		background: rgba(16, 185, 129, 0.15);
		color: rgb(110, 231, 183);
	}
	.wb-pill--delivered {
		background: rgba(59, 130, 246, 0.15);
		color: rgb(147, 197, 253);
	}
	.wb-pill--failed {
		background: rgba(248, 113, 113, 0.15);
		color: rgb(252, 165, 165);
	}
	.wb-btn {
		padding: 0.35rem 0.75rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: transparent;
		color: inherit;
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.wb-btn--ghost:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.05);
	}
	.wb-btn--icon {
		width: 1.75rem;
		padding: 0;
		line-height: 1;
	}
	.wb-btn--danger:hover {
		background: rgba(248, 113, 113, 0.15);
		border-color: rgba(248, 113, 113, 0.4);
		color: rgb(248, 113, 113);
	}
	.wb-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.wb-error {
		margin: 0;
		padding: 0.5rem 0.75rem;
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid rgba(248, 113, 113, 0.3);
		border-radius: 0.375rem;
		color: rgb(248, 113, 113);
	}
</style>
