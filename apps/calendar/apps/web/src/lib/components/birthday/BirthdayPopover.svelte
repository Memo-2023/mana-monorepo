<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { BirthdayEvent } from '$lib/api/birthdays';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { X, User, ArrowSquareOut, Cake } from '@manacore/shared-icons';
	import { format, parseISO } from 'date-fns';
	import { de } from 'date-fns/locale';

	interface Props {
		birthday: BirthdayEvent;
		position: { x: number; y: number };
		onClose: () => void;
	}

	let { birthday, position, onClose }: Props = $props();

	const CONTACTS_WEB_URL = env.PUBLIC_CONTACTS_WEB_URL || 'http://localhost:5184';
	const contactUrl = `${CONTACTS_WEB_URL}/contacts/${birthday.contactId}`;

	// Format the original birthday date
	let birthdayDateFormatted = $derived(() => {
		try {
			const date = parseISO(birthday.birthday);
			return format(date, 'd. MMMM', { locale: de });
		} catch {
			return birthday.birthday;
		}
	});

	// Calculate popover position to stay within viewport
	let adjustedPosition = $derived(() => {
		const popoverWidth = 280;
		const popoverHeight = 200;
		const padding = 16;

		let x = position.x;
		let y = position.y;

		// Check right boundary
		if (x + popoverWidth + padding > window.innerWidth) {
			x = window.innerWidth - popoverWidth - padding;
		}

		// Check bottom boundary
		if (y + popoverHeight + padding > window.innerHeight) {
			y = position.y - popoverHeight - 8; // Show above
		}

		// Check left boundary
		if (x < padding) {
			x = padding;
		}

		// Check top boundary
		if (y < padding) {
			y = padding;
		}

		return { x, y };
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<div
	class="fixed inset-0 z-50"
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="button"
	tabindex="-1"
>
	<!-- Popover -->
	<div
		class="birthday-popover"
		style="left: {adjustedPosition().x}px; top: {adjustedPosition().y}px;"
		role="dialog"
		aria-label="Geburtstag Details"
	>
		<!-- Header -->
		<div class="popover-header">
			<div class="header-content">
				{#if birthday.photoUrl}
					<img src={birthday.photoUrl} alt={birthday.displayName} class="contact-avatar" />
				{:else}
					<div class="contact-avatar-placeholder">
						<Cake size={24} />
					</div>
				{/if}
				<div class="header-info">
					<h3 class="contact-name">{birthday.displayName}</h3>
					{#if settingsStore.showBirthdayAge && birthday.age > 0}
						<p class="contact-age">wird {birthday.age} Jahre alt</p>
					{/if}
				</div>
			</div>
			<button type="button" class="close-btn" onclick={onClose} aria-label="Schließen">
				<X size={18} />
			</button>
		</div>

		<!-- Content -->
		<div class="popover-content">
			<div class="info-row">
				<Cake size={16} class="info-icon" />
				<span>Geburtstag: {birthdayDateFormatted()}</span>
			</div>
		</div>

		<!-- Actions -->
		<div class="popover-actions">
			<a href={contactUrl} target="_blank" rel="noopener noreferrer" class="action-btn primary">
				<User size={16} />
				<span>Kontakt öffnen</span>
				<ArrowSquareOut size={14} class="external-icon" />
			</a>
		</div>
	</div>
</div>

<style>
	.birthday-popover {
		position: fixed;
		width: 280px;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 12px;
		box-shadow: 0 8px 24px hsl(var(--color-foreground) / 0.15);
		overflow: hidden;
		z-index: 51;
	}

	.popover-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 1rem;
		background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
		color: white;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.contact-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid white;
	}

	.contact-avatar-placeholder {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: hsl(var(--color-surface) / 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid white;
		color: white;
	}

	.header-info {
		flex: 1;
		min-width: 0;
	}

	.contact-name {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.contact-age {
		font-size: 0.875rem;
		margin: 0.125rem 0 0;
		opacity: 0.9;
	}

	.close-btn {
		background: hsl(var(--color-surface) / 0.2);
		border: none;
		border-radius: 50%;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: white;
		transition: background 0.2s ease;
	}

	.close-btn:hover {
		background: hsl(var(--color-surface) / 0.3);
	}

	.popover-content {
		padding: 1rem;
	}

	.info-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.info-row :global(.info-icon) {
		color: #ec4899;
		flex-shrink: 0;
	}

	.popover-actions {
		padding: 0.75rem 1rem 1rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.625rem 1rem;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.action-btn.primary {
		background: #ec4899;
		color: white;
	}

	.action-btn.primary:hover {
		background: #db2777;
	}

	.action-btn :global(.external-icon) {
		opacity: 0.7;
		margin-left: auto;
	}
</style>
