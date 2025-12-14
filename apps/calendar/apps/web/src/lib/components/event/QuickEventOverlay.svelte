<script lang="ts">
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import type {
		LocationDetails,
		CalendarEvent,
		ResponsiblePerson,
		EventAttendee,
	} from '@calendar/shared';
	import type { ContactSummary, ContactOrManual, ManualContactEntry } from '@manacore/shared-types';
	import { ContactSelector, ContactAvatar, ConfirmationPopover } from '@manacore/shared-ui';
	import { Users } from 'lucide-svelte';
	import { format, addMinutes } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { toDate } from '$lib/utils/eventDateHelpers';
	import { tick, onMount, onDestroy } from 'svelte';

	// Portal action - moves element to body to escape stacking contexts
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			},
		};
	}

	interface Props {
		startTime?: Date;
		event?: CalendarEvent;
		onClose: () => void;
		onCreated?: () => void;
		onUpdated?: () => void;
		onDeleted?: () => void;
	}

	let { startTime, event, onClose, onCreated, onUpdated, onDeleted }: Props = $props();

	// Mode: create or edit
	let isEditMode = $derived(!!event);

	// Input ref for programmatic focus
	let titleInputRef = $state<HTMLInputElement | null>(null);

	// Position tracking
	let overlayPosition = $state({ left: 0, top: 0 });
	let positionInitialized = $state(false);

	// Track when draft event was last modified (to ignore clicks after drag/resize)
	let lastDraftUpdateTime = $state(0);

	// Calculate position relative to draft event element or existing event
	function updatePosition() {
		if (typeof window === 'undefined') return;

		// In edit mode, position relative to the existing event element
		const eventSelector = isEditMode
			? `[data-event-id="${event!.id}"]`
			: '[data-event-id="__draft__"]';
		const eventElement = document.querySelector(eventSelector);

		if (!eventElement) {
			// Fallback: center in viewport
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;
			overlayPosition = {
				left: Math.max(16, (viewportWidth - 380) / 2),
				top: Math.max(16, (viewportHeight - 450) / 2),
			};
			positionInitialized = true;
			return;
		}

		const rect = eventElement.getBoundingClientRect();
		const overlayWidth = 380;
		const maxOverlayHeight = 450;
		const margin = 16;
		const gap = 8; // Gap between event and overlay

		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		// Try to position to the right of the event
		let left = rect.right + gap;
		let top = rect.top;

		// If not enough space on the right, try left side
		if (left + overlayWidth > viewportWidth - margin) {
			left = rect.left - overlayWidth - gap;
		}

		// If still no space, position below/above
		if (left < margin) {
			left = Math.max(margin, Math.min(rect.left, viewportWidth - overlayWidth - margin));
			top = rect.bottom + gap;

			// If no space below, position above
			if (top + maxOverlayHeight > viewportHeight - margin) {
				top = rect.top - maxOverlayHeight - gap;
			}
		}

		// Final clamps
		left = Math.max(margin, Math.min(left, viewportWidth - overlayWidth - margin));
		top = Math.max(margin, Math.min(top, viewportHeight - maxOverlayHeight - margin));

		overlayPosition = { left, top };
		positionInitialized = true;
	}

	// Handle clicks outside overlay (but allow clicks on event)
	function handleDocumentClick(e: MouseEvent) {
		// Ignore clicks within 250ms of draft event update (drag/resize just ended)
		if (Date.now() - lastDraftUpdateTime < 250) {
			return;
		}

		const target = e.target as HTMLElement;

		// If target was removed from DOM by state change (e.g., button that toggles its own visibility),
		// ignore the click to prevent false "outside" detection
		if (!target.isConnected) {
			return;
		}

		const overlay = document.querySelector('.quick-event-overlay');
		const eventSelector = isEditMode
			? `[data-event-id="${event!.id}"]`
			: '[data-event-id="__draft__"]';
		const eventElement = document.querySelector(eventSelector);

		// Don't close if clicking on overlay or event element
		if (overlay?.contains(target) || eventElement?.contains(target)) {
			return;
		}

		// Close overlay for clicks outside
		onClose();
	}

	onMount(() => {
		// Initial position calculation with slight delay for DOM update
		requestAnimationFrame(() => {
			updatePosition();
		});

		// Add click listener with slight delay to avoid immediate close
		setTimeout(() => {
			document.addEventListener('click', handleDocumentClick);
		}, 100);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleDocumentClick);
	});

	// Update position when draft event changes (user dragged it) - only in create mode
	$effect(() => {
		if (!isEditMode) {
			const draft = eventsStore.draftEvent;
			if (draft && positionInitialized) {
				// Track when draft was updated (for click ignore logic)
				lastDraftUpdateTime = Date.now();

				// Use requestAnimationFrame to wait for DOM update
				requestAnimationFrame(() => {
					updatePosition();
				});
			}
		}
	});

	// Focus input when overlay opens
	$effect(() => {
		if (titleInputRef) {
			tick().then(() => {
				titleInputRef?.focus();
				// Select all text in edit mode for easy replacement
				if (isEditMode) {
					titleInputRef?.select();
				}
			});
		}
	});

	// Form state - initialize from event (edit mode) or draft event (create mode)
	let title = $state('');
	let calendarId = $state('');
	let description = $state('');
	let location = $state('');
	let isAllDay = $state(false);
	let allDayDisplayMode = $state<'default' | 'header' | 'block'>('default');

	// Location details state
	let showLocationDetails = $state(false);
	let locationStreet = $state('');
	let locationPostalCode = $state('');
	let locationCity = $state('');
	let locationCountry = $state('');
	let submitting = $state(false);

	// People state
	let responsiblePerson = $state<ResponsiblePerson | null>(null);
	let attendees = $state<EventAttendee[]>([]);
	let showPeopleSelector = $state(false);
	let contactsAvailable = $state<boolean | null>(null);

	// Check contacts availability
	$effect(() => {
		contactsStore.checkAvailability().then((available) => {
			contactsAvailable = available;
		});
	});

	// Editable date/time strings (for form inputs)
	let startDateStr = $state('');
	let startTimeStr = $state('');
	let endDateStr = $state('');
	let endTimeStr = $state('');

	// Initialize form state from event in edit mode
	$effect(() => {
		if (isEditMode && event) {
			title = event.title || '';
			calendarId = event.calendarId || '';
			description = event.description || '';
			location = event.location || '';
			isAllDay = event.isAllDay || false;
			allDayDisplayMode =
				(event.metadata?.allDayDisplayMode as 'default' | 'header' | 'block') || 'default';

			// Initialize location details
			const loc = event.metadata?.locationDetails;
			if (loc) {
				showLocationDetails = true;
				locationStreet = loc.street || '';
				locationPostalCode = loc.postalCode || '';
				locationCity = loc.city || '';
				locationCountry = loc.country || '';
			}

			// Initialize people
			responsiblePerson = event.metadata?.responsiblePerson || null;
			attendees = event.metadata?.attendees || [];

			// Initialize time fields
			const eventStart = toDate(event.startTime);
			const eventEnd = toDate(event.endTime);
			startDateStr = format(eventStart, 'yyyy-MM-dd');
			startTimeStr = format(eventStart, 'HH:mm');
			endDateStr = format(eventEnd, 'yyyy-MM-dd');
			endTimeStr = format(eventEnd, 'HH:mm');
		}
	});

	// Date/time fields - derive from draft event (create mode) or event (edit mode)
	let draftStart = $derived(() => {
		if (isEditMode && event) {
			return toDate(event.startTime);
		}
		const draft = eventsStore.draftEvent;
		if (draft) {
			return toDate(draft.startTime);
		}
		return startTime || new Date();
	});

	let draftEnd = $derived(() => {
		if (isEditMode && event) {
			return toDate(event.endTime);
		}
		const draft = eventsStore.draftEvent;
		if (draft) {
			return toDate(draft.endTime);
		}
		return addMinutes(startTime || new Date(), settingsStore.defaultEventDuration);
	});

	// Display date/time - derived from draft event or event
	let displayStartDate = $derived(format(draftStart(), 'yyyy-MM-dd'));
	let displayStartTime = $derived(format(draftStart(), 'HH:mm'));
	let displayEndDate = $derived(format(draftEnd(), 'yyyy-MM-dd'));
	let displayEndTime = $derived(format(draftEnd(), 'HH:mm'));

	// Sync form fields from draft event when it changes (e.g., user drags it) - only in create mode
	$effect(() => {
		if (!isEditMode) {
			startDateStr = displayStartDate;
			startTimeStr = displayStartTime;
			endDateStr = displayEndDate;
			endTimeStr = displayEndTime;
		}
	});

	// Set default calendar - only in create mode
	$effect(() => {
		if (!isEditMode && !calendarId && calendarsStore.defaultCalendar?.id) {
			calendarId = calendarsStore.defaultCalendar.id;
			// Update draft event with calendar
			eventsStore.updateDraftEvent({ calendarId });
		}
	});

	// Update draft event when title changes - only in create mode
	function handleTitleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		title = target.value;
		if (!isEditMode) {
			eventsStore.updateDraftEvent({ title: target.value });
		}
	}

	// Update draft event when time fields change
	function handleStartDateChange(e: Event) {
		const target = e.target as HTMLInputElement;
		startDateStr = target.value;
		if (!isEditMode) {
			updateDraftTimes();
		}
	}

	function handleStartTimeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		startTimeStr = target.value;
		if (!isEditMode) {
			updateDraftTimes();
		}
	}

	function handleEndDateChange(e: Event) {
		const target = e.target as HTMLInputElement;
		endDateStr = target.value;
		if (!isEditMode) {
			updateDraftTimes();
		}
	}

	function handleEndTimeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		endTimeStr = target.value;
		if (!isEditMode) {
			updateDraftTimes();
		}
	}

	function updateDraftTimes() {
		const startDateTime = isAllDay
			? new Date(`${startDateStr}T00:00:00`)
			: new Date(`${startDateStr}T${startTimeStr}`);
		const endDateTime = isAllDay
			? new Date(`${endDateStr}T23:59:59`)
			: new Date(`${endDateStr}T${endTimeStr}`);

		eventsStore.updateDraftEvent({
			startTime: startDateTime.toISOString(),
			endTime: endDateTime.toISOString(),
			isAllDay,
		});
	}

	// Update draft when all-day changes
	function handleAllDayToggle() {
		isAllDay = !isAllDay;
		if (!isEditMode) {
			updateDraftTimes();
		}
	}

	// Overlay style
	let overlayStyle = $derived(`left: ${overlayPosition.left}px; top: ${overlayPosition.top}px;`);

	// People helpers
	function handleContactSearch(query: string): Promise<ContactSummary[]> {
		return contactsStore.searchContacts(query);
	}

	function handleResponsiblePersonChange(contacts: ContactOrManual[]) {
		if (contacts.length === 0) {
			responsiblePerson = null;
			return;
		}
		const contact = contacts[0];
		if ('isManual' in contact && contact.isManual) {
			const manual = contact as ManualContactEntry;
			responsiblePerson = { email: manual.email, name: manual.name };
		} else {
			const ref = contact as {
				contactId: string;
				displayName: string;
				email?: string;
				photoUrl?: string;
				company?: string;
			};
			responsiblePerson = {
				email: ref.email || '',
				name: ref.displayName,
				contactId: ref.contactId,
				photoUrl: ref.photoUrl,
				company: ref.company,
			};
		}
	}

	function handleAttendeesChange(contacts: ContactOrManual[]) {
		attendees = contacts.map((contact) => {
			if ('isManual' in contact && contact.isManual) {
				const manual = contact as ManualContactEntry;
				const existing = attendees.find((a) => a.email === manual.email);
				return {
					email: manual.email,
					name: manual.name,
					status: existing?.status || ('pending' as const),
				};
			}
			const ref = contact as {
				contactId: string;
				displayName: string;
				email?: string;
				photoUrl?: string;
				company?: string;
			};
			const existing = attendees.find(
				(a) => a.contactId === ref.contactId || a.email === ref.email
			);
			return {
				email: ref.email || '',
				name: ref.displayName,
				status: existing?.status || ('pending' as const),
				contactId: ref.contactId,
				photoUrl: ref.photoUrl,
				company: ref.company,
			};
		});
	}

	// Convert to ContactOrManual for selectors
	const responsibleAsContact = $derived<ContactOrManual[]>(
		responsiblePerson
			? responsiblePerson.contactId
				? [
						{
							contactId: responsiblePerson.contactId,
							displayName: responsiblePerson.name || responsiblePerson.email,
							email: responsiblePerson.email,
							photoUrl: responsiblePerson.photoUrl,
							company: responsiblePerson.company,
							fetchedAt: new Date().toISOString(),
						},
					]
				: [
						{
							email: responsiblePerson.email,
							name: responsiblePerson.name,
							isManual: true as const,
						},
					]
			: []
	);

	const attendeesAsContacts = $derived<ContactOrManual[]>(
		attendees.map((a) =>
			a.contactId
				? {
						contactId: a.contactId,
						displayName: a.name || a.email,
						email: a.email,
						photoUrl: a.photoUrl,
						company: a.company,
						fetchedAt: new Date().toISOString(),
					}
				: { email: a.email, name: a.name, isManual: true as const }
		)
	);

	// Count of people assigned
	const peopleCount = $derived((responsiblePerson ? 1 : 0) + attendees.length);

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

			// Build location details if any field is filled
			const locationDetails: LocationDetails | undefined =
				locationStreet.trim() ||
				locationPostalCode.trim() ||
				locationCity.trim() ||
				locationCountry.trim()
					? {
							street: locationStreet.trim() || undefined,
							postalCode: locationPostalCode.trim() || undefined,
							city: locationCity.trim() || undefined,
							country: locationCountry.trim() || undefined,
						}
					: undefined;

			// Build metadata - preserve existing metadata in edit mode
			let metadata: Record<string, unknown> | undefined = isEditMode
				? { ...(event?.metadata || {}) }
				: undefined;

			if (isAllDay && allDayDisplayMode !== 'default') {
				metadata = {
					...(metadata || {}),
					allDayDisplayMode: allDayDisplayMode as 'header' | 'block',
				};
			} else if (metadata) {
				delete metadata.allDayDisplayMode;
			}

			if (locationDetails) {
				metadata = { ...(metadata || {}), locationDetails };
			} else if (metadata) {
				delete metadata.locationDetails;
			}

			// Add responsible person
			if (responsiblePerson) {
				metadata = { ...(metadata || {}), responsiblePerson };
			} else if (metadata) {
				delete metadata.responsiblePerson;
			}

			// Add attendees
			if (attendees.length > 0) {
				metadata = { ...(metadata || {}), attendees };
			} else if (metadata) {
				delete metadata.attendees;
			}

			// Clean up empty metadata
			if (metadata && Object.keys(metadata).length === 0) {
				metadata = undefined;
			}

			const eventData = {
				title: title.trim(),
				calendarId,
				startTime: startDateTime.toISOString(),
				endTime: endDateTime.toISOString(),
				isAllDay,
				description: description.trim() || undefined,
				location: location.trim() || undefined,
				metadata,
			};

			if (isEditMode && event) {
				// Update existing event
				const result = await eventsStore.updateEvent(event.id, eventData);
				if (result.error) {
					toast.error(`Fehler beim Speichern: ${result.error.message}`);
					return;
				}
				toast.success('Termin aktualisiert');
				onUpdated?.();
			} else {
				// Create new event
				const result = await eventsStore.createEvent(eventData);
				if (result.error) {
					toast.error(`Fehler beim Erstellen: ${result.error.message}`);
					return;
				}
				// Refresh calendars if none existed (in case default was created)
				if (calendarsStore.calendars.length === 0) {
					await calendarsStore.fetchCalendars();
				}
				toast.success('Termin erstellt');
				onCreated?.();
			}

			onClose();
		} catch (error) {
			console.error('Failed to save event:', error);
			toast.error('Fehler beim Speichern');
		} finally {
			submitting = false;
		}
	}

	async function handleDelete() {
		if (!event) return;

		submitting = true;
		try {
			const result = await eventsStore.deleteEvent(event.id);
			if (result.error) {
				toast.error(`Fehler beim Löschen: ${result.error.message}`);
				return;
			}
			toast.success('Termin gelöscht');
			onDeleted?.();
			onClose();
		} catch (error) {
			console.error('Failed to delete event:', error);
			toast.error('Fehler beim Löschen');
		} finally {
			submitting = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Overlay (no blocking backdrop - allows interaction with calendar) -->
<!-- Portal to body to escape stacking contexts -->
<div
	use:portal
	class="quick-event-overlay"
	style="{overlayStyle} z-index: 99999;"
	role="dialog"
	aria-modal="true"
	aria-label={isEditMode ? 'Termin bearbeiten' : 'Termin erstellen'}
>
	<form onsubmit={handleSubmit}>
		<!-- Header -->
		<div class="overlay-header">
			<span class="header-title">{isEditMode ? 'Termin bearbeiten' : 'Neuer Termin'}</span>
			<div class="header-actions">
				{#if isEditMode}
					<ConfirmationPopover
						onConfirm={handleDelete}
						variant="danger"
						title="Termin löschen?"
						confirmLabel="Löschen"
						loading={submitting}
						placement="bottom"
					>
						<button type="button" class="delete-btn" disabled={submitting} aria-label="Löschen">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</ConfirmationPopover>
				{/if}
				<button type="button" class="close-btn" onclick={onClose} aria-label="Schließen">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Scrollable content -->
		<div class="overlay-content">
			<!-- Title input -->
			<div class="form-group">
				<input
					type="text"
					class="title-input"
					value={title}
					oninput={handleTitleChange}
					bind:this={titleInputRef}
					placeholder="Titel hinzufügen"
				/>
			</div>

			<!-- Time display under title -->
			<div class="time-display">
				<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>
					{format(draftStart(), 'EEEE, d. MMMM yyyy', { locale: de })}
					{#if !isAllDay}
						· {displayStartTime} – {displayEndTime}
					{:else}
						· Ganztägig
					{/if}
				</span>
			</div>

			<!-- Calendar pills -->
			<div class="calendar-pills-container">
				{#if calendarsStore.calendars.length > 0}
					<div class="calendar-pills-scroll">
						{#each calendarsStore.calendars as cal}
							<button
								type="button"
								class="calendar-pill"
								class:active={calendarId === cal.id}
								onclick={() => {
									calendarId = cal.id;
									if (!isEditMode) {
										eventsStore.updateDraftEvent({ calendarId: cal.id });
									}
								}}
							>
								<span class="calendar-pill-dot" style="background-color: {cal.color || '#3b82f6'}"
								></span>
								<span class="calendar-pill-name">{cal.name}</span>
							</button>
						{/each}
					</div>
				{:else}
					<span class="field-placeholder">Standardkalender wird erstellt</span>
				{/if}
			</div>

			<!-- People (compact) -->
			<div class="form-row">
				<div class="row-icon">
					<Users class="icon" size={18} />
				</div>
				<div class="row-content">
					<!-- Responsible person - always show directly -->
					<div class="people-subsection">
						<span class="field-label">Verantwortlich</span>
						{#if responsiblePerson}
							<div class="person-chip">
								<ContactAvatar
									photoUrl={responsiblePerson.photoUrl}
									name={responsiblePerson.name || responsiblePerson.email}
									size="xs"
								/>
								<span class="person-name">{responsiblePerson.name || responsiblePerson.email}</span>
								<button
									type="button"
									class="remove-person"
									onclick={() => (responsiblePerson = null)}>×</button
								>
							</div>
						{:else}
							<ContactSelector
								selectedContacts={[]}
								onContactsChange={handleResponsiblePersonChange}
								onSearch={handleContactSearch}
								allowManualEntry={true}
								placeholder="Person auswählen..."
								addLabel="Auswählen"
								searchPlaceholder="Name oder E-Mail..."
								isAvailable={contactsAvailable ?? false}
								singleSelect={true}
							/>
						{/if}
					</div>

					<!-- Attendees - show when expanded or when there are attendees -->
					{#if showPeopleSelector || attendees.length > 0}
						<div class="people-subsection">
							<span class="field-label">Teilnehmer</span>
							{#if attendees.length > 0}
								<div class="people-chips">
									{#each attendees as attendee (attendee.email)}
										<div class="person-chip">
											<ContactAvatar
												photoUrl={attendee.photoUrl}
												name={attendee.name || attendee.email}
												size="xs"
											/>
											<span class="person-name">{attendee.name || attendee.email}</span>
											<button
												type="button"
												class="remove-person"
												onclick={() =>
													(attendees = attendees.filter((a) => a.email !== attendee.email))}
												>×</button
											>
										</div>
									{/each}
								</div>
							{/if}
							<ContactSelector
								selectedContacts={attendeesAsContacts}
								onContactsChange={handleAttendeesChange}
								onSearch={handleContactSearch}
								allowManualEntry={true}
								placeholder={attendees.length > 0
									? 'Weitere hinzufügen...'
									: 'Teilnehmer hinzufügen...'}
								addLabel="Hinzufügen"
								searchPlaceholder="Name oder E-Mail..."
								isAvailable={contactsAvailable ?? false}
							/>
						</div>
					{:else}
						<!-- Show expand button for attendees -->
						<button
							type="button"
							class="add-attendees-btn"
							onclick={() => (showPeopleSelector = true)}
						>
							+ Teilnehmer hinzufügen
						</button>
					{/if}
				</div>
			</div>

			<!-- All day toggle -->
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_no_noninteractive_element_to_interactive_role -->
			<div class="form-row clickable" onclick={handleAllDayToggle} role="button" tabindex="0">
				<div class="row-icon">
					<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<div class="row-content toggle-content">
					<span>Ganztägig</span>
					<input
						type="checkbox"
						checked={isAllDay}
						class="toggle-checkbox"
						onclick={(e) => e.stopPropagation()}
						onchange={handleAllDayToggle}
					/>
				</div>
			</div>

			<!-- All-day display mode -->
			{#if isAllDay}
				<div class="form-row sub-row">
					<div class="row-icon"></div>
					<div class="row-content">
						<span class="field-label">Anzeigeart</span>
						<select class="field-select" bind:value={allDayDisplayMode}>
							<option value="default">Standard (aus Einstellungen)</option>
							<option value="header">In Kopfzeile</option>
							<option value="block">Als Tagesblock</option>
						</select>
					</div>
				</div>
			{/if}

			<!-- Start date/time -->
			<div class="form-row">
				<div class="row-icon">
					<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<div class="row-content datetime-row">
					<div class="datetime-field">
						<span class="field-label">Beginn</span>
						<input
							type="date"
							class="field-input"
							value={startDateStr}
							onchange={handleStartDateChange}
						/>
					</div>
					{#if !isAllDay}
						<div class="datetime-field time-field">
							<span class="field-label">Uhrzeit</span>
							<input
								type="time"
								class="field-input"
								value={startTimeStr}
								onchange={handleStartTimeChange}
							/>
						</div>
					{/if}
				</div>
			</div>

			<!-- End date/time -->
			<div class="form-row">
				<div class="row-icon">
					<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<div class="row-content datetime-row">
					<div class="datetime-field">
						<span class="field-label">Ende</span>
						<input
							type="date"
							class="field-input"
							value={endDateStr}
							onchange={handleEndDateChange}
						/>
					</div>
					{#if !isAllDay}
						<div class="datetime-field time-field">
							<span class="field-label">Uhrzeit</span>
							<input
								type="time"
								class="field-input"
								value={endTimeStr}
								onchange={handleEndTimeChange}
							/>
						</div>
					{/if}
				</div>
			</div>

			<!-- Location -->
			<div class="form-row">
				<div class="row-icon">
					<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				</div>
				<div class="row-content">
					<input
						type="text"
						class="field-input full"
						bind:value={location}
						placeholder="Ort hinzufügen"
					/>
					<!-- Toggle for address details -->
					<button
						type="button"
						class="address-toggle"
						onclick={() => (showLocationDetails = !showLocationDetails)}
					>
						<svg
							class="toggle-chevron"
							class:rotated={showLocationDetails}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
						{showLocationDetails ? 'Adressdetails ausblenden' : 'Adressdetails hinzufügen'}
					</button>
				</div>
			</div>

			<!-- Location details (expandable) -->
			{#if showLocationDetails}
				<div class="form-row sub-row">
					<div class="row-icon"></div>
					<div class="row-content address-details-form">
						<div class="address-field">
							<span class="field-label">Straße</span>
							<input
								type="text"
								class="field-input"
								bind:value={locationStreet}
								placeholder="Musterstraße 123"
							/>
						</div>
						<div class="address-row">
							<div class="address-field postal">
								<span class="field-label">PLZ</span>
								<input
									type="text"
									class="field-input"
									bind:value={locationPostalCode}
									placeholder="12345"
								/>
							</div>
							<div class="address-field city">
								<span class="field-label">Stadt</span>
								<input
									type="text"
									class="field-input"
									bind:value={locationCity}
									placeholder="Musterstadt"
								/>
							</div>
						</div>
						<div class="address-field">
							<span class="field-label">Land</span>
							<input
								type="text"
								class="field-input"
								bind:value={locationCountry}
								placeholder="Deutschland"
							/>
						</div>
					</div>
				</div>
			{/if}

			<!-- Description -->
			<div class="form-row">
				<div class="row-icon">
					<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h7"
						/>
					</svg>
				</div>
				<div class="row-content">
					<textarea
						class="field-textarea"
						bind:value={description}
						placeholder="Beschreibung hinzufügen"
						rows="3"
					></textarea>
				</div>
			</div>
		</div>

		<!-- Actions (sticky footer) -->
		<div class="overlay-actions">
			<button type="button" class="btn-ghost" onclick={onClose}> Abbrechen </button>
			<button type="submit" class="btn-primary" disabled={submitting || !title.trim()}>
				{submitting ? 'Speichern...' : 'Speichern'}
			</button>
		</div>
	</form>
</div>

<style>
	.quick-event-overlay {
		position: fixed;
		width: 380px;
		max-height: 450px;
		background: var(--color-surface-elevated-2);
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-lg);
		z-index: 99999 !important;
		display: flex;
		flex-direction: column;
		animation: slideIn 150ms ease-out;
		overflow: hidden;
	}

	.quick-event-overlay form {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		height: 100%;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-8px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.overlay-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
		flex-shrink: 0;
	}

	.header-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.close-btn,
	.delete-btn {
		padding: 0.375rem;
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

	.delete-btn:hover {
		background: hsl(var(--color-error) / 0.1);
		color: hsl(var(--color-error));
	}

	.delete-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.overlay-content {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 0.75rem 0;
	}

	.form-group {
		padding: 0 1.25rem;
	}

	.title-input {
		width: 100%;
		padding: 0.75rem 0;
		border: none;
		background: transparent;
		font-size: 1.25rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		outline: none;
	}

	.title-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.time-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1.25rem 1rem;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		border-bottom: 1px solid hsl(var(--color-border));
		margin-bottom: 0.5rem;
	}

	.icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		color: hsl(var(--color-muted-foreground));
	}

	.form-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.625rem 1.25rem;
	}

	.form-row.clickable {
		cursor: pointer;
		transition: background-color 150ms;
	}

	.form-row.clickable:hover {
		background: hsl(var(--color-muted) / 0.3);
	}

	.form-row.sub-row {
		padding-top: 0;
	}

	.row-icon {
		width: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-top: 0.25rem;
		flex-shrink: 0;
	}

	.calendar-dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
	}

	/* Calendar pills */
	.calendar-pills-container {
		padding: 0.5rem 0;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.calendar-pills-scroll {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding: 0 1.25rem 2px;
	}

	.calendar-pills-scroll::-webkit-scrollbar {
		display: none;
	}

	.calendar-pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 9999px;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		white-space: nowrap;
		cursor: pointer;
		transition: all 150ms;
		flex-shrink: 0;
	}

	.calendar-pill:hover {
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-foreground));
	}

	.calendar-pill.active {
		background: hsl(var(--color-primary) / 0.1);
		border-color: hsl(var(--color-primary) / 0.3);
		color: hsl(var(--color-primary));
	}

	.calendar-pill-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.calendar-pill-name {
	}

	.row-content {
		flex: 1;
		min-width: 0;
	}

	.toggle-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}

	.toggle-checkbox {
		width: 18px;
		height: 18px;
		accent-color: hsl(var(--color-primary));
		cursor: pointer;
	}

	.field-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 0.25rem;
	}

	.field-select,
	.field-input {
		width: 100%;
		padding: 0.5rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-sm);
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
	}

	.field-select:focus,
	.field-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
	}

	.field-placeholder {
		display: block;
		padding: 0.5rem 0.625rem;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}

	.field-input.full {
		padding: 0.625rem;
	}

	.datetime-row {
		display: flex;
		gap: 0.5rem;
	}

	.datetime-field {
		flex: 1;
	}

	.datetime-field.time-field {
		flex: 0 0 100px;
	}

	.field-textarea {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-sm);
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
	}

	.field-textarea:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
	}

	.overlay-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-top: 1px solid hsl(var(--color-border));
		background: var(--color-surface-elevated-2);
		flex-shrink: 0;
	}

	.overlay-actions .btn-primary {
		flex: 1;
	}

	.btn-ghost {
		padding: 0.5rem 1rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 150ms;
	}

	.btn-ghost:hover {
		background: hsl(var(--color-muted));
	}

	.btn-primary {
		padding: 0.5rem 1.25rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: var(--radius-md);
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

	/* Scrollbar styling */
	.overlay-content {
		scrollbar-width: thin;
		scrollbar-color: hsl(var(--color-muted)) transparent;
	}

	.overlay-content::-webkit-scrollbar {
		width: 6px;
	}

	.overlay-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.overlay-content::-webkit-scrollbar-thumb {
		background: hsl(var(--color-muted));
		border-radius: 3px;
	}

	.overlay-content::-webkit-scrollbar-thumb:hover {
		background: hsl(var(--color-muted-foreground));
	}

	/* Address toggle and details */
	.address-toggle {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.5rem;
		padding: 0;
		border: none;
		background: transparent;
		color: hsl(var(--color-primary));
		font-size: 0.8125rem;
		cursor: pointer;
		transition: color 150ms;
	}

	.address-toggle:hover {
		color: hsl(var(--color-primary) / 0.8);
	}

	.toggle-chevron {
		width: 14px;
		height: 14px;
		transition: transform 150ms ease;
	}

	.toggle-chevron.rotated {
		transform: rotate(90deg);
	}

	.address-details-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: var(--radius-sm);
		border: 1px solid hsl(var(--color-border));
	}

	.address-field {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.address-row {
		display: flex;
		gap: 0.5rem;
	}

	.address-field.postal {
		flex: 0 0 80px;
	}

	.address-field.city {
		flex: 1;
	}

	/* People section */
	.add-attendees-btn {
		margin-top: 0.5rem;
		padding: 0.25rem 0;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		transition: color 150ms;
		text-align: left;
	}

	.add-attendees-btn:hover {
		color: hsl(var(--color-primary));
	}

	.people-subsection {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.people-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-bottom: 0.25rem;
	}

	.person-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem 0.25rem 0.25rem;
		background: hsl(var(--color-muted) / 0.5);
		border-radius: var(--radius-full);
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}

	.person-name {
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.remove-person {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		padding: 0;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		border-radius: var(--radius-full);
		transition: all 150ms;
	}

	.remove-person:hover {
		background: hsl(var(--color-error) / 0.1);
		color: hsl(var(--color-error));
	}

	.people-subsection + .people-subsection {
		margin-top: 0.75rem;
	}
</style>
