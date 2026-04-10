<!--
  uLoad — Workbench ListView
  Short links list with click counts and quick link creation.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import { encryptRecord } from '$lib/data/crypto';
	import { BaseListView } from '@mana/shared-ui';
	import { Plus, Link as LinkIcon } from '@mana/shared-icons';
	import type { LocalLink, LocalFolder } from './types';
	import type { ViewProps } from '$lib/app-registry';
	import { linkTable } from './collections';
	import { generateShortCode } from './queries';

	let { navigate }: ViewProps = $props();

	const linksQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalLink>('links').toArray();
		const visible = all.filter((l) => !l.deletedAt && l.isActive);
		return decryptRecords('links', visible);
	}, [] as LocalLink[]);

	const foldersQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalFolder>('uloadFolders').toArray();
		return all.filter((f) => !f.deletedAt);
	}, [] as LocalFolder[]);

	const links = $derived(linksQuery.value);
	const folders = $derived(foldersQuery.value);

	const totalClicks = $derived(links.reduce((sum, l) => sum + l.clickCount, 0));

	const sorted = $derived(
		[...links].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 20)
	);

	function hostname(url: string): string {
		try {
			return new URL(url).hostname;
		} catch {
			return url;
		}
	}

	// ── Quick-add link ──────────────────────────────────────
	let showAdd = $state(false);
	let newUrl = $state('');
	let error = $state('');

	async function addLink() {
		const url = newUrl.trim();
		if (!url) return;

		// Auto-prepend https:// if missing
		const fullUrl = /^https?:\/\//.test(url) ? url : `https://${url}`;

		try {
			const parsed = new URL(fullUrl);
			if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
				error = 'Ungültige URL';
				return;
			}
		} catch {
			error = 'Ungültige URL';
			return;
		}

		const shortCode = generateShortCode();

		const newRow: LocalLink = {
			id: crypto.randomUUID(),
			shortCode,
			customCode: null,
			originalUrl: fullUrl,
			title: null,
			description: null,
			isActive: true,
			password: null,
			maxClicks: null,
			expiresAt: null,
			clickCount: 0,
			qrCodeUrl: null,
			utmSource: null,
			utmMedium: null,
			utmCampaign: null,
			folderId: null,
			order: links.length,
		};
		await encryptRecord('links', newRow);
		await linkTable.add(newRow);
		newUrl = '';
		error = '';
	}
</script>

<BaseListView items={sorted} getKey={(l) => l.id} emptyTitle="Keine Links">
	{#snippet header()}
		<span>{links.length} Links</span>
		<span>{totalClicks} Klicks</span>
		<span>{folders.length} Ordner</span>
	{/snippet}

	{#snippet listHeader()}
		{#if showAdd}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					addLink();
				}}
				class="quick-add"
			>
				<LinkIcon size={14} class="icon" />
				<!-- svelte-ignore a11y_autofocus -->
				<input class="add-input" bind:value={newUrl} placeholder="URL einfügen..." autofocus />
				<button type="submit" class="submit-btn" disabled={!newUrl.trim()}>
					<Plus size={14} />
				</button>
			</form>
			{#if error}
				<p class="error-msg">{error}</p>
			{/if}
		{:else}
			<button class="add-toggle" onclick={() => (showAdd = true)}>
				<Plus size={14} />
				<span>Neuer Link</span>
			</button>
		{/if}
	{/snippet}

	{#snippet item(link)}
		<button
			onclick={() =>
				navigate('detail', {
					linkId: link.id,
					_siblingIds: sorted.map((l) => l.id),
					_siblingKey: 'linkId',
				})}
			class="mb-1 w-full min-h-[44px] text-left rounded-md px-3 py-2 transition-colors hover:bg-white/5 cursor-pointer"
		>
			<div class="flex items-center justify-between">
				<p class="truncate text-sm font-medium text-white/80">
					{link.title || link.shortCode}
				</p>
				<span class="shrink-0 text-xs text-white/40">{link.clickCount}</span>
			</div>
			<p class="truncate text-xs text-white/30">{hostname(link.originalUrl)}</p>
			{#if link.customCode}
				<p class="text-xs text-blue-400/60">/{link.customCode}</p>
			{/if}
		</button>
	{/snippet}
</BaseListView>

<style>
	.quick-add {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem;
		margin-bottom: 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
	}

	.quick-add :global(.icon) {
		flex-shrink: 0;
		color: hsl(var(--color-muted-foreground));
	}

	.add-input {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		padding: 0.125rem 0.25rem;
	}
	.add-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.submit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		border-radius: 0.25rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s;
	}
	.submit-btn:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.submit-btn:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.add-toggle {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		width: 100%;
		padding: 0.375rem 0.5rem;
		margin-bottom: 0.625rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.add-toggle:hover {
		border-color: hsl(var(--color-border-strong));
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-surface-hover));
	}

	.error-msg {
		font-size: 0.6875rem;
		color: hsl(var(--color-error));
		margin: -0.25rem 0 0.5rem 0.25rem;
	}
</style>
