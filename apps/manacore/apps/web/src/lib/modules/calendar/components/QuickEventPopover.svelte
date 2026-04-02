<script lang="ts">
	import { getContext, onMount, tick } from 'svelte';
	import { getDefaultCalendar, getCalendarColor } from '../queries';
	import type { Calendar } from '../types';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { X } from '@manacore/shared-icons';

	interface Props {
		startTime: Date;
		endTime: Date;
		position: { x: number; y: number };
		onSave: (data: {
			title: string;
			calendarId: string;
			startTime: string;
			endTime: string;
			isAllDay: boolean;
			location: string | null;
		}) => void;
		onClose: () => void;
		onExpand?: () => void;
	}

	let { startTime, endTime, position, onSave, onClose, onExpand }: Props = $props();

	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');

	let title = $state('');
	let location = $state('');
	let titleInput: HTMLInputElement;
	let popoverEl: HTMLDivElement;

	// Calculated popover position (adjusted to stay in viewport)
	let popoverPos = $state({ top: 0, left: 0 });

	const defaultCalendar = $derived(getDefaultCalendar(calendarsCtx.value));
	const calendarColor = $derived(getCalendarColor(calendarsCtx.value, defaultCalendar?.id || ''));

	const timeLabel = $derived(
		`${format(startTime, 'EE d. MMM', { locale: de })} ${format(startTime, 'HH:mm')} – ${format(endTime, 'HH:mm')}`
	);

	function handleSubmit() {
		if (!title.trim()) return;
		onSave({
			title: title.trim(),
			calendarId: defaultCalendar?.id || '',
			startTime: startTime.toISOString(),
			endTime: endTime.toISOString(),
			isAllDay: false,
			location: location.trim() || null,
		});
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		} else if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}

	onMount(async () => {
		await tick();
		if (popoverEl) {
			const rect = popoverEl.getBoundingClientRect();
			const vw = window.innerWidth;
			const vh = window.innerHeight;

			let left = position.x + 12;
			let top = position.y - rect.height / 2;

			// Keep in viewport
			if (left + rect.width > vw - 16) left = position.x - rect.width - 12;
			if (left < 16) left = 16;
			if (top < 16) top = 16;
			if (top + rect.height > vh - 16) top = vh - rect.height - 16;

			popoverPos = { top, left };
		}
		titleInput?.focus();
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="popover-backdrop" onclick={onClose}></div>

<!-- Popover -->
<div
	bind:this={popoverEl}
	class="popover"
	style="top: {popoverPos.top}px; left: {popoverPos.left}px;"
	role="dialog"
	aria-label="Termin erstellen"
>
	<!-- Color accent bar -->
	<div class="accent-bar" style="background-color: {calendarColor};"></div>

	<div class="popover-content">
		<!-- Title input -->
		<input
			bind:this={titleInput}
			bind:value={title}
			type="text"
			placeholder="Termin hinzufügen"
			class="title-input"
		/>

		<!-- Time display -->
		<div class="time-row">
			<span class="time-label">{timeLabel}</span>
		</div>

		<!-- Location (optional) -->
		<input bind:value={location} type="text" placeholder="Ort hinzufügen" class="location-input" />

		<!-- Actions -->
		<div class="action-row">
			{#if onExpand}
				<button type="button" onclick={onExpand} class="expand-btn"> Weitere Optionen </button>
			{/if}
			<div class="action-right">
				<button type="button" onclick={onClose} class="cancel-btn"> Abbrechen </button>
				<button
					type="button"
					onclick={handleSubmit}
					disabled={!title.trim()}
					class="save-btn"
					style="background-color: {calendarColor};"
				>
					Speichern
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.popover-backdrop {
		position: fixed;
		inset: 0;
		z-index: 99;
	}

	.popover {
		position: fixed;
		z-index: 100;
		width: 320px;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		box-shadow:
			0 20px 40px -8px rgba(0, 0, 0, 0.2),
			0 8px 16px -4px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		animation: popover-in 120ms ease-out;
	}

	@keyframes popover-in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.accent-bar {
		height: 4px;
		width: 100%;
	}

	.popover-content {
		padding: 0.875rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.title-input {
		width: 100%;
		border: none;
		background: none;
		font-size: 1.0625rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		outline: none;
		padding: 0;
	}

	.title-input::placeholder {
		color: hsl(var(--color-muted-foreground) / 0.5);
		font-weight: 400;
	}

	.time-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.time-label {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.location-input {
		width: 100%;
		border: none;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		background: none;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		outline: none;
		padding: 0.25rem 0;
	}

	.location-input::placeholder {
		color: hsl(var(--color-muted-foreground) / 0.4);
	}

	.location-input:focus {
		border-bottom-color: hsl(var(--color-primary));
	}

	.action-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}

	.action-right {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-left: auto;
	}

	.expand-btn {
		font-size: 0.75rem;
		color: hsl(var(--color-primary));
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0;
		font-weight: 500;
	}

	.expand-btn:hover {
		text-decoration: underline;
	}

	.cancel-btn {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
	}

	.cancel-btn:hover {
		background: hsl(var(--color-muted));
	}

	.save-btn {
		font-size: 0.8125rem;
		font-weight: 600;
		color: white;
		border: none;
		cursor: pointer;
		padding: 0.375rem 1rem;
		border-radius: 0.375rem;
		transition: opacity 0.15s;
	}

	.save-btn:hover {
		opacity: 0.9;
	}

	.save-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Mobile: bottom sheet */
	@media (max-width: 640px) {
		.popover {
			position: fixed;
			top: auto !important;
			left: 0 !important;
			right: 0;
			bottom: 0;
			width: 100%;
			border-radius: 1rem 1rem 0 0;
			animation: slide-up 200ms ease-out;
		}

		@keyframes slide-up {
			from {
				transform: translateY(100%);
			}
			to {
				transform: translateY(0);
			}
		}

		.popover-backdrop {
			background: rgba(0, 0, 0, 0.3);
		}
	}
</style>
