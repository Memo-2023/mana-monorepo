import { Stack, useRouter } from 'expo-router';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import DashboardStats from '../../components/DashboardStats';
import { useTheme } from '../../utils/themeContext';

// Extraktion der Feature-Liste für bessere Wartbarkeit
const FEATURES = [
	{ icon: 'exchange-alt', text: 'Mana an andere Benutzer senden' },
	{ icon: 'users', text: 'Teams und Organisationen verwalten' },
	{ icon: 'chart-line', text: 'Ihre Mana-Nutzung verfolgen' },
	{ icon: 'shopping-cart', text: 'Mana für Ihre Projekte erwerben' },
	{ icon: 'rocket', text: 'Nützliche Apps entdecken' },
];

// Extraktion der Action-Buttons für bessere Wartbarkeit
const ActionButton = ({
	onPress,
	icon,
	label,
	colorClass,
}: {
	onPress: () => void;
	icon: string;
	label: string;
	colorClass: string;
}) => (
	<TouchableOpacity
		className={`${colorClass} flex-1 flex-row items-center justify-center rounded-lg p-4 shadow-md`}
		onPress={onPress}
		activeOpacity={0.8}
	>
		<FontAwesome5 name={icon} size={24} color="white" />
		<Text className="ml-3 text-lg font-bold text-white">{label}</Text>
	</TouchableOpacity>
);

// Extraktion der Feature-Liste als Komponente
const FeatureList = ({ isDarkMode }: { isDarkMode: boolean }) => (
	<View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} mb-5 rounded-lg p-5 shadow`}>
		<Text className={`mb-4 text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
			Mit Mana können Sie:
		</Text>
		{FEATURES.map((feature, index) => (
			<View key={index} className="mb-3 flex-row items-center">
				<FontAwesome5
					name={feature.icon}
					size={18}
					color={isDarkMode ? '#60A5FA' : '#0055FF'}
					className="mr-2.5 w-6"
				/>
				<Text className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
					{feature.text}
				</Text>
			</View>
		))}
	</View>
);

export default function Home() {
	const router = useRouter();
	const { isDarkMode } = useTheme();

	const navigateToSendMana = () => router.push('/send-mana');
	const navigateToGetMana = () => router.push('/get-mana');
	const navigateToApps = () => router.push('/apps');

	return (
		<View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
			<Stack.Screen
				options={{
					title: 'Mana',
					headerShown: true,
				}}
			/>
			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					padding: 16,
					paddingBottom: 40,
				}}
			>
				{/* Welcome Section */}
				<View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} mb-5 rounded-lg p-5 shadow`}>
					<Text
						className={`mb-2.5 text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
					>
						Willkommen bei Mana
					</Text>
					<Text className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-6`}>
						Teilen Sie Ihre Energie mit anderen und verwalten Sie Ihre Mana-Kredite.
					</Text>
				</View>

				{/* Dashboard Stats */}
				<DashboardStats />

				{/* Action Buttons */}
				<View className="mb-5 flex-row justify-between">
					<ActionButton
						onPress={navigateToSendMana}
						icon="hand-holding-heart"
						label="Mana senden"
						colorClass={`${isDarkMode ? 'bg-blue-700' : 'bg-blue-600'} mr-2`}
					/>
					<ActionButton
						onPress={navigateToGetMana}
						icon="shopping-cart"
						label="Mana erwerben"
						colorClass={`${isDarkMode ? 'bg-green-700' : 'bg-green-600'} ml-2`}
					/>
				</View>

				{/* Apps Button */}
				<TouchableOpacity
					className={`${isDarkMode ? 'bg-purple-700' : 'bg-purple-600'} mb-5 flex-row items-center justify-center rounded-lg p-5 shadow-md`}
					onPress={navigateToApps}
					activeOpacity={0.8}
				>
					<FontAwesome5 name="rocket" size={24} color="white" />
					<Text className="ml-4 text-lg font-bold text-white">Apps entdecken</Text>
				</TouchableOpacity>

				{/* Feature List */}
				<FeatureList isDarkMode={isDarkMode} />
			</ScrollView>
		</View>
	);
}

// NativeWind wird für das Styling verwendet, daher sind keine StyleSheet-Definitionen erforderlich
