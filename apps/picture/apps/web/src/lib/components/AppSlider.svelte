<script lang="ts">
	import { AppSlider, type AppItem } from '@manacore/shared-ui';
	import {
		getActiveManaApps,
		APP_STATUS_LABELS,
		APP_SLIDER_LABELS,
	} from '@manacore/shared-branding';
	import { theme } from '$lib/stores/theme';

	// Convert MANA_APPS to AppItem format (German)
	const apps: AppItem[] = getActiveManaApps().map((app) => ({
		name: app.name,
		description: app.description.de,
		longDescription: app.longDescription.de,
		icon: app.icon,
		color: app.color,
		comingSoon: app.comingSoon,
		status: app.status,
	}));

	const statusLabels = APP_STATUS_LABELS.de;
	const labels = APP_SLIDER_LABELS.de;

	function handleAppClick(app: AppItem, index: number) {
		console.log('Opening app:', app.name);
	}
</script>

<AppSlider
	{apps}
	title={labels.title}
	isDark={theme.isDark}
	{statusLabels}
	comingSoonLabel={labels.comingSoon}
	openAppLabel={labels.openApp}
	onAppClick={handleAppClick}
/>
