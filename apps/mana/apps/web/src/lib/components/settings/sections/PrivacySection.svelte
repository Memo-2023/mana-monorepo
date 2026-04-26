<!--
  Privacy section — single overview of every record currently flipped
  to 'public' or 'unlisted', with one-click downgrade per record and
  a global kill-switch.

  Owns no state beyond what's on screen — the source of truth lives
  in each module's store. Re-fetches from Dexie via liveQuery so a
  flip from any other UI surface (module DetailViews) reflects here
  immediately without the user reloading.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { ShieldCheck, Globe, Link as LinkIcon } from '@mana/shared-icons';
	import { liveQuery } from 'dexie';
	import SettingsPanel from '../SettingsPanel.svelte';
	import SettingsSectionHeader from '../SettingsSectionHeader.svelte';
	import { toastStore } from '@mana/shared-ui/toast';
	import {
		listExposedRecords,
		resetAllExposedToSpace,
		setRecordVisibility,
		type ExposedRecord,
	} from '$lib/data/privacy/exposed-records';

	let exposed = $state<ExposedRecord[]>([]);
	let loading = $state(true);
	let busyKey = $state<string | null>(null);
	let confirmKill = $state(false);
	let killing = $state(false);

	// liveQuery refires whenever any of the underlying tables change —
	// flipping a record from a module DetailView immediately updates
	// this list without the user needing to reload.
	$effect(() => {
		const sub = liveQuery(() => listExposedRecords()).subscribe({
			next: (val) => {
				exposed = val;
				loading = false;
			},
			error: (err) => {
				console.error('[privacy] liveQuery error', err);
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});

	const publicRecords = $derived(exposed.filter((r) => r.visibility === 'public'));
	const unlistedRecords = $derived(exposed.filter((r) => r.visibility === 'unlisted'));

	const grouped = $derived.by(() => {
		const map = new Map<string, ExposedRecord[]>();
		for (const rec of exposed) {
			const list = map.get(rec.module) ?? [];
			list.push(rec);
			map.set(rec.module, list);
		}
		return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
	});

	async function setPrivate(rec: ExposedRecord) {
		const key = `${rec.collection}/${rec.id}`;
		busyKey = key;
		try {
			await setRecordVisibility(rec.collection, rec.id, 'space');
			toastStore.show?.($_('settings.privacy.toast_set_private', { values: { title: rec.title } }));
		} catch (e) {
			console.error(e);
			toastStore.show?.(
				$_('settings.privacy.toast_set_private_failed', { values: { title: rec.title } })
			);
		} finally {
			busyKey = null;
		}
	}

	async function killSwitch() {
		killing = true;
		try {
			const { flipped, failed } = await resetAllExposedToSpace();
			confirmKill = false;
			if (failed > 0) {
				toastStore.show?.(
					$_('settings.privacy.toast_kill_partial', { values: { flipped, failed } })
				);
			} else {
				toastStore.show?.($_('settings.privacy.toast_kill_done', { values: { flipped } }));
			}
		} catch (e) {
			console.error(e);
			toastStore.show?.($_('settings.privacy.toast_kill_failed'));
		} finally {
			killing = false;
		}
	}
</script>

<SettingsPanel id="privacy">
	<SettingsSectionHeader
		icon={ShieldCheck}
		title={$_('settings.privacy.title')}
		description={$_('settings.privacy.description')}
		tone="indigo"
	/>

	<div class="summary">
		<div class="summary-card">
			<Globe size={18} />
			<div>
				<span class="summary-count">{publicRecords.length}</span>
				<span class="summary-label">{$_('settings.privacy.summary_public')}</span>
			</div>
		</div>
		<div class="summary-card">
			<LinkIcon size={18} />
			<div>
				<span class="summary-count">{unlistedRecords.length}</span>
				<span class="summary-label">{$_('settings.privacy.summary_unlisted')}</span>
			</div>
		</div>
	</div>

	{#if loading}
		<p class="muted">{$_('settings.privacy.loading')}</p>
	{:else if exposed.length === 0}
		<p class="muted empty">{$_('settings.privacy.empty')}</p>
	{:else}
		<div class="groups">
			{#each grouped as [module, records] (module)}
				<section class="group">
					<header class="group-header">
						<h3>{records[0]?.moduleLabel ?? module}</h3>
						<span class="group-count">{records.length}</span>
					</header>
					<ul class="record-list">
						{#each records as rec (`${rec.collection}/${rec.id}`)}
							<li class="record">
								<div class="record-meta">
									<span class="record-title">{rec.title}</span>
									<span class="record-badge" class:badge-unlisted={rec.visibility === 'unlisted'}>
										{rec.visibility === 'public'
											? $_('settings.privacy.badge_public')
											: $_('settings.privacy.badge_unlisted')}
									</span>
								</div>
								<div class="record-actions">
									{#if rec.openHref}
										<a class="link" href={rec.openHref}>{$_('settings.privacy.open')}</a>
									{/if}
									<button
										class="btn btn-ghost"
										disabled={busyKey === `${rec.collection}/${rec.id}`}
										onclick={() => setPrivate(rec)}
									>
										{$_('settings.privacy.set_private')}
									</button>
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>

		<div class="kill-zone">
			{#if !confirmKill}
				<button class="btn btn-danger" onclick={() => (confirmKill = true)}>
					{$_('settings.privacy.kill_all')}
				</button>
			{:else}
				<div class="confirm">
					<p>
						{exposed.length === 1
							? $_('settings.privacy.confirm_one', { values: { count: exposed.length } })
							: $_('settings.privacy.confirm_other', { values: { count: exposed.length } })}
					</p>
					<div class="confirm-actions">
						<button class="btn" onclick={() => (confirmKill = false)} disabled={killing}>
							{$_('settings.privacy.cancel')}
						</button>
						<button class="btn btn-danger" onclick={killSwitch} disabled={killing}>
							{killing ? $_('settings.privacy.killing') : $_('settings.privacy.confirm_kill')}
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</SettingsPanel>

<style>
	.summary {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 0.75rem;
		margin: 1rem 0 1.5rem;
	}
	.summary-card {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.85rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-card));
	}
	.summary-card div {
		display: flex;
		flex-direction: column;
	}
	.summary-count {
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1;
	}
	.summary-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.muted {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
	}
	.empty {
		padding: 1.25rem;
		text-align: center;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.625rem;
	}

	.groups {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.group {
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		overflow: hidden;
	}
	.group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.65rem 0.9rem;
		background: hsl(var(--color-card));
		border-bottom: 1px solid hsl(var(--color-border));
	}
	.group-header h3 {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 600;
		text-transform: capitalize;
	}
	.group-count {
		font-size: 0.7rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		padding: 0.15rem 0.5rem;
		background: hsl(var(--color-muted) / 0.5);
		border-radius: 999px;
	}

	.record-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.record {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.55rem 0.9rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}
	.record:last-child {
		border-bottom: none;
	}
	.record-meta {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 0;
		flex: 1;
	}
	.record-title {
		font-size: 0.875rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.record-badge {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--color-muted-foreground));
		padding: 0.1rem 0.4rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 999px;
		flex-shrink: 0;
	}
	.record-badge.badge-unlisted {
		color: rgb(99, 102, 241);
		border-color: rgba(99, 102, 241, 0.45);
	}
	.record-actions {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-shrink: 0;
	}

	.link {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		text-decoration: none;
	}
	.link:hover {
		color: inherit;
		text-decoration: underline;
	}

	.btn {
		padding: 0.3rem 0.65rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.4rem;
		background: hsl(var(--color-card));
		color: inherit;
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.btn:hover:not(:disabled) {
		background: hsl(var(--color-muted) / 0.5);
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn-ghost {
		background: transparent;
	}
	.btn-danger {
		background: rgba(248, 113, 113, 0.1);
		border-color: rgba(248, 113, 113, 0.5);
		color: rgb(220, 38, 38);
	}
	.btn-danger:hover:not(:disabled) {
		background: rgba(248, 113, 113, 0.2);
	}

	.kill-zone {
		margin-top: 1.25rem;
		padding-top: 1.25rem;
		border-top: 1px solid hsl(var(--color-border));
	}
	.confirm {
		padding: 1rem;
		background: rgba(248, 113, 113, 0.06);
		border: 1px solid rgba(248, 113, 113, 0.3);
		border-radius: 0.625rem;
	}
	.confirm p {
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
	}
	.confirm-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}
</style>
