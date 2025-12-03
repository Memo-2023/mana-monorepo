<script lang="ts">
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { goto } from '$app/navigation';
	import { format, addMinutes } from 'date-fns';

	interface Props {
		startTime: Date;
		position: { x: number; y: number };
		onClose: () => void;
		onCreated?: () => void;
	}

	let { startTime, position, onClose, onCreated }: Props = $props();

	// Form state
	let title = $state('');
	let calendarId = $state('');
	let isExpanded = $state(false);
	let description = $state('');
	let location = $state('');
	let isAllDay = $state(false);
	let submitting = $state(false);

	// Time fields
	let endTime = $derived(addMinutes(startTime, settingsStore.defaultEventDuration));
	let startTimeStr = $derived(format(startTime, 'HH:mm'));
	let endTimeStr = $state('');
	let startDateStr = $derived(format(startTime, 'yyyy-MM-dd'));
	let endDateStr = $state('');

	// Initialize end time string
	$effect(() => {
		endTimeStr = format(endTime, 'HH:mm');
		endDateStr = format(endTime, 'yyyy-MM-dd');
	});

	// Set default calendar
	$effect(() => {
		if (!calendarId && calendarsStore.defaultCalendar?.id) {
			calendarId = calendarsStore.defaultCalendar.id;
		}
	});

	// Calculate overlay position (ensure it stays within viewport)
	let overlayStyle = $derived.by(() => {
		const overlayWidth = isExpanded ? 360 : 300;
		const overlayHeight = isExpanded ? 400 : 180;

		let left = position.x;
		let top = position.y;

		// Keep within viewport bounds
		if (typeof window !== 'undefined') {
			if (left + overlayWidth > window.innerWidth - 20) {
				left = window.innerWidth - overlayWidth - 20;
			}
			if (top + overlayHeight > window.innerHeight - 20) {
				top = window.innerHeight - overlayHeight - 20;
			}
			if (left < 20) left = 20;
			if (top < 20) top = 20;
		}

		return `left: ${left}px; top: ${top}px;`;
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim() || !calendarId) return;

		submitting = true;

		try {
			const startDateTime = isAllDay
				? new Date(`${startDateStr}T00:00:00`)
				: new Date(`${startDateStr}T${startTimeStr}`);
			const endDateTime = isAllDay
				? new Date(`${endDateStr}T23:59:59`)
				: new Date(`${endDateStr}T${endTimeStr}`);

			await eventsStore.createEvent({
				title: title.trim(),
				calendarId,
				startTime: startDateTime.toISOString(),
				endTime: endDateTime.toISOString(),
				isAllDay,
				description: description.trim() || undefined,
				location: location.trim() || undefined,
			});

			onCreated?.();
			onClose();
		} catch (error) {
			console.error('Failed to create event:', error);
		} finally {
			submitting = false;
		}
	}

	function handleMoreOptions() {
		const params = new URLSearchParams({
			start: startTime.toISOString(),
			title: title.trim(),
			calendar: calendarId,
		});
		if (description) params.set('description', description);
		if (location) params.set('location', location);
		goto(`/event/new?${params.toString()}`);
		onClose();
	}

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
<div class="overlay-backdrop" onclick={handleBackdropClick} role="presentation">
	<!-- Overlay -->
	<div
		class="quick-event-overlay"
		class:expanded={isExpanded}
		style={overlayStyle}
		role="dialog"
		aria-modal="true"
		aria-label="Termin erstellen"
	>
		<form onsubmit={handleSubmit}>
			<!-- Header -->
			<div class="overlay-header">
				<span class="time-badge">
					{format(startTime, 'EEE, d. MMM')} {startTimeStr}
				</span>
				<button type="button" class="close-btn" onclick={onClose} aria-label="Schließen">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Title input -->
			<div class="form-group">
				<input
					type="text"
					class="title-input"
					bind:value={title}
					placeholder="Termin hinzufügen"
					autofocus
				/>
			</div>

			<!-- Calendar select (compact) -->
			<div class="form-group compact-row">
				<div class="calendar-dot" style="background-color: {calendarsStore.getColor(calendarId)}"></div>
				<select class="compact-select" bind:value={calendarId}>
					{#each calendarsStore.calendars as cal}
						<option value={cal.id}>{cal.name}</option>
					{/each}
				</select>
			</div>

			<!-- Expanded section -->
			{#if isExpanded}
				<div class="expanded-section">
					<!-- All day toggle -->
					<label class="toggle-row">
						<input type="checkbox" bind:checked={isAllDay} />
						<span>Ganztägig</span>
					</label>

					<!-- Time fields -->
					{#if !isAllDay}
						<div class="time-row">
							<div class="time-field">
								<label>Von</label>
								<input type="time" bind:value={startTimeStr} />
							</div>
							<span class="time-sep">–</span>
							<div class="time-field">
								<label>Bis</label>
								<input type="time" bind:value={endTimeStr} />
							</div>
						</div>
					{/if}

					<!-- Location -->
					<div class="form-group">
						<input
							type="text"
							class="field-input"
							bind:value={location}
							placeholder="Ort hinzufügen"
						/>
					</div>

					<!-- Description -->
					<div class="form-group">
						<textarea
							class="field-input"
							bind:value={description}
							placeholder="Beschreibung"
							rows="2"
						></textarea>
					</div>
				</div>
			{/if}

			<!-- Actions -->
			<div class="overlay-actions">
				<button
					type="button"
					class="expand-btn"
					onclick={() => isExpanded = !isExpanded}
				>
					{isExpanded ? 'Weniger' : 'Mehr Optionen'}
					<svg class="w-3 h-3" class:rotated={isExpanded} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				<div class="action-buttons">
					<button type="button" class="btn-ghost" onclick={handleMoreOptions}>
						Alle Optionen
					</button>
					<button type="submit" class="btn-primary" disabled={submitting || !title.trim()}>
						Speichern
					</button>
				</div>
			</div>
		</form>
	</div>
</div>

<style>
	.overlay-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: transparent;
	}

	.quick-event-overlay {
		position: fixed;
		width: 300px;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-lg);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1);
		z-index: 1001;
		overflow: hidden;
		animation: slideIn 150ms ease-out;
	}

	.quick-event-overlay.expanded {
		width: 360px;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.overlay-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-muted) / 0.3);
	}

	.time-badge {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}

	.close-btn {
		padding: 0.25rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 150ms;
	}

	.close-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.form-group {
		padding: 0.5rem 1rem;
	}

	.title-input {
		width: 100%;
		padding: 0.5rem 0;
		border: none;
		background: transparent;
		font-size: 1rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		outline: none;
	}

	.title-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.compact-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-top: 0;
	}

	.calendar-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.compact-select {
		flex: 1;
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-sm);
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		cursor: pointer;
	}

	.expanded-section {
		border-top: 1px solid hsl(var(--color-border));
		padding-top: 0.5rem;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.toggle-row input {
		accent-color: hsl(var(--color-primary));
	}

	.time-row {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
	}

	.time-field {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.time-field label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.time-field input {
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-sm);
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
	}

	.time-sep {
		padding-bottom: 0.375rem;
		color: hsl(var(--color-muted-foreground));
	}

	.field-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-sm);
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		resize: none;
	}

	.field-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
	}

	.overlay-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-top: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-muted) / 0.2);
	}

	.expand-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.5rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all 150ms;
	}

	.expand-btn:hover {
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-muted));
	}

	.expand-btn svg {
		transition: transform 150ms;
	}

	.expand-btn svg.rotated {
		transform: rotate(180deg);
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.btn-ghost {
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 150ms;
	}

	.btn-ghost:hover {
		background: hsl(var(--color-muted));
	}

	.btn-primary {
		padding: 0.375rem 0.75rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 150ms;
	}

	.btn-primary:hover {
		background: hsl(var(--color-primary) / 0.9);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
