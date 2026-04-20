<script lang="ts">
	/**
	 * SpaceSwitcher — dropdown that shows the active Space and lets the
	 * user switch to another one or create a new Space.
	 *
	 * Minimal and self-contained so it can be dropped anywhere in the
	 * header without touching the PillNavigation's own config surface.
	 * Uses plain <button> + absolute-positioned <div> for the dropdown
	 * — sufficient for Phase 1; can migrate to a shared-ui Popover
	 * primitive later if the pattern repeats.
	 */

	import { getActiveSpace, loadActiveSpace, type ActiveSpace } from '$lib/data/scope';
	import { SPACE_TYPE_LABELS } from '@mana/shared-branding';
	import { isSpaceType, isSpaceTier } from '@mana/shared-types';
	import SpaceCreateDialog from './SpaceCreateDialog.svelte';

	interface Props {
		/** BCP47 locale for type labels. Falls back to 'de'. */
		locale?: 'de' | 'en';
	}

	let { locale = 'de' }: Props = $props();

	let open = $state(false);
	let createOpen = $state(false);
	let spaces = $state<ActiveSpace[]>([]);
	let loadingList = $state(false);
	let switching = $state(false);
	let loadError = $state<string | null>(null);

	const active = $derived(getActiveSpace());

	function typeLabel(type: ActiveSpace['type']): string {
		return SPACE_TYPE_LABELS[locale][type];
	}

	async function openDropdown() {
		open = true;
		loadingList = true;
		loadError = null;
		try {
			const res = await fetch('/api/auth/organization/list', { credentials: 'include' });
			if (!res.ok) throw new Error(`list failed: ${res.status}`);
			const raw = (await res.json()) as Array<{
				id: string;
				slug?: string | null;
				name: string;
				metadata?: unknown;
			}>;
			spaces = raw.map((o) => {
				const meta = (o.metadata ?? {}) as { type?: unknown; tier?: unknown };
				const type = isSpaceType(meta.type) ? meta.type : 'personal';
				const tier = isSpaceTier(meta.tier) ? meta.tier : 'public';
				return {
					id: o.id,
					slug: o.slug ?? '',
					name: o.name,
					tier,
					type,
					role: 'member', // real role comes via /get-active-member; not needed for display
				};
			});
		} catch (err) {
			loadError = err instanceof Error ? err.message : String(err);
		} finally {
			loadingList = false;
		}
	}

	async function switchTo(id: string) {
		if (switching) return;
		if (id === active?.id) {
			open = false;
			return;
		}
		switching = true;
		try {
			const res = await fetch('/api/auth/organization/set-active', {
				method: 'POST',
				credentials: 'include',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ organizationId: id }),
			});
			if (!res.ok) throw new Error(`set-active failed: ${res.status}`);
			await loadActiveSpace({ force: true });
			// Full reload so every liveQuery re-evaluates against the new active
			// space. A reactive-invalidation path would require each liveQuery
			// to re-subscribe on spaceId change; revisit once the scope wrapper
			// is used widely enough for that to matter.
			if (typeof window !== 'undefined') window.location.reload();
		} catch (err) {
			loadError = err instanceof Error ? err.message : String(err);
		} finally {
			switching = false;
		}
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

<svelte:window onkeydown={handleKey} />

<div class="space-switcher" class:open>
	<button
		type="button"
		class="trigger"
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={() => (open ? (open = false) : openDropdown())}
	>
		<span class="name">{active?.name ?? '…'}</span>
		{#if active}
			<span class="type-badge" data-type={active.type}>{typeLabel(active.type)}</span>
		{/if}
		<span class="chev" aria-hidden="true">▾</span>
	</button>

	{#if open}
		<div class="dropdown" role="menu" aria-label={locale === 'de' ? 'Spaces' : 'Spaces'}>
			{#if loadingList}
				<div class="empty">{locale === 'de' ? 'Lädt …' : 'Loading …'}</div>
			{:else if loadError}
				<div class="error">{loadError}</div>
			{:else if spaces.length === 0}
				<div class="empty">
					{locale === 'de' ? 'Keine Spaces' : 'No spaces'}
				</div>
			{:else}
				{#each spaces as space (space.id)}
					<button
						type="button"
						class="item"
						class:active={space.id === active?.id}
						aria-current={space.id === active?.id ? 'true' : undefined}
						onclick={() => switchTo(space.id)}
						disabled={switching}
					>
						<span class="item-name">{space.name}</span>
						<span class="type-badge" data-type={space.type}>{typeLabel(space.type)}</span>
					</button>
				{/each}
			{/if}
			<hr />
			<button
				type="button"
				class="item create"
				onclick={() => {
					open = false;
					createOpen = true;
				}}
			>
				+ {locale === 'de' ? 'Neuer Space' : 'New space'}
			</button>
		</div>
	{/if}
</div>

<SpaceCreateDialog bind:open={createOpen} {locale} onClose={() => (createOpen = false)} />

<style>
	.space-switcher {
		position: relative;
		display: inline-block;
	}

	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.625rem;
		border-radius: var(--radius-md, 6px);
		background: var(--color-surface-2, transparent);
		border: 1px solid var(--color-border, hsl(0 0% 88%));
		color: var(--color-text, inherit);
		font-size: 0.875rem;
		cursor: pointer;
		min-width: 8rem;
		transition: background-color 120ms ease;
	}

	.trigger:hover {
		background: var(--color-surface-3, hsl(0 0% 96%));
	}

	.name {
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 10rem;
	}

	.chev {
		font-size: 0.75rem;
		opacity: 0.6;
	}

	.type-badge {
		font-size: 0.6875rem;
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm, 4px);
		background: var(--color-surface-3, hsl(0 0% 92%));
		color: var(--color-text-muted, hsl(0 0% 45%));
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.type-badge[data-type='brand'] {
		background: hsl(260 70% 94%);
		color: hsl(260 60% 35%);
	}
	.type-badge[data-type='club'] {
		background: hsl(160 50% 92%);
		color: hsl(160 60% 28%);
	}
	.type-badge[data-type='family'] {
		background: hsl(30 80% 92%);
		color: hsl(30 60% 35%);
	}
	.type-badge[data-type='team'] {
		background: hsl(210 60% 92%);
		color: hsl(210 60% 32%);
	}
	.type-badge[data-type='practice'] {
		background: hsl(340 50% 92%);
		color: hsl(340 55% 38%);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		min-width: 14rem;
		background: var(--color-surface-1, white);
		border: 1px solid var(--color-border, hsl(0 0% 88%));
		border-radius: var(--radius-md, 6px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
		padding: 0.25rem;
		z-index: 50;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.dropdown hr {
		border: 0;
		border-top: 1px solid var(--color-border, hsl(0 0% 88%));
		margin: 0.25rem 0;
	}

	.item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		border-radius: var(--radius-sm, 4px);
		background: transparent;
		border: 0;
		color: var(--color-text, inherit);
		font-size: 0.875rem;
		text-align: left;
		cursor: pointer;
		text-decoration: none;
	}

	.item:hover:not(:disabled) {
		background: var(--color-surface-2, hsl(0 0% 95%));
	}

	.item:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.item.active {
		background: var(--color-surface-2, hsl(0 0% 95%));
		font-weight: 600;
	}

	.item-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item.create {
		color: var(--color-primary, hsl(230 80% 50%));
	}

	.empty,
	.error {
		padding: 0.5rem 0.625rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted, hsl(0 0% 45%));
	}

	.error {
		color: hsl(0 60% 45%);
	}
</style>
