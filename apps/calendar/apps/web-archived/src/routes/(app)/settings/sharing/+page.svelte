<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getContext } from 'svelte';
	import type { Calendar } from '@calendar/shared';
	import { sharesStore } from '$lib/stores/shares.svelte';
	import {
		CaretLeft,
		Plus,
		Trash,
		UserPlus,
		Users,
		Link,
		CheckCircle,
		X,
		EnvelopeSimple,
	} from '@manacore/shared-icons';
	import { Modal, Input } from '@manacore/shared-ui';
	import { PERMISSION_DESCRIPTIONS, type SharePermission } from '@calendar/shared';

	// Get calendars from layout context (live query)
	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');

	// Share form state
	let showShareForm = $state(false);
	let selectedCalendarId = $state('');
	let shareEmail = $state('');
	let sharePermission = $state<SharePermission>('read');
	let isSharing = $state(false);

	// Active calendar for viewing shares
	let viewingCalendarId = $state<string | null>(null);

	async function handleShare() {
		if (!shareEmail.trim() || !selectedCalendarId) return;

		isSharing = true;
		await sharesStore.shareCalendar(selectedCalendarId, shareEmail.trim(), sharePermission);
		isSharing = false;
		showShareForm = false;
		shareEmail = '';
	}

	async function handleRemoveShare(calendarId: string, shareId: string) {
		if (!confirm($_('sharing.confirmRemoveShare'))) return;
		await sharesStore.removeShare(calendarId, shareId);
	}

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}
		await Promise.all([
			Promise.resolve(), // Calendars loaded via live query
			sharesStore.fetchInvitations(),
			sharesStore.fetchSharedWithMe(),
		]);
	});
</script>

<svelte:head>
	<title>{$_('sharing.pageTitle')}</title>
</svelte:head>

