<script lang="ts">
	import { _ } from 'svelte-i18n';
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
		X,
	} from '@manacore/shared-icons';

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

<div class="page-picker">
	<div class="picker-header">
		<h3 class="picker-title">Neue Seite</h3>
		<button class="close-btn" onclick={onClose} title={$_('common.close')}><X size={16} /></button>
	</div>
	<div class="picker-list">
		{#each availableOptions as option, i (option.id)}
			{#if i > 0}<div class="divider"></div>{/if}
			<button class="page-option" onclick={() => onSelect(option.id)}>
				<div class="option-icon" style="color: {option.color}"><option.icon size={20} /></div>
				<div class="option-text">
					<span class="option-title">{option.title}</span>
					<span class="option-desc">{option.description}</span>
				</div>
			</button>
		{/each}
		{#if availableOptions.length === 0}
			<div class="empty-state"><p>Alle Seiten sind bereits geöffnet</p></div>
		{/if}
	</div>
</div>

<style>
	.page-picker {
		flex: 0 0 auto;
		width: min(320px, 85vw);
		min-height: 60vh;
		background: #fffef5;
		border-radius: 0.375rem;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		animation: slideIn 0.25s ease-out;
	}
	:global(.dark) .page-picker {
		background-color: #252220;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.06);
	}
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	.picker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
	}
	.picker-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin: 0;
	}
	:global(.dark) .picker-title {
		color: #f3f4f6;
	}
	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 0.375rem;
		border: none;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}
	.close-btn:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #374151;
	}
	:global(.dark) .close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}
	.picker-list {
		flex: 1;
		padding: 0 0.5rem 0.75rem;
	}
	.divider {
		height: 1px;
		background: rgba(0, 0, 0, 0.06);
		margin: 0 0.5rem;
	}
	:global(.dark) .divider {
		background: rgba(255, 255, 255, 0.06);
	}
	.page-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 0.5rem;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 0.375rem;
		transition: background 0.15s;
		text-align: left;
	}
	.page-option:hover {
		background: rgba(0, 0, 0, 0.04);
	}
	:global(.dark) .page-option:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.option-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 0.5rem;
		background: color-mix(in srgb, currentColor 10%, transparent);
	}
	.option-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}
	.option-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}
	:global(.dark) .option-title {
		color: #f3f4f6;
	}
	.option-desc {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	:global(.dark) .option-desc {
		color: #6b7280;
	}
	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
	}
	.empty-state p {
		font-size: 0.8125rem;
		color: #9ca3af;
	}
</style>
