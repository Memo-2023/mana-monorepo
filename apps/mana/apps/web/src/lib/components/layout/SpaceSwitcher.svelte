<script lang="ts">
	/**
	 * SpaceSwitcher — dropdown that shows the active Space and lets the
	 * user switch to another one or create a new Space.
	 *
	 * Visual match to @mana/shared-ui Pill / PillDropdown so the trigger
	 * reads as a native member of the PillNav row. The menu uses fixed
	 * positioning with getBoundingClientRect coordinates so it escapes
	 * the PillNav's overflow-x container (which would otherwise clip it).
	 * A full-viewport backdrop handles click-outside.
	 */

	import { onDestroy } from 'svelte';
	import { getActiveSpace, loadActiveSpace, authFetch, type ActiveSpace } from '$lib/data/scope';
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

	let triggerEl: HTMLButtonElement | null = $state(null);
	let menuPos = $state({ top: 0, left: 0, minWidth: 240 });

	const active = $derived(getActiveSpace());

	function typeLabel(type: ActiveSpace['type']): string {
		return SPACE_TYPE_LABELS[locale][type];
	}

	function positionMenu() {
		if (!triggerEl) return;
		const rect = triggerEl.getBoundingClientRect();
		// Open upward: the PillNav sits on viewport bottom; align menu's
		// bottom edge to 8px above the trigger top.
		menuPos = {
			top: rect.top - 8,
			left: rect.left,
			minWidth: Math.max(240, rect.width),
		};
	}

	async function openDropdown() {
		positionMenu();
		open = true;
		loadingList = true;
		loadError = null;
		try {
			const res = await authFetch('/api/auth/organization/list');
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
					role: 'member',
				};
			});
		} catch (err) {
			loadError = err instanceof Error ? err.message : String(err);
		} finally {
			loadingList = false;
		}
	}

	function closeDropdown() {
		open = false;
	}

	async function switchTo(id: string) {
		if (switching) return;
		if (id === active?.id) {
			closeDropdown();
			return;
		}
		switching = true;
		try {
			const res = await authFetch('/api/auth/organization/set-active', {
				method: 'POST',
				body: JSON.stringify({ organizationId: id }),
			});
			if (!res.ok) throw new Error(`set-active failed: ${res.status}`);
			await loadActiveSpace({ force: true });
			if (typeof window !== 'undefined') window.location.reload();
		} catch (err) {
			loadError = err instanceof Error ? err.message : String(err);
		} finally {
			switching = false;
		}
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') closeDropdown();
	}

	function handleResize() {
		if (open) positionMenu();
	}

	if (typeof window !== 'undefined') {
		window.addEventListener('resize', handleResize);
		window.addEventListener('scroll', handleResize, true);
	}
	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('scroll', handleResize, true);
		}
	});
</script>

<svelte:window onkeydown={handleKey} />

<button
	bind:this={triggerEl}
	type="button"
	class="pill pill-sm trigger"
	class:active={open}
	aria-haspopup="menu"
	aria-expanded={open}
	onclick={() => (open ? closeDropdown() : openDropdown())}
