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

	import { Warning, WarningCircle, Info, X, Trash, Check } from '@manacore/shared-icons';
	import Modal from './Modal.svelte';
	import { Text } from '../atoms';

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
		{ iconColor: string; iconBg: string; buttonColor: string; buttonHover: string }
	> = {
		danger: {
			iconColor: 'text-red-500',
			iconBg: 'bg-red-500/10',
			buttonColor: 'bg-red-500 text-white',
			buttonHover: 'hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25',
		},
		warning: {
			iconColor: 'text-yellow-500',
			iconBg: 'bg-yellow-500/10',
			buttonColor: 'bg-yellow-500 text-white',
			buttonHover: 'hover:bg-yellow-600 hover:shadow-lg hover:shadow-yellow-500/25',
		},
		info: {
			iconColor: 'text-blue-500',
			iconBg: 'bg-blue-500/10',
			buttonColor: 'bg-blue-500 text-white',
			buttonHover: 'hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25',
		},
	};

	const config = $derived(variantConfig[variant]);

	async function handleConfirm() {
		await onConfirm();
	}
</script>

<Modal {visible} {onClose} {title} maxWidth="sm">
	{#snippet icon()}
		<div class="p-2.5 rounded-xl {config.iconBg} {config.iconColor}">
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
		<div class="flex flex-col gap-3">
			<!-- Confirm Button -->
			<button
				onclick={handleConfirm}
				disabled={loading}
				class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm
					   {config.buttonColor} {config.buttonHover}
					   transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0
					   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
			>
				{#if loading}
					<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
				{:else if variant === 'danger'}
					<Trash size={18} weight="bold" />
				{:else}
					<Check size={18} weight="bold" />
				{/if}
				{confirmLabel}
			</button>

			<!-- Cancel Button -->
			<button
				onclick={onClose}
				disabled={loading}
				class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm
					   bg-foreground/5 text-foreground
					   hover:bg-foreground/10 hover:shadow-md
					   transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0
					   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
			>
				<X size={18} weight="bold" />
				{cancelLabel}
			</button>
		</div>
	{/snippet}
</Modal>
