<script lang="ts">
	/**
	 * ConfirmationModal - Pre-styled confirmation dialog
	 *
	 * Used for delete confirmations, destructive actions, or any action
	 * that requires user confirmation before proceeding.
	 *
	 * @example Delete confirmation
	 * ```svelte
	 * <ConfirmationModal
	 *   visible={showDeleteModal}
	 *   onClose={() => showDeleteModal = false}
	 *   onConfirm={handleDelete}
	 *   variant="danger"
	 *   title="Delete memo?"
	 *   message="This action cannot be undone."
	 *   confirmLabel="Delete"
	 * />
	 * ```
	 *
	 * @example Warning confirmation
	 * ```svelte
	 * <ConfirmationModal
	 *   visible={showWarningModal}
	 *   onClose={() => showWarningModal = false}
	 *   onConfirm={handleProceed}
	 *   variant="warning"
	 *   title="Are you sure?"
	 *   message="You have unsaved changes that will be lost."
	 * />
	 * ```
	 */

	import { Warning, WarningCircle, Info } from '@manacore/shared-icons';
	import Modal from './Modal.svelte';
	import { Text, Button } from '../atoms';

	type ConfirmationVariant = 'danger' | 'warning' | 'info';

	interface Props {
		/** Whether the modal is visible */
		visible: boolean;
		/** Called when modal is closed (cancel or backdrop click) */
		onClose: () => void;
		/** Called when user confirms the action */
		onConfirm: () => void | Promise<void>;
		/** Visual variant */
		variant?: ConfirmationVariant;
		/** Modal title */
		title: string;
		/** Confirmation message */
		message?: string;
		/** Confirm button label */
		confirmLabel?: string;
		/** Cancel button label */
		cancelLabel?: string;
		/** Whether confirm action is in progress */
		loading?: boolean;
	}

	let {
		visible,
		onClose,
		onConfirm,
		variant = 'danger',
		title,
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		loading = false,
	}: Props = $props();

	const variantConfig: Record<
		ConfirmationVariant,
		{ iconColor: string; buttonVariant: 'danger' | 'primary' }
	> = {
		danger: {
			iconColor: 'text-red-500',
			buttonVariant: 'danger',
		},
		warning: {
			iconColor: 'text-yellow-500',
			buttonVariant: 'primary',
		},
		info: {
			iconColor: 'text-blue-500',
			buttonVariant: 'primary',
		},
	};

	const config = $derived(variantConfig[variant]);

	async function handleConfirm() {
		await onConfirm();
	}
</script>

<Modal {visible} {onClose} {title} maxWidth="sm">
	{#snippet icon()}
		<div class="p-2 rounded-full bg-menu-hover {config.iconColor}">
			{#if variant === 'danger'}
				<Warning size={20} weight="bold" />
			{:else if variant === 'warning'}
				<WarningCircle size={20} weight="bold" />
			{:else}
				<Info size={20} weight="bold" />
			{/if}
		</div>
	{/snippet}

	<div class="text-center py-2">
		{#if message}
			<Text variant="muted" class="leading-relaxed">
				{message}
			</Text>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex gap-3 justify-end">
			<Button variant="ghost" onclick={onClose} disabled={loading}>
				{cancelLabel}
			</Button>
			<Button variant={config.buttonVariant} onclick={handleConfirm} {loading}>
				{confirmLabel}
			</Button>
		</div>
	{/snippet}
</Modal>
