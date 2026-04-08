<script lang="ts">
	import PickerOverlay from '$lib/components/PickerOverlay.svelte';
	import {
		Users,
		User,
		Star,
		Cake,
		Envelope,
		Phone,
		Briefcase,
		MapPin,
		Clock,
	} from '@mana/shared-icons';

	interface Props {
		onSelect: (pageId: string) => void;
		onClose: () => void;
		activePageIds?: string[];
	}

	let { onSelect, onClose, activePageIds = [] }: Props = $props();

	const PAGE_OPTIONS = [
		{
			id: 'my-profile',
			title: 'Mein Profil',
			description: 'Deine eigene Kontaktkarte',
			icon: User,
			color: '#8B5CF6',
		},
		{
			id: 'all',
			title: 'Alle Kontakte',
			description: 'Vollständige Kontaktliste',
			icon: Users,
			color: '#3B82F6',
		},
		{
			id: 'favorites',
			title: 'Favoriten',
			description: 'Markierte Kontakte',
			icon: Star,
			color: '#F59E0B',
		},
		{
			id: 'birthday-soon',
			title: 'Bald Geburtstag',
			description: 'Geburtstage der nächsten 30 Tage',
			icon: Cake,
			color: '#EC4899',
		},
		{
			id: 'has-email',
			title: 'Mit E-Mail',
			description: 'Kontakte mit E-Mail-Adresse',
			icon: Envelope,
			color: '#6366F1',
		},
		{
			id: 'has-phone',
			title: 'Mit Telefon',
			description: 'Kontakte mit Telefonnummer',
			icon: Phone,
			color: '#22C55E',
		},
		{
			id: 'with-company',
			title: 'Mit Unternehmen',
			description: 'Geschäftliche Kontakte',
			icon: Briefcase,
			color: '#8B5CF6',
		},
		{
			id: 'with-address',
			title: 'Mit Adresse',
			description: 'Kontakte mit Anschrift',
			icon: MapPin,
			color: '#F97316',
		},
		{
			id: 'recent',
			title: 'Kürzlich hinzugefügt',
			description: 'Neue Kontakte der letzten 14 Tage',
			icon: Clock,
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
</PickerOverlay>
