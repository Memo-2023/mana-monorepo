<script lang="ts">
	import { AppSlider } from '@manacore/shared-ui';
	import type { AppItem } from '@manacore/shared-ui';
	import { MANA_APPS, APP_STATUS_LABELS, APP_SLIDER_LABELS } from '@manacore/shared-branding';

	// Convert MANA_APPS to AppItem format (English)
	const apps: AppItem[] = MANA_APPS.map((app) => ({
		name: app.name,
		description: app.description.en,
		longDescription: app.longDescription.en,
		icon: app.icon,
		color: app.color,
		comingSoon: app.comingSoon,
		status: app.status,
	}));

	const statusLabels = APP_STATUS_LABELS.en;
	const labels = APP_SLIDER_LABELS.en;

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
