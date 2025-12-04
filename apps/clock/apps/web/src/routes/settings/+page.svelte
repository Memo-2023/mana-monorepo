<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import { GlobalSettingsSection } from '@manacore/shared-ui';

	// Settings state
	let clockFormat = $state<'24h' | '12h'>('24h');

	// Load settings from localStorage
	if (typeof localStorage !== 'undefined') {
		const savedFormat = localStorage.getItem('clock-format');
		if (savedFormat === '12h') {
			clockFormat = '12h';
		}
	}

	function setClockFormat(format: '24h' | '12h') {
		clockFormat = format;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('clock-format', format);
		}
	}

	const languageNames: Record<string, string> = {
		de: 'Deutsch',
		en: 'English',
		fr: 'Français',
		es: 'Español',
		it: 'Italiano',
	};

	// Translation function for GlobalSettingsSection
	function translate(key: string): string {
		return $_?.(key) ?? key;
	}
</script>

<div class="mx-auto max-w-2xl space-y-6">
	<h1 class="text-2xl font-bold text-foreground">{$_('settings.title')}</h1>

	<!-- Appearance Section -->
	<div class="card">
		<h2 class="mb-4 text-lg font-semibold">{$_('settings.appearance')}</h2>

		<!-- Theme Mode -->
		<div class="mb-6">
			<label class="mb-2 block text-sm font-medium">{$_('settings.darkMode')}</label>
			<div class="flex gap-2">
				<button
					class="btn btn-sm"
					class:btn-primary={theme.mode === 'light'}
					class:btn-secondary={theme.mode !== 'light'}
					onclick={() => theme.setMode('light')}
				>
					☀️ Light
				</button>
				<button
					class="btn btn-sm"
					class:btn-primary={theme.mode === 'dark'}
					class:btn-secondary={theme.mode !== 'dark'}
					onclick={() => theme.setMode('dark')}
				>
					🌙 Dark
				</button>
				<button
					class="btn btn-sm"
					class:btn-primary={theme.mode === 'system'}
					class:btn-secondary={theme.mode !== 'system'}
					onclick={() => theme.setMode('system')}
				>
					💻 System
				</button>
			</div>
		</div>

		<!-- Theme Variant -->
		<div>
			<label class="mb-2 block text-sm font-medium">{$_('settings.theme')}</label>
			<div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
				{#each theme.variants as variant}
					<button
						class="flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-colors"
						class:border-primary={theme.variant === variant}
						class:border-transparent={theme.variant !== variant}
						onclick={() => theme.setVariant(variant)}
					>
						<span class="text-xl">{THEME_DEFINITIONS[variant].icon}</span>
						<span class="text-xs">{THEME_DEFINITIONS[variant].label}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- General Section -->
	<div class="card">
		<h2 class="mb-4 text-lg font-semibold">{$_('settings.general')}</h2>

		<!-- Language -->
		<div class="mb-6">
			<label class="mb-2 block text-sm font-medium">{$_('settings.language')}</label>
			<select
				class="input"
				onchange={(e) => setLocale((e.target as HTMLSelectElement).value as any)}
			>
				{#each supportedLocales as locale}
					<option value={locale}>{languageNames[locale]}</option>
				{/each}
			</select>
		</div>

		<!-- Clock Format -->
		<div>
			<label class="mb-2 block text-sm font-medium">{$_('settings.clockFormat')}</label>
			<div class="flex gap-2">
				<button
					class="btn btn-sm"
					class:btn-primary={clockFormat === '24h'}
					class:btn-secondary={clockFormat !== '24h'}
					onclick={() => setClockFormat('24h')}
				>
					{$_('settings.format24h')}
				</button>
				<button
					class="btn btn-sm"
					class:btn-primary={clockFormat === '12h'}
					class:btn-secondary={clockFormat !== '12h'}
					onclick={() => setClockFormat('12h')}
				>
					{$_('settings.format12h')}
				</button>
			</div>
		</div>
	</div>

	<!-- Notifications Section -->
	<div class="card">
		<h2 class="mb-4 text-lg font-semibold">{$_('settings.notifications')}</h2>
		<p class="text-sm text-muted-foreground">
			Benachrichtigungen werden für Wecker, Timer und Pomodoro-Sitzungen verwendet.
		</p>

		<button
			class="btn btn-secondary mt-4"
			onclick={async () => {
				if ('Notification' in window) {
					const permission = await Notification.requestPermission();
					if (permission === 'granted') {
						new Notification('Clock', {
							body: 'Benachrichtigungen sind jetzt aktiviert!',
						});
					}
				}
			}}
		>
			Benachrichtigungen aktivieren
		</button>
	</div>

	<!-- Sounds Section -->
	<div class="card">
		<h2 class="mb-4 text-lg font-semibold">{$_('settings.sounds')}</h2>
		<p class="text-sm text-muted-foreground">
			Töne können für einzelne Wecker und Timer in deren Einstellungen angepasst werden.
		</p>
	</div>

	<!-- Global Settings Section -->
	<GlobalSettingsSection
		{userSettings}
		appId="clock"
		showNavigation={false}
		showTheme={false}
		showLanguage={false}
		showGeneral={true}
		title="Globale Einstellungen"
		description="Diese Einstellungen gelten für alle Mana Apps"
		t={translate}
	/>
</div>
