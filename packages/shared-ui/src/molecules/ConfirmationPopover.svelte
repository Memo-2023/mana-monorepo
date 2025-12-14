<script lang="ts">
	/**
	 * ConfirmationPopover - Inline confirmation dialog
	 *
	 * A wrapper component that shows a confirmation popover directly at the
	 * trigger element position, minimizing mouse travel for quick confirmations.
	 * Uses a portal to escape parent overflow constraints.
	 *
	 * @example Delete confirmation
	 * ```svelte
	 * <ConfirmationPopover
	 *   onConfirm={handleDelete}
	 *   variant="danger"
	 *   title="Löschen?"
	 *   confirmLabel="Löschen"
	 * >
	 *   <button class="delete-btn">🗑️</button>
	 * </ConfirmationPopover>
	 * ```
	 */

	import type { Snippet } from 'svelte';
	import { Trash, Warning, Check, X } from '@manacore/shared-icons';

	type ConfirmationVariant = 'danger' | 'warning' | 'info';
	type Placement = 'top' | 'bottom' | 'left' | 'right';

	interface Props {
		/** Trigger element (usually a button) */
		children: Snippet;
		/** Called when user confirms the action */
		onConfirm: () => void | Promise<void>;
		/** Visual variant */
		variant?: ConfirmationVariant;
		/** Popover title */
		title?: string;
		/** Optional message */
		message?: string;
		/** Confirm button label */
		confirmLabel?: string;
		/** Cancel button label */
		cancelLabel?: string;
		/** Whether confirm action is in progress */
		loading?: boolean;
		/** Preferred placement */
		placement?: Placement;
		/** Disabled state - prevents popover from opening */
		disabled?: boolean;
	}

	let {
		children,
		onConfirm,
		variant = 'danger',
		title = 'Bestätigen?',
		message,
		confirmLabel = 'Bestätigen',
		cancelLabel = 'Abbrechen',
		loading = false,
		placement = 'bottom',
		disabled = false,
	}: Props = $props();

	let visible = $state(false);
	let triggerRef = $state<HTMLDivElement | null>(null);
	let popoverRef = $state<HTMLDivElement | null>(null);
	let confirmBtnRef = $state<HTMLButtonElement | null>(null);
	let popoverPosition = $state({ top: 0, left: 0 });

	// Portal action - moves element to body to escape overflow constraints
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			},
		};
	}

	const variantConfig: Record<
		ConfirmationVariant,
		{
			iconColor: string;
			iconBg: string;
			buttonColor: string;
			buttonHover: string;
			borderColor: string;
		}
	> = {
		danger: {
			iconColor: 'text-red-500',
			iconBg: 'bg-red-500/10',
			buttonColor: 'bg-red-500 text-white',
			buttonHover: 'hover:bg-red-600',
			borderColor: 'border-red-500/20',
		},
		warning: {
			iconColor: 'text-yellow-500',
			iconBg: 'bg-yellow-500/10',
			buttonColor: 'bg-yellow-500 text-white',
			buttonHover: 'hover:bg-yellow-600',
			borderColor: 'border-yellow-500/20',
		},
		info: {
			iconColor: 'text-blue-500',
			iconBg: 'bg-blue-500/10',
			buttonColor: 'bg-blue-500 text-white',
			buttonHover: 'hover:bg-blue-600',
			borderColor: 'border-blue-500/20',
		},
	};

	const config = $derived(variantConfig[variant]);

	function handleTriggerClick(e: MouseEvent) {
		if (disabled || loading) return;
		e.stopPropagation();

		// Get position from the clicked element
		const target = e.currentTarget as HTMLElement;
		if (target) {
			const rect = target.getBoundingClientRect();
			calculatePosition(rect);
		}

		visible = true;

		// Focus confirm button after popover appears
		requestAnimationFrame(() => {
			confirmBtnRef?.focus();
		});
	}

	function calculatePosition(rect: DOMRect) {
		if (rect.width === 0 && rect.height === 0) return;

		const popoverWidth = 240;
		const popoverHeight = 120;
		const gap = 8;

		let top = 0;
		let left = 0;

		switch (placement) {
			case 'top':
				top = rect.top - popoverHeight - gap;
				left = rect.left + rect.width / 2 - popoverWidth / 2;
				break;
			case 'bottom':
				top = rect.bottom + gap;
				left = rect.left + rect.width / 2 - popoverWidth / 2;
				break;
			case 'left':
				top = rect.top + rect.height / 2 - popoverHeight / 2;
				left = rect.left - popoverWidth - gap;
				break;
			case 'right':
				top = rect.top + rect.height / 2 - popoverHeight / 2;
				left = rect.right + gap;
				break;
		}

		// Keep within viewport bounds
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		if (left < 8) left = 8;
		if (left + popoverWidth > viewportWidth - 8) left = viewportWidth - popoverWidth - 8;
		if (top < 8) top = 8;
		if (top + popoverHeight > viewportHeight - 8) {
			if (placement === 'bottom') {
				top = rect.top - popoverHeight - gap;
			}
		}

		popoverPosition = { top, left };
	}

	function handleCancel() {
		if (loading) return;
		visible = false;
	}

	async function handleConfirm() {
		try {
			await onConfirm();
			visible = false;
		} catch {
			// Keep popover open on error
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!visible) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			handleCancel();
		} else if (e.key === 'Enter' && !loading) {
			e.preventDefault();
			handleConfirm();
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (!visible || loading) return;

		const target = e.target as Node;
		// Check if click is inside trigger or popover
		if (triggerRef?.contains(target)) return;
		if (popoverRef?.contains(target)) return;

		visible = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} onclick={handleClickOutside} />

