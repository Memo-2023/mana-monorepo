<script lang="ts">
	import PickerOverlay from '$lib/components/PickerOverlay.svelte';
	import {
		Circle,
		CheckCircle,
		CalendarCheck,
		Warning,
		ListChecks,
		Flag,
		Calendar,
		TagSimple,
		Plus,
	} from '@mana/shared-icons';

	interface Props {
		onSelect: (pageId: string) => void;
		onClose: () => void;
		onCreateCustom?: () => void;
		activePageIds?: string[];
	}

	let { onSelect, onClose, onCreateCustom, activePageIds = [] }: Props = $props();

	const PAGE_OPTIONS = [
		{ id: 'todo', title: 'To Do', description: 'Offene Aufgaben', icon: Circle, color: '#6B7280' },
		{
			id: 'completed',
			title: 'Erledigt',
			description: 'Alle abgeschlossenen Aufgaben',
			icon: CheckCircle,
			color: '#22C55E',
		},
		{
			id: 'today',
			title: 'Heute',
			description: 'Fällig heute & überfällig',
			icon: CalendarCheck,
			color: '#F59E0B',
		},
		{
			id: 'overdue',
			title: 'Überfällig',
			description: 'Aufgaben nach Fälligkeitsdatum',
			icon: Warning,
			color: '#EF4444',
		},
		{
			id: 'all',
			title: 'Alle Aufgaben',
			description: 'Vollständige Aufgabenliste',
			icon: ListChecks,
			color: '#3B82F6',
		},
		{
			id: 'high-priority',
			title: 'Hohe Priorität',
			description: 'Dringend & hoch priorisiert',
			icon: Flag,
			color: '#EF4444',
		},
		{
			id: 'this-week',
			title: 'Diese Woche',
			description: 'Aufgaben der nächsten 7 Tage',
			icon: Calendar,
			color: '#8B5CF6',
		},
		{
			id: 'no-date',
			title: 'Ohne Datum',
			description: 'Aufgaben ohne Fälligkeitsdatum',
			icon: TagSimple,
			color: '#6B7280',
		},
	];

	let availableOptions = $derived(PAGE_OPTIONS.filter((opt) => !activePageIds.includes(opt.id)));
</script>

<PickerOverlay
	title="Neue Seite"
	items={availableOptions}
	{onClose}
	emptyLabel="Alle Seiten sind bereits geöffnet"
>
	{#snippet item(option)}
		<button class="picker-option" onclick={() => onSelect(option.id)}>
			<div class="option-icon" style="color: {option.color}"><option.icon size={20} /></div>
			<div class="option-text">
				<span class="option-title">{option.title}</span>
				<span class="option-desc">{option.description}</span>
			</div>
		</button>
	{/snippet}

	{#snippet footer()}
		{#if onCreateCustom}
			<button class="picker-option custom-option" onclick={onCreateCustom}>
				<div class="option-icon custom-icon"><Plus size={20} /></div>
				<div class="option-text">
					<span class="option-title">Eigene Seite</span>
					<span class="option-desc">Seite mit eigenen Filtern erstellen</span>
				</div>
			</button>
		{/if}
	{/snippet}
</PickerOverlay>

<style>
	:global(.picker .custom-option) {
		margin-top: 0.25rem;
	}
	:global(.picker .custom-icon) {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}
</style>
