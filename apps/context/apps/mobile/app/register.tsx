import { Stack } from 'expo-router';
import { View } from 'react-native';
import { RegisterForm } from '~/components/auth/RegisterForm';
import { Text } from '~/components/ui/Text';
import { Card } from '~/components/ui/Card';

export default function RegisterScreen() {
	return (
		<>
			<Stack.Screen
				options={{
					title: 'Registrieren',
					headerShown: true,
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
								Erstelle ein Konto, um mit BaseText zu starten
							</Text>
						</View>

						<RegisterForm />
					</Card>
				</View>
			</View>
		</>
	);
}