<!-- Trigger wrapper -->
<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="confirmation-popover-trigger" bind:this={triggerRef} onclick={handleTriggerClick}>
	{@render children()}
</div>

<!-- Portal: Popover rendered to body to escape overflow constraints -->
{#if visible}
	<div
		use:portal
		class="confirmation-popover {config.borderColor}"
		bind:this={popoverRef}
		style="position: fixed; top: {popoverPosition.top}px; left: {popoverPosition.left}px; z-index: 999999;"
		role="dialog"
		aria-modal="true"
		aria-label={title}
	>
		<!-- Content -->
		<div class="popover-content">
			<div class="popover-header">
				<div class="popover-icon {config.iconBg} {config.iconColor}">
					{#if variant === 'danger'}
						<Trash size={16} weight="bold" />
					{:else if variant === 'warning'}
						<Warning size={16} weight="bold" />
					{:else}
						<Check size={16} weight="bold" />
					{/if}
				</div>
				<span class="popover-title">{title}</span>
			</div>

			{#if message}
				<p class="popover-message">{message}</p>
			{/if}

			<div class="popover-actions">
				<button type="button" class="btn-cancel" onclick={handleCancel} disabled={loading}>
					<X size={14} weight="bold" />
					{cancelLabel}
				</button>
				<button
					type="button"
					class="btn-confirm {config.buttonColor} {config.buttonHover}"
					onclick={handleConfirm}
					disabled={loading}
					bind:this={confirmBtnRef}
				>
					{#if loading}
						<svg class="spinner" viewBox="0 0 24 24" fill="none">
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
						<Trash size={14} weight="bold" />
					{:else}
						<Check size={14} weight="bold" />
					{/if}
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.confirmation-popover-trigger {
		display: inline-flex;
	}

	.confirmation-popover {
		min-width: 220px;
		max-width: 280px;
		background: var(--color-surface-elevated-3);
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-lg, 12px);
		box-shadow:
			0 10px 25px -5px rgb(0 0 0 / 0.15),
			0 8px 10px -6px rgb(0 0 0 / 0.1);
		animation: popoverIn 150ms ease-out;
	}

	@keyframes popoverIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.popover-content {
		padding: 12px;
	}

	.popover-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.popover-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-md, 8px);
		flex-shrink: 0;
	}

	.popover-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.popover-message {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0 0 12px;
		line-height: 1.4;
	}

	.popover-actions {
		display: flex;
		gap: 8px;
	}

	.btn-cancel,
	.btn-confirm {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 8px 12px;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: var(--radius-md, 8px);
		border: none;
		cursor: pointer;
		transition: all 150ms;
	}

	.btn-cancel {
		background: hsl(var(--color-muted) / 0.5);
		color: hsl(var(--color-foreground));
	}

	.btn-cancel:hover:not(:disabled) {
		background: hsl(var(--color-muted));
	}

	.btn-cancel:disabled,
	.btn-confirm:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 14px;
		height: 14px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
