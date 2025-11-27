/**
 * Native Tabs Implementation für iOS 18+ mit Liquid Glass Effekt
 * Basierend auf der offiziellen Expo Router Native Tabs Dokumentation
 */

import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function NativeTabLayout() {
	const { t } = useTranslation();

	// Monochrome Farben für Liquid Glass - passen sich automatisch an hell/dunkel an
	const liquidGlassColors =
		Platform.OS === 'ios'
			? {
					// Text Farbe
					color: DynamicColorIOS({
						dark: 'white',
						light: 'black',
					}),
					// Icon Farbe (selected)
					tintColor: DynamicColorIOS({
						dark: 'white',
						light: 'black',
					}),
				}
			: {
					color: '#ffffff',
					tintColor: '#ffffff',
				};

	return (
		<NativeTabs
			// Farben für Liquid Glass
			labelStyle={liquidGlassColors}
		>
			{/* Zitate Tab */}
			<NativeTabs.Trigger
				name="quotes"
				// Optional: Scroll-to-top beim erneuten Tippen
				disableScrollToTop={false}
			>
				<Label>{t('navigation.quotes')}</Label>
				<Icon
					// SF Symbols für iOS (beste native Integration)
					sf={{
						default: 'book',
						selected: 'book.fill',
					}}
					// Fallback für Android
					drawable="ic_book"
				/>
			</NativeTabs.Trigger>

			{/* Autoren Tab */}
			<NativeTabs.Trigger name="authors" disableScrollToTop={false}>
				<Label>{t('navigation.authors')}</Label>
				<Icon
					sf={{
						default: 'person.2',
						selected: 'person.2.fill',
					}}
					drawable="ic_people"
				/>
			</NativeTabs.Trigger>

			{/* Listen Tab */}
			<NativeTabs.Trigger name="liste" disableScrollToTop={false}>
				<Label>Listen</Label>
				<Icon
					sf={{
						default: 'list.bullet',
						selected: 'list.bullet.rectangle.fill',
					}}
					drawable="ic_list"
				/>
			</NativeTabs.Trigger>

			{/* Meine Zitate Tab */}
			<NativeTabs.Trigger name="myquotes" disableScrollToTop={false}>
				<Label>{t('navigation.myQuotes')}</Label>
				<Icon
					sf={{
						default: 'square.and.pencil',
						selected: 'square.and.pencil.fill',
					}}
					drawable="ic_create"
				/>
			</NativeTabs.Trigger>

			{/* Search Tab - iOS 18+: Separate search tab für native Suche */}
			<NativeTabs.Trigger name="search" role="search" disableScrollToTop={false}>
				<Label>{t('navigation.search')}</Label>
				<Icon
					sf={{
						default: 'magnifyingglass',
						selected: 'magnifyingglass.circle.fill',
					}}
					drawable="ic_search"
				/>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
