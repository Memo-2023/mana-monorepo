import { View, Text } from 'react-native';

interface Props {
	timestamp: number;
}

function formatDate(timestamp: number): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

	if (diffDays === 0) return 'Today';
	if (diffDays === 1) return 'Yesterday';
	if (diffDays < 7) {
		return date.toLocaleDateString([], { weekday: 'long' });
	}
	return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function DateSeparator({ timestamp }: Props) {
	return (
		<View className="flex-row items-center gap-3 mx-4 my-4">
			<View className="flex-1 h-px bg-border" />
			<Text className="text-muted-foreground text-xs">{formatDate(timestamp)}</Text>
			<View className="flex-1 h-px bg-border" />
		</View>
	);
}
