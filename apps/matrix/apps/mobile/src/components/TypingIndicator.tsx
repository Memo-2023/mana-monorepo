import { View, Text } from 'react-native';

interface Props {
	users: string[];
}

export default function TypingIndicator({ users }: Props) {
	if (users.length === 0) return null;

	const label =
		users.length === 1
			? `${users[0]} is typing...`
			: users.length === 2
				? `${users[0]} and ${users[1]} are typing...`
				: 'Several people are typing...';

	return (
		<View className="px-4 py-1">
			<Text className="text-muted-foreground text-xs italic">{label}</Text>
		</View>
	);
}
