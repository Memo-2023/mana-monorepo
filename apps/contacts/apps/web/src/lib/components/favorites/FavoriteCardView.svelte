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

	// Generate a consistent gradient based on contact name
	function getGradient(contact: Contact) {
		const name = getDisplayName(contact);
		const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
		const gradients = [
			'from-rose-500 to-pink-600',
			'from-violet-500 to-purple-600',
			'from-blue-500 to-indigo-600',
			'from-cyan-500 to-teal-600',
			'from-emerald-500 to-green-600',
			'from-amber-500 to-orange-600',
			'from-red-500 to-rose-600',
			'from-fuchsia-500 to-pink-600',
		];
		return gradients[hash % gradients.length];
	}

	function formatPhone(phone: string | null | undefined) {
		if (!phone) return null;
		return phone.replace(/\s/g, '');
	}
</script>

<div class="favorites-grid">
	{#each contacts as contact (contact.id)}
		<div
			role="button"
			tabindex="0"
			onclick={() => onContactClick(contact.id)}
			onkeydown={(e) => e.key === 'Enter' && onContactClick(contact.id)}
			class="favorite-card"
		>
			<!-- Decorative background gradient -->
			<div class="card-bg bg-gradient-to-br {getGradient(contact)}"></div>

			<!-- Favorite badge -->
			<button
				onclick={(e) => onToggleFavorite(e, contact.id)}
				class="favorite-badge"
				title="Aus Favoriten entfernen"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
					/>
				</svg>
			</button>

			<!-- Large Avatar -->
			<div class="card-avatar bg-gradient-to-br {getGradient(contact)}">
				{#if contact.photoUrl}
					<img
						src={contact.photoUrl}
						alt={getDisplayName(contact)}
						class="w-full h-full rounded-full object-cover"
					/>
				{:else}
					<span class="text-white font-bold text-3xl">{getInitials(contact)}</span>
				{/if}
			</div>

			<!-- Contact Info -->
			<div class="card-content">
				<h3 class="card-name">{getDisplayName(contact)}</h3>
				{#if contact.jobTitle}
					<p class="card-job">{contact.jobTitle}</p>
				{/if}
				{#if contact.company}
					<p class="card-company">{contact.company}</p>
				{/if}

				<!-- Contact Details -->
				<div class="card-details">
					{#if contact.email}
						<div class="detail-row">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
							<span class="detail-text">{contact.email}</span>
						</div>
					{/if}
					{#if contact.phone || contact.mobile}
						<div class="detail-row">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
								/>
							</svg>
							<span class="detail-text">{contact.mobile || contact.phone}</span>
						</div>
					{/if}
					{#if contact.birthday}
						<div class="detail-row">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z"
								/>
							</svg>
							<span class="detail-text"
								>{new Date(contact.birthday).toLocaleDateString('de-DE', {
									day: 'numeric',
									month: 'long',
								})}</span
							>
						</div>
					{/if}
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="card-actions">
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
			</div>
		</div>
	{/each}
</div>

<style>
	.favorites-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 1.5rem;
	}

	@media (min-width: 640px) {
		.favorites-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.favorites-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.favorite-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 1.5rem 1.5rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 1.25rem;
		cursor: pointer;
		transition: all 0.3s ease;
		overflow: hidden;
	}

	.favorite-card:hover {
		transform: translateY(-6px);
		box-shadow:
			0 20px 40px -12px hsl(var(--foreground) / 0.15),
			0 4px 12px -2px hsl(var(--foreground) / 0.1);
		border-color: hsl(var(--primary) / 0.3);
	}

	.card-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 80px;
		opacity: 0.15;
	}

	.favorite-badge {
		position: absolute;
		top: 1rem;
		right: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		background: hsl(var(--background) / 0.9);
		backdrop-filter: blur(8px);
		border: none;
		border-radius: 9999px;
		color: #ef4444;
		cursor: pointer;
		transition: all 0.2s ease;
		z-index: 10;
	}

	.favorite-badge:hover {
		transform: scale(1.15);
		background: hsl(0 84% 60% / 0.15);
	}

	.card-avatar {
		position: relative;
		width: 120px;
		height: 120px;
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.25rem;
		box-shadow:
			0 8px 24px -4px hsl(var(--foreground) / 0.2),
			0 0 0 4px hsl(var(--background));
		z-index: 5;
	}

	.card-content {
		text-align: center;
		width: 100%;
		min-height: 100px;
	}

	.card-name {
		font-size: 1.25rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		margin-bottom: 0.25rem;
	}

	.card-job {
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground));
	}

	.card-company {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground) / 0.8);
		margin-bottom: 1rem;
	}

	.card-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--border) / 0.5);
	}

	.detail-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.8125rem;
	}

	.detail-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.card-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--border) / 0.5);
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: 9999px;
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
</style>
