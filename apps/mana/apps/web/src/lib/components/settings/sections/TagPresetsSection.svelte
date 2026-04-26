<!--
  Settings → Tag-Presets
  User-level templates for seeding tags into newly-created Spaces.
  See docs/plans/space-scoped-data-model.md §5.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Plus, Trash, Star, CheckCircle } from '@mana/shared-icons';
	import { useUserTagPresets } from '$lib/data/tag-presets/queries';
	import { tagPresetsStore } from '$lib/data/tag-presets/store.svelte';
	import { getActiveSpace } from '$lib/data/scope/active-space.svelte';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import type { TagPresetEntry } from '$lib/data/tag-presets/types';

	const presets = $derived(useUserTagPresets());
	const activeSpace = $derived(getActiveSpace());

	let creating = $state(false);
	let newName = $state('');
	let error = $state<string | null>(null);

	interface LocalTagRow {
		id: string;
		spaceId?: string;
		name?: string;
		color?: string;
		icon?: string | null;
		groupId?: string | null;
		deletedAt?: string;
	}
	interface LocalTagGroupRow {
		id: string;
		spaceId?: string;
		name?: string;
		deletedAt?: string;
	}

	/**
	 * Snapshot the current Space's tags + tagGroups into a preset with
	 * the user-provided name. One-click shortcut — no per-tag editor.
	 */
	async function createFromActiveSpace() {
		error = null;
		if (!newName.trim()) {
			error = $_('settings.tag_presets.name_required');
			return;
		}
		if (!activeSpace) {
			error = $_('settings.tag_presets.no_active_space');
			return;
		}

		creating = true;
		try {
			const rawTags = await db.table<LocalTagRow>('globalTags').toArray();
			const rawGroups = await db.table<LocalTagGroupRow>('tagGroups').toArray();
			const inSpaceTags = rawTags.filter((t) => t.spaceId === activeSpace.id && !t.deletedAt);
			const inSpaceGroups = rawGroups.filter((g) => g.spaceId === activeSpace.id && !g.deletedAt);

			const decryptedTags = await decryptRecords<LocalTagRow>('globalTags', inSpaceTags);
			const decryptedGroups = await decryptRecords<LocalTagGroupRow>('tagGroups', inSpaceGroups);

			const groupNameById = new Map<string, string>();
			for (const g of decryptedGroups) {
				if (g.name) groupNameById.set(g.id, g.name);
			}

			const entries: TagPresetEntry[] = decryptedTags.map((t) => ({
				name: t.name ?? '',
				color: t.color ?? '#6b7280',
				icon: t.icon ?? undefined,
				groupName: t.groupId ? groupNameById.get(t.groupId) : undefined,
			}));

			await tagPresetsStore.createPreset({
				name: newName.trim(),
				tags: entries,
				isDefault: presets.value.length === 0, // first preset becomes default
			});
			newName = '';
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			creating = false;
		}
	}

	async function handleDelete(id: string, name: string) {
		if (!confirm($_('settings.tag_presets.delete_confirm', { values: { name } }))) return;
		await tagPresetsStore.deletePreset(id);
	}

	async function handleSetDefault(id: string) {
		await tagPresetsStore.setDefault(id);
	}
</script>

<section id="tag-presets">
	<header>
		<h2>{$_('settings.tag_presets.title')}</h2>
		<p class="hint">{$_('settings.tag_presets.hint')}</p>
	</header>

	<div class="create-row">
		<input
			type="text"
			placeholder={$_('settings.tag_presets.name_placeholder')}
			bind:value={newName}
			disabled={creating || !activeSpace}
		/>
		<button
			type="button"
			class="primary"
			onclick={createFromActiveSpace}
			disabled={creating || !newName.trim() || !activeSpace}
		>
			<Plus size={14} />
			<span>
				{creating
					? $_('settings.tag_presets.creating')
					: activeSpace
						? $_('settings.tag_presets.create_from', { values: { name: activeSpace.name } })
						: $_('settings.tag_presets.loading_space')}
			</span>
		</button>
	</div>
	{#if error}<p class="error">{error}</p>{/if}

	{#if presets.value.length === 0}
		<p class="empty">{$_('settings.tag_presets.empty')}</p>
	{:else}
		<ul class="preset-list">
			{#each presets.value as preset (preset.id)}
				<li class="preset-row" class:default={preset.isDefault}>
					<div class="preset-info">
						<div class="preset-name">
							{preset.name}
							{#if preset.isDefault}
								<span class="default-badge">
									<CheckCircle size={12} weight="fill" />
									{$_('settings.tag_presets.badge_default')}
								</span>
							{/if}
						</div>
						<div class="preset-meta">
							{preset.tags.length === 1
								? $_('settings.tag_presets.tag_count_one', {
										values: { count: preset.tags.length },
									})
								: $_('settings.tag_presets.tag_count_other', {
										values: { count: preset.tags.length },
									})}
							{#if preset.tags.some((t) => t.groupName)}
								· {$_('settings.tag_presets.with_groups')}
							{/if}
						</div>
					</div>
					<div class="preset-actions">
						{#if !preset.isDefault}
							<button
								type="button"
								class="icon-btn"
								onclick={() => handleSetDefault(preset.id)}
								title={$_('settings.tag_presets.aria_set_default')}
								aria-label={$_('settings.tag_presets.aria_set_default')}
							>
								<Star size={16} />
							</button>
						{/if}
						<button
							type="button"
							class="icon-btn danger"
							onclick={() => handleDelete(preset.id, preset.name)}
							title={$_('settings.tag_presets.aria_delete')}
							aria-label={$_('settings.tag_presets.aria_delete')}
						>
							<Trash size={16} />
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		color: hsl(var(--color-foreground));
	}

	header {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	h2 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
	}

	.hint {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
		line-height: 1.5;
	}

	.create-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.create-row input {
		flex: 1 1 220px;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 8px;
		background: hsl(var(--color-input, var(--color-background, var(--color-card))));
		color: hsl(var(--color-foreground));
		font: inherit;
		font-size: 0.875rem;
	}

	.create-row input:focus {
		outline: none;
		border-color: var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%)));
	}

	.primary {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		background: var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%)));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		border: 0;
		border-radius: 8px;
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}

	.primary:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.error {
		color: hsl(0 70% 55%);
		font-size: 0.8125rem;
		margin: 0;
	}

	.empty {
		padding: 1rem 1.125rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 10px;
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		margin: 0;
	}

	.preset-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.preset-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0.875rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 10px;
		background: hsl(var(--color-card));
	}

	.preset-row.default {
		border-color: color-mix(
			in srgb,
			var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%))) 50%,
			transparent
		);
		background: color-mix(
			in srgb,
			var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%))) 6%,
			hsl(var(--color-card))
		);
	}

	.preset-info {
		min-width: 0;
		flex: 1;
	}

	.preset-name {
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.default-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.6875rem;
		padding: 0.125rem 0.4rem;
		background: var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%)));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		border-radius: 9999px;
		font-weight: 500;
	}

	.preset-meta {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.125rem;
	}

	.preset-actions {
		display: flex;
		gap: 0.25rem;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		border-radius: 6px;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition:
			color 120ms ease,
			border-color 120ms ease,
			background 120ms ease;
	}

	.icon-btn:hover {
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-muted) / 0.5);
	}

	.icon-btn.danger:hover {
		color: hsl(0 70% 55%);
		border-color: color-mix(in srgb, hsl(0 70% 55%) 40%, transparent);
		background: color-mix(in srgb, hsl(0 70% 55%) 8%, transparent);
	}
</style>