>
	<span class="name">{active?.name ?? '…'}</span>
	{#if active}
		<span class="type-dot" data-type={active.type} aria-hidden="true"></span>
	{/if}
	<svg class="chev" class:rotated={open} viewBox="0 0 24 24" aria-hidden="true">
		<path
			fill="none"
			stroke="currentColor"
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M19 9l-7 7-7-7"
		/>
	</svg>
</button>

{#if open}
	<button
		type="button"
		class="backdrop"
		aria-label="Menü schließen"
		onclick={closeDropdown}
		tabindex="-1"
	></button>

	<div
		class="menu"
		role="menu"
		aria-label={locale === 'de' ? 'Spaces' : 'Spaces'}
		style="--menu-top: {menuPos.top}px; --menu-left: {menuPos.left}px; --menu-min-w: {menuPos.minWidth}px;"
	>
		{#if loadingList}
			<div class="menu-empty">{locale === 'de' ? 'Lädt …' : 'Loading …'}</div>
		{:else if loadError}
			<div class="menu-error">{loadError}</div>
		{:else if spaces.length === 0}
			<div class="menu-empty">
				{locale === 'de' ? 'Keine Spaces' : 'No spaces'}
			</div>
		{:else}
			{#each spaces as space (space.id)}
				<button
					type="button"
					class="menu-item"
					class:is-active={space.id === active?.id}
					aria-current={space.id === active?.id ? 'true' : undefined}
					onclick={() => switchTo(space.id)}
					disabled={switching}
				>
					<span class="type-dot" data-type={space.type} aria-hidden="true"></span>
					<span class="item-name">{space.name}</span>
					<span class="type-label" data-type={space.type}>{typeLabel(space.type)}</span>
				</button>
			{/each}
		{/if}

		<div class="menu-divider"></div>

		{#if active && active.type !== 'personal'}
			<a class="menu-item menu-link" href="/spaces/members" onclick={closeDropdown} role="menuitem">
				<span class="icon-placeholder" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="16" height="16">
						<path
							fill="none"
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M9 11a4 4 0 100-8 4 4 0 000 8zm7 0a4 4 0 00-1-7.75"
						/>
					</svg>
				</span>
				<span class="item-name">
					{locale === 'de' ? 'Mitglieder verwalten' : 'Manage members'}
				</span>
			</a>
		{/if}

		<button
			type="button"
			class="menu-item menu-create"
			onclick={() => {
				closeDropdown();
				createOpen = true;
			}}
			role="menuitem"
		>
			<span class="icon-placeholder" aria-hidden="true">
				<svg viewBox="0 0 24 24" width="16" height="16">
					<path
						fill="none"
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 5v14M5 12h14"
					/>
				</svg>
			</span>
			<span class="item-name">
				{locale === 'de' ? 'Neuer Space' : 'New space'}
			</span>
		</button>
	</div>
{/if}

<SpaceCreateDialog bind:open={createOpen} {locale} onClose={() => (createOpen = false)} />

<style>
	/* Trigger — mirrors @mana/shared-ui Pill (size sm) so it reads as a
		 native member of the PillNav row. */
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s ease;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		box-shadow:
			0 1px 2px hsl(0 0% 0% / 0.05),
			0 2px 6px hsl(0 0% 0% / 0.04);
	}

	.pill-sm {
		height: 36px;
	}

	.pill:hover {
		background: hsl(var(--color-surface-hover, var(--color-card)));
		border-color: hsl(var(--color-border-strong, var(--color-border)));
	}

	.pill.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 20%,
			white 80%
		);
		border-color: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.5)));
		color: #1a1a1a;
	}

	:global(.dark) .pill.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 30%,
			transparent 70%
		);
		color: hsl(var(--color-foreground));
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 8rem;
	}

	.type-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: hsl(0 0% 60%);
		flex-shrink: 0;
	}

	.type-dot[data-type='personal'] {
		background: hsl(220 10% 55%);
	}
	.type-dot[data-type='brand'] {
		background: hsl(260 60% 55%);
	}
	.type-dot[data-type='club'] {
		background: hsl(160 55% 40%);
	}
	.type-dot[data-type='family'] {
		background: hsl(30 75% 50%);
	}
	.type-dot[data-type='team'] {
		background: hsl(210 60% 50%);
	}
	.type-dot[data-type='practice'] {
		background: hsl(340 55% 50%);
	}

	.chev {
		width: 14px;
		height: 14px;
		opacity: 0.6;
		transition: transform 0.15s ease;
	}

	.chev.rotated {
		transform: rotate(180deg);
	}

	/* Backdrop — full-viewport click-outside catcher. Transparent but
		 blocks clicks from reaching elements under the menu. */
	.backdrop {
		position: fixed;
		inset: 0;
		background: transparent;
		border: 0;
		z-index: 1500;
		cursor: default;
	}

	/* Menu — escapes PillNav's overflow-x container via position:fixed.
		 transform: translateY(-100%) anchors the menu's bottom to
		 --menu-top (the 8px-offset trigger top). */
	.menu {
		position: fixed;
		top: var(--menu-top);
		left: var(--menu-left);
		transform: translateY(-100%);
		min-width: var(--menu-min-w);
		max-width: 320px;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 12px;
		box-shadow:
			0 10px 30px hsl(0 0% 0% / 0.12),
			0 4px 10px hsl(0 0% 0% / 0.06);
		padding: 0.375rem;
		z-index: 1501;
		display: flex;
		flex-direction: column;
		gap: 2px;
		animation: menu-in 120ms ease-out;
	}

	@keyframes menu-in {
		from {
			opacity: 0;
			transform: translateY(-100%) translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(-100%);
		}
	}

	.menu-divider {
		height: 1px;
		background: hsl(var(--color-border));
		margin: 0.25rem 0;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		border-radius: 8px;
		background: transparent;
		border: 0;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.1s ease;
	}

	.menu-item:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover, var(--color-muted, 0 0% 96%)));
	}

	.menu-item:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.menu-item.is-active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 15%,
			transparent 85%
		);
	}

	.item-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.type-label {
		font-size: 0.6875rem;
		font-weight: 500;
		padding: 2px 8px;
		border-radius: 9999px;
		background: hsl(var(--color-muted, 0 0% 94%));
		color: hsl(var(--color-muted-foreground, 0 0% 40%));
		text-transform: uppercase;
		letter-spacing: 0.02em;
		flex-shrink: 0;
	}

	.type-label[data-type='brand'] {
		background: hsl(260 60% 95%);
		color: hsl(260 55% 35%);
	}
	.type-label[data-type='club'] {
		background: hsl(160 45% 93%);
		color: hsl(160 55% 28%);
	}
	.type-label[data-type='family'] {
		background: hsl(30 70% 93%);
		color: hsl(30 55% 35%);
	}
	.type-label[data-type='team'] {
		background: hsl(210 55% 93%);
		color: hsl(210 55% 32%);
	}
	.type-label[data-type='practice'] {
		background: hsl(340 50% 94%);
		color: hsl(340 50% 38%);
	}

	:global(.dark) .type-label {
		background: hsl(var(--color-muted, 0 0% 20%));
		color: hsl(var(--color-muted-foreground, 0 0% 75%));
	}
	:global(.dark) .type-label[data-type='brand'] {
		background: hsl(260 40% 25%);
		color: hsl(260 80% 85%);
	}
	:global(.dark) .type-label[data-type='club'] {
		background: hsl(160 35% 20%);
		color: hsl(160 70% 80%);
	}
	:global(.dark) .type-label[data-type='family'] {
		background: hsl(30 40% 22%);
		color: hsl(30 80% 82%);
	}
	:global(.dark) .type-label[data-type='team'] {
		background: hsl(210 40% 22%);
		color: hsl(210 70% 82%);
	}
	:global(.dark) .type-label[data-type='practice'] {
		background: hsl(340 35% 23%);
		color: hsl(340 65% 82%);
	}

	.icon-placeholder {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		color: hsl(var(--color-muted-foreground, 0 0% 45%));
		flex-shrink: 0;
	}

	.menu-create {
		color: hsl(var(--color-primary, var(--color-primary-500, 230 80% 50%)));
	}

	.menu-create .icon-placeholder {
		color: inherit;
	}

	.menu-empty,
	.menu-error {
		padding: 0.5rem 0.625rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground, 0 0% 45%));
	}

	.menu-error {
		color: hsl(0 65% 50%);
	}
</style>
