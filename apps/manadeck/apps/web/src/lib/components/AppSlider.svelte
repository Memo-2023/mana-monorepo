<script lang="ts">
	import { AppSlider, type AppItem } from '@manacore/shared-ui';
	import { t } from 'svelte-i18n';

	let apps = $derived<AppItem[]>([
		{
			name: 'Memoro',
			description: $t('app_slider.memoro_desc'),
			longDescription: $t('app_slider.memoro_long_desc'),
			icon: '/images/app-icons/memoro-logo-gradient.png',
			color: '#f8d62b',
			comingSoon: false,
			status: 'published',
		},
		{
			name: 'ManaDeck',
			description: $t('app_slider.manadeck_desc'),
			longDescription: $t('app_slider.manadeck_long_desc'),
			icon: '/images/app-icons/manadeck-logo-gradient.png',
			color: '#8b5cf6',
			comingSoon: false,
			status: 'development',
		},
		{
			name: 'Märchenzauber',
			description: $t('app_slider.maerchenzauber_desc'),
			longDescription: $t('app_slider.maerchenzauber_long_desc'),
			icon: '/images/app-icons/maerchenzauber-logo-gradient.png',
			color: '#FF6B9D',
			comingSoon: true,
			status: 'beta',
		},
		{
			name: 'Moodlit',
			description: $t('app_slider.moodlit_desc'),
			longDescription: $t('app_slider.moodlit_long_desc'),
			icon: '/images/app-icons/moodlit-logo-gradient.png',
			color: '#9C27B0',
			comingSoon: true,
			status: 'planning',
		},
		{
			name: 'Manacore',
			description: $t('app_slider.manacore_desc'),
			longDescription: $t('app_slider.manacore_long_desc'),
			icon: '/images/app-icons/manacore-logo-gradient.png',
			color: '#6366f1',
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
	isDark={false}
	{statusLabels}
	comingSoonLabel={$t('app_slider.coming_soon')}
	openAppLabel={$t('app_slider.download')}
	onAppClick={handleAppClick}
/>
