import { View, Platform } from 'react-native';
import { Slot } from 'expo-router';
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import { DesktopNav } from '~/components/DesktopNav';
import { useResponsive } from '~/hooks/useResponsive';
import { useTheme } from '~/contexts/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TabLayout() {
	const { isDesktop } = useResponsive();
	const { theme } = useTheme();

	// Desktop Layout with top navigation
	if (isDesktop) {
		return (
			<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
				<DesktopNav />
				<View className="flex-1">
					<Slot />
				</View>
			</View>
		);
	}

	// Mobile Layout with native bottom tabs
	return (
		<NativeTabs
			minimizeBehavior={Platform.OS === 'ios' ? 'onScrollDown' : undefined}
			backgroundColor={theme.colors.surface}
		>
			{/* Gallery Tab */}
			<NativeTabs.Trigger name="index">
				<Label>Galerie</Label>
				{Platform.select({
					ios: <Icon sf="photo.fill" />,
					default: <Icon src={<VectorIcon family={FontAwesome} name="image" />} />,
				})}
			</NativeTabs.Trigger>

			{/* Explore Tab */}
			<NativeTabs.Trigger name="explore">
				<Label>Entdecken</Label>
				{Platform.select({
					ios: <Icon sf="safari.fill" />,
					default: <Icon src={<VectorIcon family={FontAwesome} name="compass" />} />,
				})}
			</NativeTabs.Trigger>

			{/* Studio Tab */}
			<NativeTabs.Trigger name="generate">
				<Label>Studio</Label>
				{Platform.select({
					ios: <Icon sf="paintpalette.fill" />,
					default: <Icon src={<VectorIcon family={FontAwesome} name="magic" />} />,
				})}
			</NativeTabs.Trigger>

			{/* Profile Tab */}
			<NativeTabs.Trigger name="profile">
				<Label>Profil</Label>
				{Platform.select({
					ios: <Icon sf="person.fill" />,
					default: <Icon src={<VectorIcon family={FontAwesome} name="user" />} />,
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
