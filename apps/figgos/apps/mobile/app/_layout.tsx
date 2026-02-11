import '../global.css';

import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
	return (
		<NativeTabs tintColor="rgb(255, 204, 0)" backgroundColor="rgb(15, 15, 30)">
			<NativeTabs.Trigger name="index">
				<Icon sf="plus.circle.fill" drawable="add_circle" />
				<Label>Create</Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="collection">
				<Icon sf="square.grid.2x2.fill" drawable="grid_view" />
				<Label>Collection</Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="neo-brutalist" hidden />
			<NativeTabs.Trigger name="retro-pixel" hidden />
		</NativeTabs>
	);
}
