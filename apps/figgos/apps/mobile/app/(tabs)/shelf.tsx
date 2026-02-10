import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ShelfScreen() {
	return (
		<SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
			<View className="flex-1 items-center justify-center px-6">
				<Text className="text-2xl font-bold text-foreground">My Collection</Text>
				<Text className="text-muted-foreground mt-2 text-center">
					Your collected figures will appear here.
				</Text>
			</View>
		</SafeAreaView>
	);
}
