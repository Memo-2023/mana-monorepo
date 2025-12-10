<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Contact } from '$lib/api/contacts';

	interface Props {
		contacts: Contact[];
		onContactClick: (id: string) => void;
		onToggleFavorite: (e: MouseEvent, id: string) => void;
	}

	let { contacts, onContactClick, onToggleFavorite }: Props = $props();

	function getInitials(contact: Contact) {
		const first = contact.firstName?.[0] || '';
		const last = contact.lastName?.[0] || '';
		return (first + last).toUpperCase() || contact.email?.[0]?.toUpperCase() || '?';
	}

	function getDisplayName(contact: Contact) {
		if (contact.displayName) return contact.displayName;
		if (contact.firstName || contact.lastName) {
			return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
		}
		return contact.email || 'Unbekannt';
	}

	function formatPhone(phone: string | null | undefined) {
		if (!phone) return null;
		return phone.replace(/\s/g, '');
	}
</script>

<div class="favorites-list">
	{#each contacts as contact (contact.id)}
		<div
			role="button"
			tabindex="0"
			onclick={() => onContactClick(contact.id)}
			onkeydown={(e) => e.key === 'Enter' && onContactClick(contact.id)}
			class="favorite-row"
		>
			<!-- Avatar -->
			<div class="row-avatar">
				{#if contact.photoUrl}
					<img
						src={contact.photoUrl}
						alt={getDisplayName(contact)}
						class="w-full h-full rounded-full object-cover"
					/>
				{:else}
					{getInitials(contact)}
				{/if}
			</div>

			<!-- Contact Info -->
			<div class="row-content">
				<div class="row-main">
					<h3 class="row-name">{getDisplayName(contact)}</h3>
					{#if contact.jobTitle || contact.company}
						<p class="row-subtitle">
							{[contact.jobTitle, contact.company].filter(Boolean).join(' @ ')}
						</p>
					{/if}
				</div>

				<!-- Contact Details -->
				<div class="row-details">
					{#if contact.email}
						<div class="detail-chip">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
							<span>{contact.email}</span>
						</div>
					{/if}
					{#if contact.phone || contact.mobile}
						<div class="detail-chip">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
								/>
							</svg>
							<span>{contact.mobile || contact.phone}</span>
						</div>
					{/if}
					{#if contact.birthday}
						<div class="detail-chip">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							<span
								>{new Date(contact.birthday).toLocaleDateString('de-DE', {
									day: 'numeric',
									month: 'short',
								})}</span
							>
						</div>
					{/if}
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="row-actions">
				{#if contact.phone || contact.mobile}
					<a
						href="tel:{formatPhone(contact.mobile || contact.phone)}"
						onclick={(e) => e.stopPropagation()}
						class="action-btn action-call"
						title="Anrufen"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
							/>
						</svg>
					</a>
				{/if}
				{#if contact.email}
					<a
						href="mailto:{contact.email}"
						onclick={(e) => e.stopPropagation()}
						class="action-btn action-email"
						title="E-Mail senden"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</a>
				{/if}
				<button
					onclick={(e) => onToggleFavorite(e, contact.id)}
					class="action-btn action-heart"
					title="Aus Favoriten entfernen"
				>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
						/>
					</svg>
				</button>
			</div>
		</div>
	{/each}
</div>

<style>
	.favorites-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.favorite-row {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		padding: 1.25rem 1.5rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.favorite-row:hover {
		border-color: hsl(var(--primary) / 0.4);
		background: hsl(var(--accent));
		transform: translateX(4px);
		box-shadow: 0 4px 12px -2px hsl(var(--foreground) / 0.08);
	}

	.row-avatar {
		width: 72px;
		height: 72px;
		min-width: 72px;
		border-radius: 9999px;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.5rem;
		box-shadow: 0 4px 12px -2px hsl(var(--primary) / 0.3);
	}

	.row-content {
		flex: 1;
		min-width: 0;
	}

	.row-main {
		margin-bottom: 0.5rem;
	}

	.row-name {
		font-weight: 600;
		font-size: 1.125rem;
		color: hsl(var(--foreground));
		margin-bottom: 0.125rem;
	}

	.row-subtitle {
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground));
	}

	.row-details {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.detail-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		background: hsl(var(--muted) / 0.5);
		border-radius: 9999px;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	.row-actions {
		display: flex;
		gap: 0.5rem;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.favorite-row:hover .row-actions {
		opacity: 1;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 9999px;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-call {
		background: hsl(142 76% 36% / 0.1);
		color: hsl(142 76% 36%);
	}

	.action-call:hover {
		background: hsl(142 76% 36%);
		color: white;
		transform: scale(1.1);
	}

	.action-email {
		background: hsl(var(--primary) / 0.1);
		color: hsl(var(--primary));
	}

	.action-email:hover {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		transform: scale(1.1);
	}

	.action-heart {
		background: hsl(0 84% 60% / 0.1);
		color: #ef4444;
	}

	.action-heart:hover {
		background: hsl(0 84% 60% / 0.2);
		transform: scale(1.1);
	}

	@media (max-width: 640px) {
		.row-actions {
			opacity: 1;
			flex-direction: column;
			gap: 0.375rem;
		}

		.action-btn {
			width: 2.25rem;
			height: 2.25rem;
		}

		.row-avatar {
			width: 56px;
			height: 56px;
			min-width: 56px;
			font-size: 1.25rem;
		}

		.row-details {
			display: none;
		}
	}
</style>
