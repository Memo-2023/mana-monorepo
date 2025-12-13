<script lang="ts">
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import { Pencil, Copy, Trash, Palette, CalendarBlank, Export } from '@manacore/shared-icons';
	import { eventContextMenuStore } from '$lib/stores/eventContextMenu.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { CalendarEvent } from '@calendar/shared';

	interface Props {
		onEdit?: (event: CalendarEvent) => void;
	}

	let { onEdit }: Props = $props();

	// Build menu items based on target event
	let menuItems = $derived.by((): ContextMenuItem[] => {
		const event = eventContextMenuStore.targetEvent;
		if (!event) return [];

		return [
			{
				id: 'edit',
				label: 'Bearbeiten',
				icon: Pencil,
				shortcut: 'E',
				action: () => handleEdit(),
			},
			{
				id: 'duplicate',
				label: 'Duplizieren',
				icon: Copy,
				shortcut: 'D',
				action: () => handleDuplicate(),
			},
			{
				id: 'divider-1',
				label: '',
				type: 'divider',
			},
			{
				id: 'change-calendar',
				label: 'Kalender wechseln',
				icon: CalendarBlank,
				action: () => handleChangeCalendar(),
				disabled: calendarsStore.calendars.length <= 1,
			},
			{
				id: 'change-color',
				label: 'Farbe ändern',
				icon: Palette,
				action: () => handleChangeColor(),
			},
			{
				id: 'export',
				label: 'Exportieren (.ics)',
				icon: Export,
				action: () => handleExport(),
			},
			{
				id: 'divider-2',
				label: '',
				type: 'divider',
			},
			{
				id: 'delete',
				label: 'Löschen',
				icon: Trash,
				variant: 'danger',
				action: () => handleDelete(),
			},
		];
	});

	function handleEdit() {
		const event = eventContextMenuStore.targetEvent;
		if (event && onEdit) {
			onEdit(event);
		}
	}

	async function handleDuplicate() {
		const event = eventContextMenuStore.targetEvent;
		if (!event) return;

		try {
			await eventsStore.createEvent({
				calendarId: event.calendarId,
				title: `${event.title} (Kopie)`,
				description: event.description ?? undefined,
				location: event.location ?? undefined,
				startTime: event.startTime,
				endTime: event.endTime,
				isAllDay: event.isAllDay,
				color: event.color ?? undefined,
			});
			toastStore.success('Termin dupliziert');
		} catch (error) {
			console.error('Error duplicating event:', error);
			toastStore.error('Fehler beim Duplizieren');
		}
	}

	function handleChangeCalendar() {
		// TODO: Implement calendar picker modal
		const event = eventContextMenuStore.targetEvent;
		if (!event) return;

		// For now, cycle through calendars
		const calendars = calendarsStore.calendars;
		const currentIndex = calendars.findIndex((c) => c.id === event.calendarId);
		const nextIndex = (currentIndex + 1) % calendars.length;
		const nextCalendar = calendars[nextIndex];

		if (nextCalendar) {
			eventsStore.updateEvent(event.id, { calendarId: nextCalendar.id });
			toastStore.success(`Verschoben nach "${nextCalendar.name}"`);
		}
	}

	function handleChangeColor() {
		// TODO: Implement color picker modal
		const event = eventContextMenuStore.targetEvent;
		if (!event) return;

		// For now, cycle through some predefined colors
		const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
		const currentIndex = colors.indexOf(event.color || '');
		const nextIndex = (currentIndex + 1) % colors.length;

		eventsStore.updateEvent(event.id, { color: colors[nextIndex] });
		toastStore.success('Farbe geändert');
	}

	function handleExport() {
		const event = eventContextMenuStore.targetEvent;
		if (!event) return;

		// Generate simple ICS content
		const startDate =
			typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime;
		const endDate = typeof event.endTime === 'string' ? new Date(event.endTime) : event.endTime;

		const formatDate = (date: Date) => {
			return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
		};

		const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Manacore//Calendar//DE
BEGIN:VEVENT
UID:${event.id}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.title}
${event.description ? `DESCRIPTION:${event.description}` : ''}
${event.location ? `LOCATION:${event.location}` : ''}
END:VEVENT
END:VCALENDAR`;

		const blob = new Blob([icsContent], { type: 'text/calendar' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
		link.click();
		URL.revokeObjectURL(url);

		toastStore.success('Termin exportiert');
	}

	async function handleDelete() {
		const event = eventContextMenuStore.targetEvent;
		if (!event) return;

		if (confirm(`Möchten Sie "${event.title}" wirklich löschen?`)) {
			try {
				await eventsStore.deleteEvent(event.id);
				toastStore.success('Termin gelöscht');
			} catch (error) {
				console.error('Error deleting event:', error);
				toastStore.error('Fehler beim Löschen');
			}
		}
	}

	function handleClose() {
		eventContextMenuStore.hide();
	}
</script>

<ContextMenu
	visible={eventContextMenuStore.visible}
	x={eventContextMenuStore.x}
	y={eventContextMenuStore.y}
	items={menuItems}
	onClose={handleClose}
/>
