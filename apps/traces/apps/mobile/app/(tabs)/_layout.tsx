import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<Icon sf="location.fill" />
				<Label>Tracking</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="places">
				<Icon sf="mappin.and.ellipse" />
				<Label>Orte</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="map">
				<Icon sf="map.fill" />
				<Label>Karte</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="cities">
				<Icon sf="building.2.fill" />
				<Label>Städte</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="guides">
				<Icon sf="book.fill" />
				<Label>Führungen</Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
