import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

export default function TabLayout() {
	return (
		<NativeTabs minimizeBehavior="automatic">
			<NativeTabs.Trigger name="decks">
				<Label>Decks</Label>
				<Icon
					sf={{ default: 'square.stack.3d.up', selected: 'square.stack.3d.up.fill' }}
					drawable="ic_albums"
				/>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="explore">
				<Label>Entdecken</Label>
				<Icon sf={{ default: 'safari', selected: 'safari.fill' }} drawable="ic_explore" />
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="progress">
				<Label>Fortschritt</Label>
				<Icon
					sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }}
					drawable="ic_trending_up"
				/>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="profile">
				<Label>Profil</Label>
				<Icon sf={{ default: 'person', selected: 'person.fill' }} drawable="ic_person" />
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