<div class="page-container">
	<header class="header">
		<a href="/settings" class="back-button" aria-label={$_('sharing.back')}>
			<CaretLeft size={20} weight="bold" />
		</a>
		<h1 class="title">{$_('sharing.title')}</h1>
		<button
			onclick={() => (showShareForm = true)}
			class="add-button"
			aria-label={$_('sharing.shareCalendar')}
		>
			<Plus size={20} weight="bold" />
		</button>
	</header>

	<!-- Pending Invitations -->
	{#if sharesStore.invitations.length > 0}
		<section class="section">
			<h2 class="section-title">
				<EnvelopeSimple size={18} />
				{$_('sharing.invitations', { values: { count: sharesStore.invitations.length } })}
			</h2>
			{#each sharesStore.invitations as invite (invite.id)}
				<div class="share-card">
					<div class="share-info">
						<span class="share-name">{$_('sharing.calendarInvitation')}</span>
						<span class="share-detail">
							{$_('sharing.permission.' + invite.permission)}
							{$_('sharing.access')}
						</span>
					</div>
					<div class="share-actions">
						<button
							class="btn btn-sm btn-primary"
							onclick={() => sharesStore.acceptInvitation(invite.id)}
						>
							<CheckCircle size={14} />
							{$_('sharing.accept')}
						</button>
						<button
							class="btn btn-sm btn-ghost"
							onclick={() => sharesStore.declineInvitation(invite.id)}
						>
							<X size={14} />
						</button>
					</div>
				</div>
			{/each}
		</section>
	{/if}

	<!-- Shared With Me -->
	{#if sharesStore.sharedWithMe.length > 0}
		<section class="section">
			<h2 class="section-title">
				<Users size={18} />
				{$_('sharing.sharedWithMe')}
			</h2>
			{#each sharesStore.sharedWithMe as share (share.id)}
				<div class="share-card">
					<div class="share-info">
						<span class="share-name">{$_('sharing.sharedCalendar')}</span>
						<span class="share-detail">{$_('sharing.permission.' + share.permission)}</span>
					</div>
				</div>
			{/each}
		</section>
	{/if}

	<!-- My Calendars & Their Shares -->
	<section class="section">
		<h2 class="section-title">
			<UserPlus size={18} />
			{$_('sharing.shareMyCalendars')}
		</h2>

		{#each calendarsCtx.value as calendar (calendar.id)}
			<div class="calendar-card">
				<button
					class="calendar-header"
					onclick={() => {
						if (viewingCalendarId === calendar.id) {
							viewingCalendarId = null;
						} else {
							viewingCalendarId = calendar.id;
							sharesStore.fetchSharesForCalendar(calendar.id);
						}
					}}
				>
					<div class="calendar-info">
						<div class="calendar-color" style="background-color: {calendar.color}"></div>
						<span>{calendar.name}</span>
					</div>
					<span class="expand-icon">{viewingCalendarId === calendar.id ? '▾' : '▸'}</span>
				</button>

				{#if viewingCalendarId === calendar.id}
					{@const calShares = sharesStore.getSharesForCalendar(calendar.id)}
					<div class="shares-list">
						{#if calShares.length === 0}
							<p class="empty-text">{$_('sharing.notSharedYet')}</p>
						{:else}
							{#each calShares as share (share.id)}
								<div class="share-item">
									<div class="share-item-info">
										<span class="share-email">
											{share.sharedWithEmail || $_('sharing.linkShare')}
										</span>
										<span class="share-permission">
											{$_('sharing.permission.' + share.permission)}
										</span>
										{#if share.status === 'pending'}
											<span class="share-status pending">{$_('sharing.pending')}</span>
										{/if}
									</div>
									<button
										class="remove-btn"
										onclick={() => handleRemoveShare(calendar.id, share.id)}
										title={$_('sharing.removeShare')}
									>
										<Trash size={14} />
									</button>
								</div>
							{/each}
						{/if}

						<button
							class="add-share-btn"
							onclick={() => {
								selectedCalendarId = calendar.id;
								showShareForm = true;
							}}
						>
							<Plus size={14} />
							{$_('sharing.addPerson')}
						</button>
					</div>
				{/if}
			</div>
		{/each}
	</section>
</div>

<!-- Share Modal -->
<Modal
	visible={showShareForm}
	onClose={() => (showShareForm = false)}
	title={$_('sharing.shareCalendar')}
	maxWidth="sm"
>
	<div class="share-form">
		<div class="form-field">
			<label>{$_('sharing.form.calendar')}</label>
			<select bind:value={selectedCalendarId} class="select-input">
				{#each calendarsCtx.value as cal}
					<option value={cal.id}>{cal.name}</option>
				{/each}
			</select>
		</div>
		<div class="form-field">
			<label>{$_('sharing.form.email')}</label>
			<Input bind:value={shareEmail} placeholder="name@example.com" />
		</div>
		<div class="form-field">
			<label>{$_('sharing.form.permission')}</label>
			<select bind:value={sharePermission} class="select-input">
				<option value="read">{$_('sharing.permission.read')}</option>
				<option value="write">{$_('sharing.permission.write')}</option>
				<option value="admin">{$_('sharing.permission.admin')}</option>
			</select>
		</div>
	</div>

	{#snippet footer()}
		<div class="modal-footer">
			<button class="btn btn-secondary" onclick={() => (showShareForm = false)}
				>{$_('common.cancel')}</button
			>
			<button
				class="btn btn-primary"
				onclick={handleShare}
				disabled={isSharing || !shareEmail.trim() || !selectedCalendarId}
			>
				{isSharing ? $_('sharing.sharing') : $_('sharing.share')}
			</button>
		</div>
	{/snippet}
</Modal>

<style>
	.page-container {
		max-width: 640px;
		margin: 0 auto;
		padding: 0 1rem 2rem;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 0;
		margin-bottom: 0.5rem;
	}

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
		transition: all 0.2s ease;
	}

	.title {
		flex: 1;
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	.add-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		border: none;
		cursor: pointer;
	}

	.section {
		margin-bottom: 1.5rem;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 0.75rem;
	}

	.share-card,
	.calendar-card {
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--card));
		margin-bottom: 0.5rem;
		overflow: hidden;
	}

	.share-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
	}

	.share-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.share-name {
		font-weight: 500;
		color: hsl(var(--foreground));
		font-size: 0.875rem;
	}

	.share-detail {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.share-actions {
		display: flex;
		gap: 0.375rem;
	}

	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.calendar-header:hover {
		background: hsl(var(--muted) / 0.3);
	}

	.calendar-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.calendar-color {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
	}

	.expand-icon {
		color: hsl(var(--muted-foreground));
	}

	.shares-list {
		padding: 0 1rem 0.75rem;
		border-top: 1px solid hsl(var(--border));
	}

	.share-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
	}

	.share-item + .share-item {
		border-top: 1px solid hsl(var(--border) / 0.5);
	}

	.share-item-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}

	.share-email {
		color: hsl(var(--foreground));
	}

	.share-permission {
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
	}

	.share-status.pending {
		font-size: 0.6875rem;
		color: hsl(38 92% 50%);
		font-weight: 500;
	}

	.empty-text {
		padding: 0.75rem 0;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	.remove-btn {
		display: flex;
		padding: 0.375rem;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
	}

	.remove-btn:hover {
		color: hsl(0 84% 60%);
		background: hsl(0 84% 60% / 0.1);
	}

	.add-share-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0;
		border: none;
		background: transparent;
		color: hsl(var(--primary));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}

	.add-share-btn:hover {
		text-decoration: underline;
	}

	/* Form */
	.share-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-field label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.select-input {
		padding: 0.625rem 0.875rem;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.875rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.15s ease;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
	}
	.btn-primary {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}
	.btn-secondary {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}
	.btn-ghost {
		background: transparent;
		color: hsl(var(--muted-foreground));
	}
	.btn-ghost:hover {
		background: hsl(var(--muted));
	}
</style>
