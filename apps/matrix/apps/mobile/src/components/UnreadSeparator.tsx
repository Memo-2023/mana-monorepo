import { View, Text } from 'react-native';

export default function UnreadSeparator() {
	return (
		<View className="flex-row items-center gap-3 px-4 py-2 my-1">
			<View className="flex-1 h-px bg-destructive/40" />
			<Text className="text-destructive text-xs font-semibold">New messages</Text>
			<View className="flex-1 h-px bg-destructive/40" />
		</View>
	);
}
