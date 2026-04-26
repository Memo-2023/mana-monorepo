<!--
  uLoad — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { formatDate } from '$lib/i18n/format';
	import { db } from '$lib/data/database';
	import { encryptRecord } from '$lib/data/crypto';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalLink } from '../types';

	let { params, goBack }: ViewProps = $props();
	let linkId = $derived(params.linkId as string);

	let editTitle = $state('');
	let editOriginalUrl = $state('');
	let editCustomCode = $state('');
	let editDescription = $state('');
	let editIsActive = $state(true);
	let editExpiresAt = $state('');

	const detail = useDetailEntity<LocalLink>({
		id: () => linkId,
		table: 'links',
		decrypt: true,
		onLoad: (val) => {
			editTitle = val.title ?? '';
			editOriginalUrl = val.originalUrl;
			editCustomCode = val.customCode ?? '';
			editDescription = val.description ?? '';
			editIsActive = val.isActive;
			editExpiresAt = val.expiresAt?.split('T')[0] ?? '';
		},
	});

	async function saveField() {
		detail.blur();
		const diff: Record<string, unknown> = {
			title: editTitle.trim() || undefined,
			originalUrl: editOriginalUrl.trim() || detail.entity?.originalUrl || '',
			customCode: editCustomCode.trim() || undefined,
			description: editDescription.trim() || undefined,
			isActive: editIsActive,
			expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
		};
		await encryptRecord('links', diff);
		await db.table('links').update(linkId, diff);
	}

	async function handleActiveToggle() {
		await db.table('links').update(linkId, {
			isActive: editIsActive,
		});
	}

	async function deleteLink() {
		await db.table('links').update(linkId, {
			deletedAt: new Date().toISOString(),
		});
	}
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel={$_('uload.detail_view.not_found')}
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel={$_('uload.detail_view.confirm_delete')}
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: $_('uload.detail_view.deleted_toast'),
			delete: deleteLink,
			goBack,
		})}
>
	{#snippet body(link)}
		<input
			class="title-input"
			bind:value={editTitle}
			onfocus={detail.focus}
			onblur={saveField}
			placeholder={$_('uload.detail_view.placeholder_title')}
		/>

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">{$_('uload.detail_view.label_url')}</span>
				<input
					class="prop-input"
					bind:value={editOriginalUrl}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="https://..."
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('uload.detail_view.label_short_code')}</span>
				<input
					class="prop-input"
					bind:value={editCustomCode}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder={$_('uload.detail_view.placeholder_short_code')}
				/>
			</div>

			{#if link.shortCode}
				<div class="prop-row">
					<span class="prop-label">{$_('uload.detail_view.label_short_code_legacy')}</span>
					<span class="prop-value">{link.shortCode}</span>
				</div>
			{/if}

			<div class="prop-row">
				<span class="prop-label">{$_('uload.detail_view.label_active')}</span>
				<button
					class="toggle-btn"
					class:active={editIsActive}
					onclick={() => {
						editIsActive = !editIsActive;
						handleActiveToggle();
					}}
				>
					{editIsActive ? $_('uload.detail_view.yes') : $_('uload.detail_view.no')}
				</button>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('uload.detail_view.label_clicks')}</span>
				<span class="prop-value">{link.clickCount}</span>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('uload.detail_view.label_expires_at')}</span>
				<input
					type="date"
					class="prop-input"
					bind:value={editExpiresAt}
					onfocus={detail.focus}
					onblur={saveField}
				/>
			</div>
		</div>

		<div class="section">
			<span class="section-label">{$_('uload.detail_view.section_description')}</span>
			<textarea
				class="description-input"
				bind:value={editDescription}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder={$_('uload.detail_view.placeholder_description')}
				rows={3}
			></textarea>
		</div>

		<div class="meta">
			<span
				>{$_('uload.detail_view.meta_created', {
					values: { date: formatDate(new Date(link.createdAt ?? '')) },
				})}</span
			>
			{#if link.updatedAt}
				<span
					>{$_('uload.detail_view.meta_updated', {
						values: { date: formatDate(new Date(link.updatedAt)) },
					})}</span
				>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>
