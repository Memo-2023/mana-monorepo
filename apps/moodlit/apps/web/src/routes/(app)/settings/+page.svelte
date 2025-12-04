<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { moodsStore } from '$lib/stores/moods.svelte';
	import { theme } from '$lib/stores/theme';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';

	// Animation speed options
	const speedOptions = [
		{ value: 'slow', label: 'Slow' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'fast', label: 'Fast' },
	];

	// Auto timer options (in minutes)
	const autoTimerOptions = [
		{ value: 0, label: 'Off' },
		{ value: 15, label: '15 min' },
		{ value: 30, label: '30 min' },
		{ value: 60, label: '1 hour' },
		{ value: 120, label: '2 hours' },
	];

	function handleBrightnessChange(event: Event) {
		const target = event.target as HTMLInputElement;
		moodsStore.updateSettings({ brightness: parseInt(target.value) });
	}

	function handleSpeedChange(speed: string) {
		moodsStore.updateSettings({ animationSpeed: speed as 'slow' | 'normal' | 'fast' });
	}

	function handleAutoTimerChange(minutes: number) {
		moodsStore.updateSettings({ autoTimer: minutes });
	}

	function handleResetSettings() {
		if (confirm($_('settings.resetConfirm'))) {
			moodsStore.updateSettings({
				brightness: 100,
				animationSpeed: 'normal',
				autoTimer: 0,
			});
		}
	}
</script>

<div class="space-y-8 max-w-2xl">
	<header>
		<h1 class="text-3xl font-bold">{$_('settings.title')}</h1>
	</header>

	<!-- Brightness -->
	<section class="space-y-4">
		<h2 class="text-lg font-semibold">{$_('settings.brightness')}</h2>
		<div class="flex items-center gap-4">
			<input
				type="range"
				min="10"
				max="100"
				step="5"
				value={moodsStore.settings.brightness}
				onchange={handleBrightnessChange}
				class="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
			/>
			<span class="w-12 text-right text-sm text-muted-foreground">
				{moodsStore.settings.brightness}%
			</span>
		</div>
	</section>

	<!-- Animation Speed -->
	<section class="space-y-4">
		<h2 class="text-lg font-semibold">{$_('settings.animationSpeed')}</h2>
		<div class="flex gap-2">
			{#each speedOptions as option}
				<button
					class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors {moodsStore
						.settings.animationSpeed === option.value
						? 'bg-primary text-primary-foreground'
						: 'bg-muted hover:bg-muted/80'}"
					onclick={() => handleSpeedChange(option.value)}
				>
					{$_(`settings.${option.value}`)}
				</button>
			{/each}
		</div>
	</section>

	<!-- Auto Timer -->
	<section class="space-y-4">
		<h2 class="text-lg font-semibold">{$_('settings.autoTimer')}</h2>
		<div class="flex flex-wrap gap-2">
			{#each autoTimerOptions as option}
				<button
					class="py-2 px-4 rounded-lg text-sm font-medium transition-colors {moodsStore.settings
						.autoTimer === option.value
						? 'bg-primary text-primary-foreground'
						: 'bg-muted hover:bg-muted/80'}"
					onclick={() => handleAutoTimerChange(option.value)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</section>

	<!-- Theme -->
	<section class="space-y-4">
		<h2 class="text-lg font-semibold">Theme</h2>
		<div class="flex gap-2">
			<button
				class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors {theme.mode ===
				'light'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted hover:bg-muted/80'}"
				onclick={() => theme.setMode('light')}
			>
				Light
			</button>
			<button
				class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors {theme.mode ===
				'dark'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted hover:bg-muted/80'}"
				onclick={() => theme.setMode('dark')}
			>
				Dark
			</button>
			<button
				class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors {theme.mode ===
				'system'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted hover:bg-muted/80'}"
				onclick={() => theme.setMode('system')}
			>
				System
			</button>
		</div>
	</section>

	<!-- Reset -->
	<section class="pt-4 border-t border-border">
		<button
			class="py-2 px-4 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
			onclick={handleResetSettings}
		>
			{$_('settings.reset')}
		</button>
	</section>
</div>
