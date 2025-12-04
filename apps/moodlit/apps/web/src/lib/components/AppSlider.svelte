<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { AppSlider, type AppItem } from '@manacore/shared-ui';
	import {
		MANA_APPS,
		APP_STATUS_LABELS,
		APP_SLIDER_LABELS,
		getActiveManaApps,
	} from '@manacore/shared-branding';

	// Get current language
	let currentLocale = $derived(($locale || 'de') as 'de' | 'en');

	// Convert MANA_APPS to AppItem format (based on current locale)
	let apps = $derived<AppItem[]>(
		getActiveManaApps().map((app) => ({
			name: app.name,
			description: app.description[currentLocale],
			longDescription: app.longDescription[currentLocale],
			icon: app.icon,
			color: app.color,
			comingSoon: app.comingSoon,
			status: app.status,
		}))
	);

	let statusLabels = $derived(APP_STATUS_LABELS[currentLocale]);
	let labels = $derived(APP_SLIDER_LABELS[currentLocale]);

	function handleAppClick(app: AppItem, index: number) {
		console.log('Opening app:', app.name);
	}
</script>

<AppSlider
	{apps}
	title={labels.title}
	isDark={false}
	{statusLabels}
	comingSoonLabel={labels.comingSoon}
	openAppLabel={labels.openApp}
	onAppClick={handleAppClick}
/>
