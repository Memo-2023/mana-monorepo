import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function NotFound() {
	return (
		<View className="flex-1 bg-background items-center justify-center p-6">
			<Text className="text-foreground text-xl font-semibold mb-2">Screen not found</Text>
			<Link href="/(app)" className="text-primary mt-4">
				Go home
			</Link>
		</View>
	);
}
