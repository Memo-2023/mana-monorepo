<script lang="ts">
	import { AppSlider } from '@manacore/shared-ui';
import type { AppItem } from '@manacore/shared-ui';
	import { APP_ICONS } from '@manacore/shared-branding';
	import { theme } from '$lib/stores/theme';
	import { t } from 'svelte-i18n';

	// theme is a Svelte 5 runes-based store, access properties directly
	let isDark = $derived(theme.isDark);

	let apps = $derived<AppItem[]>([
		{
			name: 'Memoro',
			description: $t('app_slider.memoro_desc'),
			longDescription: $t('app_slider.memoro_long_desc'),
			icon: APP_ICONS.memoro,
			color: '#f8d62b',
			comingSoon: false,
			status: 'published',
		},
		{
			name: 'Märchenzauber',
			description: $t('app_slider.maerchenzauber_desc'),
			longDescription: $t('app_slider.maerchenzauber_long_desc'),
			icon: APP_ICONS.maerchenzauber,
			color: '#FF6B9D',
			comingSoon: true,
			status: 'beta',
		},
		{
			name: 'ManaDeck',
			description: $t('app_slider.manadeck_desc'),
			longDescription: $t('app_slider.manadeck_long_desc'),
			icon: APP_ICONS.manadeck,
			color: '#8b5cf6',
			comingSoon: true,
			status: 'development',
		},
		{
			name: 'Moodlit',
			description: $t('app_slider.moodlit_desc'),
			longDescription: $t('app_slider.moodlit_long_desc'),
			icon: APP_ICONS.moodlit,
			color: '#9C27B0',
			comingSoon: true,
			status: 'planning',
		},
		{
			name: 'Manacore',
			description: $t('app_slider.manacore_desc'),
			longDescription: $t('app_slider.manacore_long_desc'),
			icon: APP_ICONS.manacore,
			color: '#00BCD4',
			comingSoon: true,
			status: 'development',
		},
	]);

	let statusLabels = $derived({
		published: $t('app_slider.status_published'),
		beta: $t('app_slider.status_beta'),
		development: $t('app_slider.status_development'),
		planning: $t('app_slider.status_planning'),
	});

	function handleAppClick(app: AppItem, index: number) {
		console.log('Opening app:', app.name);
	}
</script>

<AppSlider
	{apps}
	title={$t('app_slider.title')}
	{isDark}
	{statusLabels}
	comingSoonLabel={$t('app_slider.coming_soon')}
	openAppLabel={$t('app_slider.download')}
	onAppClick={handleAppClick}
/>
