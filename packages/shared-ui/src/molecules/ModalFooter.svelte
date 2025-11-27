<script lang="ts">
	/**
	 * ModalFooter - Standardized modal footer with button layout
	 *
	 * Provides consistent button arrangement for modal dialogs.
	 *
	 * @example Basic cancel/confirm
	 * ```svelte
	 * <ModalFooter
	 *   cancelLabel="Cancel"
	 *   confirmLabel="Save"
	 *   onCancel={() => close()}
	 *   onConfirm={() => save()}
	 * />
	 * ```
	 *
	 * @example With loading state
	 * ```svelte
	 * <ModalFooter
	 *   confirmLabel="Deleting..."
	 *   confirmVariant="danger"
	 *   loading={isDeleting}
	 *   onCancel={close}
	 *   onConfirm={handleDelete}
	 * />
	 * ```
	 */

	import { Button } from '../atoms';

	type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline';

	interface Props {
		/** Cancel button label (omit to hide) */
		cancelLabel?: string;
		/** Confirm button label */
		confirmLabel?: string;
		/** Cancel button callback */
		onCancel?: () => void;
		/** Confirm button callback */
		onConfirm?: () => void | Promise<void>;
		/** Confirm button variant */
		confirmVariant?: ButtonVariant;
		/** Whether confirm action is loading */
		loading?: boolean;
		/** Disable all buttons */
		disabled?: boolean;
		/** Alignment of buttons */
		align?: 'start' | 'center' | 'end' | 'between';
		/** Additional CSS classes */
		class?: string;
	}

	let {
		cancelLabel = 'Cancel',
		confirmLabel = 'Confirm',
		onCancel,
		onConfirm,
		confirmVariant = 'primary',
		loading = false,
		disabled = false,
		align = 'end',
		class: className = '',
	}: Props = $props();

	const alignClasses: Record<string, string> = {
		start: 'justify-start',
		center: 'justify-center',
		end: 'justify-end',
		between: 'justify-between',
	};
</script>

<div class="modal-footer flex gap-3 {alignClasses[align]} {className}">
	{#if cancelLabel && onCancel}
		<Button variant="ghost" onclick={onCancel} disabled={disabled || loading}>
			{cancelLabel}
		</Button>
	{/if}
	{#if confirmLabel && onConfirm}
		<Button variant={confirmVariant} onclick={onConfirm} {loading} {disabled}>
			{confirmLabel}
		</Button>
	{/if}
</div>
