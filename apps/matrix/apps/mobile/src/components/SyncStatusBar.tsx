import { View, Text } from 'react-native';
import type { SyncState } from '~/src/matrix/types';

interface Props {
	syncState: SyncState;
}

const statusConfig: Record<string, { label: string; color: string } | null> = {
	STOPPED: { label: 'Disconnected', color: 'bg-destructive/80' },
	ERROR: { label: 'Connection error', color: 'bg-destructive/80' },
	RECONNECTING: { label: 'Reconnecting...', color: 'bg-yellow-500/80' },
	CATCHUP: { label: 'Catching up...', color: 'bg-yellow-500/80' },
	PREPARED: null,
	SYNCING: null,
};

export default function SyncStatusBar({ syncState }: Props) {
	const config = statusConfig[syncState];
	if (!config) return null;

	return (
		<View className={`${config.color} px-4 py-1 items-center`}>
			<Text className="text-white text-xs font-medium">{config.label}</Text>
		</View>
	);
}
