import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUnuploadedCount } from '~/features/storage/hooks/useUnuploadedCount';
import type { MenuItem } from '~/components/atoms/menu/MenuTypes';

export function useMainMenuItems(): MenuItem[] {
	const router = useRouter();
	const { t } = useTranslation();
	const unuploadedCount = useUnuploadedCount();

	return useMemo(() => {
		const archiveTitle =
			unuploadedCount > 0
				? `${t('header_menu.audio_archive', 'Audio Archiv')} (${unuploadedCount})`
				: t('header_menu.audio_archive', 'Audio Archiv');

		return [
			{
				key: 'tags',
				title: t('menu.tags', 'Tags'),
				iconName: 'pricetag-outline',
				onSelect: () => router.push('/(protected)/tags'),
			},
			{
				key: 'statistics',
				title: t('menu.statistics', 'Statistiken'),
				iconName: 'bar-chart-outline',
				onSelect: () => router.push('/(protected)/statistics'),
			},
			{ key: 'sep-1', separator: true },
			{
				key: 'blueprints',
				title: t('menu.blueprints', 'Modi'),
				iconName: 'rectangle-dashed',
				onSelect: () => router.push('/(protected)/blueprints'),
			},
			{
				key: 'upload',
				title: t('header_menu.upload_audio', 'Audio hochladen'),
				iconName: 'cloud-upload-outline',
				onSelect: () => router.push('/(protected)/(tabs)/memos?openUploadModal=true'),
			},
			{
				key: 'archive',
				title: archiveTitle,
				iconName: 'waveform',
				onSelect: () => router.push('/(protected)/audio-archive'),
			},
			{ key: 'sep-2', separator: true },
			{
				key: 'subscription',
				title: t('menu.subscription', 'Abonnement'),
				iconName: 'water',
				onSelect: () => router.push('/(protected)/subscription'),
			},
			{
				key: 'settings',
				title: t('menu.settings', 'Einstellungen'),
				iconName: 'settings-outline',
				onSelect: () => router.push('/(protected)/settings'),
			},
		];
	}, [t, router, unuploadedCount]);
}
