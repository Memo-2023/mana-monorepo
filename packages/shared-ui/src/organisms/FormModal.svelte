<script lang="ts">
	/**
	 * FormModal - Modal with built-in form handling
	 *
	 * Extends Modal with form submission, validation error display,
	 * and standardized footer buttons.
	 *
	 * @example Basic form modal
	 * ```svelte
	 * <FormModal
	 *   visible={showModal}
	 *   onClose={() => showModal = false}
	 *   onSubmit={handleSubmit}
	 *   title="Create Item"
	 *   submitLabel="Create"
	 * >
	 *   <Input label="Name" bind:value={name} />
	 *   <Textarea label="Description" bind:value={description} />
	 * </FormModal>
	 * ```
	 */

	import type { Snippet } from 'svelte';
	import Modal from './Modal.svelte';
	import { Button, Text } from '../atoms';

	type SubmitVariant = 'primary' | 'danger' | 'success';

	interface Props {
		/** Whether the modal is visible */
		visible: boolean;
		/** Called when modal is closed */
		onClose: () => void;
		/** Called when form is submitted */
		onSubmit: () => void | Promise<void>;
		/** Modal title */
		title: string;
		/** Form content */
		children: Snippet;
		/** Icon snippet for header */
		icon?: Snippet;
		/** Submit button label */
		submitLabel?: string;
		/** Cancel button label */
		cancelLabel?: string;
		/** Submit button variant */
		submitVariant?: SubmitVariant;
		/** Whether submission is in progress */
		loading?: boolean;
		/** Error message to display */
		error?: string | null;
		/** Max width of modal */
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
		/** Whether submit button is disabled */
		submitDisabled?: boolean;
	}

	let {
		visible,
		onClose,
		onSubmit,
		title,
		children,
		icon,
		submitLabel = 'Submit',
		cancelLabel = 'Cancel',
		submitVariant = 'primary',
		loading = false,
		error = null,
		maxWidth = 'md',
		submitDisabled = false
	}: Props = $props();

	async function handleSubmit(e: Event) {
		e.preventDefault();
		await onSubmit();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && e.ctrlKey && !loading && !submitDisabled) {
			handleSubmit(e);
		}
	}
</script>

<Modal {visible} {onClose} {title} {icon} {maxWidth}>
	<form onsubmit={handleSubmit} onkeydown={handleKeydown} class="space-y-4">
		<!-- Error message -->
		{#if error}
			<div class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
				<Text variant="small" class="text-red-600 dark:text-red-400">
					{error}
				</Text>
			</div>
		{/if}

		<!-- Form content -->
		{@render children()}
	</form>

	{#snippet footer()}
		<div class="flex gap-3 justify-end">
			<Button variant="ghost" onclick={onClose} disabled={loading}>
				{cancelLabel}
			</Button>
			<Button
				variant={submitVariant}
				type="submit"
				onclick={handleSubmit}
				{loading}
				disabled={submitDisabled}
			>
				{submitLabel}
			</Button>
		</div>
	{/snippet}
</Modal>
