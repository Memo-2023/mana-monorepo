import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { View } from 'react-native';

import { MiniPlayer } from '~/components/MiniPlayer';

export default function TabLayout() {
	return (
		<View style={{ flex: 1 }}>
			<NativeTabs>
				<NativeTabs.Trigger name="index">
					<Icon sf="music.note.list" />
					<Label>Bibliothek</Label>
				</NativeTabs.Trigger>

				<NativeTabs.Trigger name="playlists">
					<Icon sf="list.bullet" />
					<Label>Playlists</Label>
				</NativeTabs.Trigger>

				<NativeTabs.Trigger name="search">
					<Icon sf="magnifyingglass" />
					<Label>Suche</Label>
				</NativeTabs.Trigger>

				<NativeTabs.Trigger name="settings">
					<Icon sf="gearshape.fill" />
					<Label>Einstellungen</Label>
				</NativeTabs.Trigger>
			</NativeTabs>
			<MiniPlayer />
		</View>
	);
}
