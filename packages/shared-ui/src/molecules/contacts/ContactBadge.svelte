<script lang="ts">
	import { X } from '@mana/shared-icons';
	import ContactAvatar from './ContactAvatar.svelte';
	import type {
		ContactReference,
		ManualContactEntry,
		ContactOrManual,
	} from '@mana/shared-types';

	interface Props {
		/** Contact to display */
		contact: ContactOrManual;
		/** Show remove button */
		removable?: boolean;
		/** Called when remove is clicked */
		onRemove?: () => void;
		/** Size variant */
		size?: 'sm' | 'md';
		/** Show email under name */
		showEmail?: boolean;
	}

	let { contact, removable = false, onRemove, size = 'md', showEmail = false }: Props = $props();

	// Check if this is a manual entry
	const isManual = $derived('isManual' in contact && contact.isManual === true);

	// Get display values
	const displayName = $derived(
		isManual
			? (contact as ManualContactEntry).name || (contact as ManualContactEntry).email
			: (contact as ContactReference).displayName
	);

	const email = $derived(
		isManual ? (contact as ManualContactEntry).email : (contact as ContactReference).email
	);

	const photoUrl = $derived(isManual ? undefined : (contact as ContactReference).photoUrl);

	const avatarSizes = {
		sm: 'xs' as const,
		md: 'sm' as const,
	};
</script>

<span
	class="contact-badge"
	class:size-sm={size === 'sm'}
	class:size-md={size === 'md'}
	class:manual={isManual}
>
	<ContactAvatar {photoUrl} name={displayName} size={avatarSizes[size]} />

	<span class="contact-info">
		<span class="contact-name">{displayName}</span>
		{#if showEmail && email && email !== displayName}
			<span class="contact-email">{email}</span>
		{/if}
	</span>

	{#if removable}
		<button
			type="button"
			onclick={(e) => {
				e.stopPropagation();
				onRemove?.();
			}}
			class="remove-btn"
			aria-label="Entfernen"
		>
			<X size={12} />
		</button>
	{/if}
</span>

<style>
	.contact-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		background: rgba(139, 92, 246, 0.12);
		border: 1px solid rgba(139, 92, 246, 0.2);
		border-radius: 9999px;
		transition: all 0.15s;
	}

	:global(.dark) .contact-badge {
		background: rgba(139, 92, 246, 0.15);
		border-color: rgba(139, 92, 246, 0.25);
	}

	.contact-badge:hover {
		background: rgba(139, 92, 246, 0.18);
		border-color: rgba(139, 92, 246, 0.3);
	}

	:global(.dark) .contact-badge:hover {
		background: rgba(139, 92, 246, 0.22);
		border-color: rgba(139, 92, 246, 0.35);
	}

	/* Manual entry variant (dashed border) */
	.contact-badge.manual {
		background: rgba(107, 114, 128, 0.1);
		border: 1px dashed rgba(107, 114, 128, 0.3);
	}

	:global(.dark) .contact-badge.manual {
		background: rgba(156, 163, 175, 0.12);
		border-color: rgba(156, 163, 175, 0.3);
	}

	/* Size variants */
	.size-sm {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
	}

	.size-md {
		padding: 0.375rem 0.625rem;
		font-size: 0.8125rem;
	}

	.contact-info {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
		min-width: 0;
	}

	.contact-name {
		color: #374151;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 120px;
	}

	:global(.dark) .contact-name {
		color: #f3f4f6;
	}

	.contact-email {
		font-size: 0.625rem;
		color: #6b7280;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 120px;
	}

	:global(.dark) .contact-email {
		color: #9ca3af;
	}

	.remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 0.125rem;
		padding: 0.25rem;
		border: none;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		border-radius: 9999px;
		transition: all 0.15s;
	}

	:global(.dark) .remove-btn {
		color: #9ca3af;
	}

	.remove-btn:hover {
		background: rgba(0, 0, 0, 0.08);
		color: #374151;
	}

	:global(.dark) .remove-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #e5e7eb;
	}
</style>
