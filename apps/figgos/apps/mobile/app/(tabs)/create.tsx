import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateScreen() {
	return (
		<SafeAreaView className="flex-1 bg-background dark:bg-dark-background" edges={['bottom']}>
			<View className="flex-1 items-center justify-center px-6">
				<Text className="text-2xl font-bold text-textColor dark:text-dark-textColor">Create</Text>
				<Text className="text-muted mt-2 text-center">
					Generate your own AI-powered fantasy figures.
				</Text>
			</View>
		</SafeAreaView>
	);
}
