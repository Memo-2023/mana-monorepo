<script lang="ts">
	import { AppSlider } from '@mana/shared-ui';
	import type { AppItem } from '@mana/shared-ui';
	import { getActiveManaApps, APP_STATUS_LABELS, APP_SLIDER_LABELS } from '@mana/shared-branding';

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

	function handleAppClick(_app: AppItem, _index: number) {
		// Navigation handled by AppSlider component
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
