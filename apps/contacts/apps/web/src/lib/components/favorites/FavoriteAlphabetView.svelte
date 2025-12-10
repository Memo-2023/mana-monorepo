<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Contact } from '$lib/api/contacts';

	interface Props {
		contacts: Contact[];
		onContactClick: (id: string) => void;
		onToggleFavorite: (e: MouseEvent, id: string) => void;
	}

	let { contacts, onContactClick, onToggleFavorite }: Props = $props();

	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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

	function getFirstLetter(contact: Contact): string {
		const name =
			contact.lastName || contact.firstName || contact.displayName || contact.email || '';
		const letter = name[0]?.toUpperCase() || '#';
		return /[A-Z]/.test(letter) ? letter : '#';
	}

	function formatPhone(phone: string | null | undefined) {
		if (!phone) return null;
		return phone.replace(/\s/g, '');
	}

	// Group contacts by first letter
	let groupedContacts = $derived.by(() => {
		const groups: Record<string, Contact[]> = {};

		// Sort contacts by last name first
		const sorted = [...contacts].sort((a, b) => {
			const aName = (a.lastName || a.firstName || a.displayName || a.email || '').toLowerCase();
			const bName = (b.lastName || b.firstName || b.displayName || b.email || '').toLowerCase();
			return aName.localeCompare(bName, 'de');
		});

		for (const contact of sorted) {
			const letter = getFirstLetter(contact);
			if (!groups[letter]) {
				groups[letter] = [];
			}
			groups[letter].push(contact);
		}

		return groups;
	});

	let availableLetters = $derived(Object.keys(groupedContacts).sort());

	function scrollToLetter(letter: string) {
		const element = document.getElementById(`fav-section-${letter}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
</script>

<div class="alphabet-view">
	<!-- Contacts grouped by letter -->
	<div class="alphabet-sections">
		{#each availableLetters as letter}
			<div id="fav-section-{letter}" class="alphabet-section">
				<!-- Section Header -->
				<div class="section-header">
					<span class="section-letter">{letter}</span>
					<span class="section-count">{groupedContacts[letter].length}</span>
				</div>

				<!-- Contacts in this section -->
				<div class="section-contacts">
					{#each groupedContacts[letter] as contact (contact.id)}
						<div
							role="button"
							tabindex="0"
							onclick={() => onContactClick(contact.id)}
							onkeydown={(e) => e.key === 'Enter' && onContactClick(contact.id)}
							class="alphabet-card"
						>
							<!-- Avatar -->
							<div class="card-avatar">
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
							<div class="card-content">
								<h3 class="card-name">{getDisplayName(contact)}</h3>
								<div class="card-meta">
									{#if contact.jobTitle && contact.company}
										<span>{contact.jobTitle} @ {contact.company}</span>
									{:else if contact.company}
										<span>{contact.company}</span>
									{:else if contact.email}
										<span>{contact.email}</span>
									{/if}
								</div>
								{#if contact.phone || contact.mobile || contact.email}
									<div class="card-chips">
										{#if contact.phone || contact.mobile}
											<span class="chip">
												<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
													/>
												</svg>
												{contact.mobile || contact.phone}
											</span>
										{/if}
										{#if contact.email}
											<span class="chip">
												<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
													/>
												</svg>
												{contact.email}
											</span>
										{/if}
									</div>
								{/if}
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
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
										<path
											d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
										/>
									</svg>
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Alphabet Quick Jump -->
	<div class="alphabet-nav">
		{#each alphabet as letter}
			<button
				type="button"
				class="alphabet-nav-btn"
				class:active={availableLetters.includes(letter)}
				class:disabled={!availableLetters.includes(letter)}
				onclick={() => availableLetters.includes(letter) && scrollToLetter(letter)}
				disabled={!availableLetters.includes(letter)}
			>
				{letter}
			</button>
		{/each}
		{#if availableLetters.includes('#')}
			<button type="button" class="alphabet-nav-btn active" onclick={() => scrollToLetter('#')}>
				#
			</button>
		{/if}
	</div>
</div>

<style>
	.alphabet-view {
		display: flex;
		gap: 1rem;
		position: relative;
	}

	.alphabet-sections {
		flex: 1;
		min-width: 0;
	}

	.alphabet-section {
		margin-bottom: 2rem;
	}

	.section-header {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 1rem;
		margin-bottom: 1rem;
		position: sticky;
		top: 80px;
		z-index: 10;
		background: linear-gradient(135deg, hsl(0 84% 60% / 0.1), hsl(0 84% 60% / 0.05));
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(0 84% 60% / 0.2);
		border-radius: 9999px;
		box-shadow: 0 2px 8px hsl(var(--foreground) / 0.05);
	}

	.section-letter {
		font-size: 1.125rem;
		font-weight: 800;
		color: #ef4444;
		line-height: 1;
	}

	.section-count {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		line-height: 1;
	}

	.section-contacts {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.alphabet-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.alphabet-card:hover {
		border-color: hsl(var(--primary) / 0.4);
		background: hsl(var(--accent));
		box-shadow: 0 4px 12px -2px hsl(var(--foreground) / 0.08);
	}

	.card-avatar {
		width: 64px;
		height: 64px;
		min-width: 64px;
		border-radius: 9999px;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.375rem;
		box-shadow: 0 4px 12px -2px hsl(var(--primary) / 0.3);
	}

	.card-content {
		flex: 1;
		min-width: 0;
	}

	.card-name {
		font-weight: 600;
		font-size: 1.0625rem;
		color: hsl(var(--foreground));
		margin-bottom: 0.25rem;
	}

	.card-meta {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 0.5rem;
	}

	.card-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.1875rem 0.5rem;
		background: hsl(var(--muted) / 0.5);
		border-radius: 9999px;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.card-actions {
		display: flex;
		gap: 0.375rem;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.alphabet-card:hover .card-actions {
		opacity: 1;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
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

	/* Alphabet Navigation */
	.alphabet-nav {
		position: sticky;
		top: 80px;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem 0.25rem;
		height: fit-content;
		background: hsl(var(--background) / 0.75);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--border) / 0.5);
		border-radius: var(--radius-lg, 0.75rem);
		box-shadow: 0 2px 8px hsl(var(--foreground) / 0.05);
	}

	.alphabet-nav-btn {
		width: 1.75rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		background: transparent;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.alphabet-nav-btn.active {
		color: hsl(var(--foreground));
	}

	.alphabet-nav-btn.active:hover {
		background: #ef4444;
		color: white;
	}

	.alphabet-nav-btn.disabled {
		color: hsl(var(--muted-foreground) / 0.3);
		cursor: default;
	}

	@media (max-width: 768px) {
		.alphabet-view {
			flex-direction: column;
		}

		.alphabet-nav {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			flex-direction: row;
			flex-wrap: wrap;
			justify-content: center;
			gap: 0.25rem;
			padding: 0.5rem;
			border-radius: 0;
			border-left: none;
			border-right: none;
			border-bottom: none;
			z-index: 50;
		}

		.alphabet-nav-btn {
			width: 1.5rem;
			height: 1.5rem;
		}

		.alphabet-sections {
			padding-bottom: 4rem;
		}

		.card-actions {
			opacity: 1;
		}

		.card-chips {
			display: none;
		}
	}
</style>
