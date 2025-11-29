<script lang="ts">
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import { Check, Lock, Clock, Star, Sparkle, Leaf, Hexagon, Waves } from '@manacore/shared-icons';
	import type { ThemeStatus } from '../types';
	import ThemeColorPreview from './ThemeColorPreview.svelte';

	// Theme icon components map
	const themeIcons = {
		sparkle: Sparkle,
		leaf: Leaf,
		hexagon: Hexagon,
		waves: Waves,
	} as const;

	interface Props {
		variant: ThemeVariant;
		isActive: boolean;
		status?: ThemeStatus;
		onClick?: () => void;
		onUnlock?: () => void;
		translations?: {
			locked?: string;
			comingSoon?: string;
			premium?: string;
			unlock?: string;
			lightPreview?: string;
			darkPreview?: string;
		};
	}

	let {
		variant,
		isActive,
		status = 'available',
		onClick,
		onUnlock,
		translations = {},
	}: Props = $props();

	const t = {
		locked: translations.locked ?? 'Gesperrt',
		comingSoon: translations.comingSoon ?? 'Bald verfügbar',
		premium: translations.premium ?? 'Premium',
		unlock: translations.unlock ?? 'Freischalten',
		lightPreview: translations.lightPreview ?? 'Hell',
		darkPreview: translations.darkPreview ?? 'Dunkel',
	};

	const definition = $derived(THEME_DEFINITIONS[variant]);
	const isAvailable = $derived(status === 'available');
	const isLocked = $derived(status === 'locked');
	const isComingSoon = $derived(status === 'coming_soon');
	const isPremium = $derived(status === 'premium');

	function handleClick() {
		if (isAvailable && onClick) {
			onClick();
		}
	}

	function handleUnlock(e: MouseEvent) {
		e.stopPropagation();
		if (onUnlock) {
			onUnlock();
		}
	}
</script>

<button
	type="button"
	onclick={handleClick}
	disabled={!isAvailable}
	class="relative w-full p-4 rounded-xl border-2 transition-all text-left
         {isActive
		? 'border-primary bg-primary/5 ring-2 ring-primary/20'
		: 'border-border bg-surface hover:border-primary/50'}
         {!isAvailable ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
         {isPremium ? 'border-yellow-500/50' : ''}"
>
	<!-- Premium badge -->
	{#if isPremium}
		<div
			class="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5
                  bg-yellow-500 text-yellow-950 text-xs font-medium rounded-full"
		>
			<Star size={12} weight="fill" />
			{t.premium}
		</div>
	{/if}

	<!-- Active checkmark -->
	{#if isActive && isAvailable}
		<div
			class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center
                  bg-primary text-primary-foreground rounded-full"
		>
			<Check size={14} weight="bold" />
		</div>
	{/if}

	<!-- Header -->
	<div class="flex items-center gap-2 mb-3">
		{#if definition.icon && themeIcons[definition.icon as keyof typeof themeIcons]}
			<svelte:component
				this={themeIcons[definition.icon as keyof typeof themeIcons]}
				size={20}
				weight="duotone"
				class="text-primary"
			/>
		{/if}
		<span class="font-semibold text-foreground">{definition.label}</span>
	</div>

	<!-- Color previews -->
	<div class="space-y-2 mb-3">
		<div class="flex items-center gap-2">
			<span class="text-xs text-muted-foreground w-10">{t.lightPreview}</span>
			<ThemeColorPreview {variant} mode="light" size="sm" />
		</div>
		<div class="flex items-center gap-2">
			<span class="text-xs text-muted-foreground w-10">{t.darkPreview}</span>
			<ThemeColorPreview {variant} mode="dark" size="sm" />
		</div>
	</div>

	<!-- Status badges -->
	{#if isLocked}
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-1 text-muted-foreground text-sm">
				<Lock size={14} weight="bold" />
				{t.locked}
			</div>
			{#if onUnlock}
				<button
					type="button"
					onclick={handleUnlock}
					class="px-2 py-1 text-xs font-medium text-primary bg-primary/10
                       rounded hover:bg-primary/20 transition-colors"
				>
					{t.unlock}
				</button>
			{/if}
		</div>
	{:else if isComingSoon}
		<div class="flex items-center gap-1 text-muted-foreground text-sm">
			<Clock size={14} weight="bold" />
			{t.comingSoon}
		</div>
	{/if}
</button>
