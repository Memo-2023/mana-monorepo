import { Stack } from 'expo-router';
import { View } from 'react-native';
import { LoginForm } from '~/components/auth/LoginForm';
import { Text } from '~/components/ui/Text';
import { Card } from '~/components/ui/Card';

export default function LoginScreen() {
	return (
		<>
			<Stack.Screen
				options={{
					title: 'Anmelden',
					headerShown: true,
					headerBackVisible: false,
				}}
			/>

			<View className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 justify-center">
				<View className="w-full max-w-md mx-auto">
					<Card className="p-6">
						<View className="items-center mb-6">
							<Text variant="h1" className="text-center mb-2">
								BaseText
							</Text>
							<Text variant="body" className="text-center text-gray-600 dark:text-gray-400">
								Melde dich an, um deine Texte zu verwalten
							</Text>
						</View>

						<LoginForm />
					</Card>
				</View>
			</View>
		</>
	);
}
