<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { userSettings } from '$lib/stores/user-settings.svelte';
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

	// Translation function for GlobalSettingsSection
	function translate(key: string): string {
		return $_?.(key) ?? key;
	}
</script>

<div class="mx-auto max-w-2xl space-y-6">
	<h1 class="text-2xl font-bold text-foreground">{$_('settings.title')}</h1>

	<!-- Global Settings Section (synced across all apps) -->
	<GlobalSettingsSection
		{userSettings}
		appId="clock"
		title="App-Einstellungen"
		description="Diese Einstellungen werden mit allen Mana Apps synchronisiert"
		t={translate}
	/>

	<!-- Clock-specific Settings -->
	<div class="card">
		<h2 class="mb-4 text-lg font-semibold">{$_('settings.clockFormat')}</h2>

		<div>
			<label class="mb-2 block text-sm font-medium">Zeitformat</label>
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
</div>
