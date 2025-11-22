import { Stack, useRouter } from 'expo-router';
import { ScrollView, Text, View, TouchableOpacity, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { Container } from '~/components/Container';
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
  colorClass 
}: { 
  onPress: () => void; 
  icon: string; 
  label: string; 
  colorClass: string; 
}) => (
  <TouchableOpacity 
    className={`${colorClass} rounded-lg p-4 flex-row items-center justify-center shadow-md flex-1`}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <FontAwesome5 name={icon} size={24} color="white" />
    <Text className="text-white text-lg font-bold ml-3">{label}</Text>
  </TouchableOpacity>
);

// Extraktion der Feature-Liste als Komponente
const FeatureList = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-5 mb-5 shadow`}>
    <Text className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
      Mit ManaCore können Sie:
    </Text>
    {FEATURES.map((feature, index) => (
      <View key={index} className="flex-row items-center mb-3">
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
          title: 'ManaCore',
          headerShown: true,
        }} 
      />
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          padding: 16,
          paddingBottom: 40
        }}
      >
        {/* Welcome Section */}
        <View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-5 mb-5 shadow`}>
          <Text className={`text-2xl font-bold mb-2.5 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Willkommen bei ManaCore
          </Text>
          <Text className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-6`}>
            Teilen Sie Ihre Energie mit anderen und verwalten Sie Ihre Mana-Kredite.
          </Text>
        </View>
        
        {/* Dashboard Stats */}
        <DashboardStats />
        
        {/* Action Buttons */}
        <View className="flex-row justify-between mb-5">
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
          className={`${isDarkMode ? 'bg-purple-700' : 'bg-purple-600'} rounded-lg p-5 mb-5 flex-row items-center justify-center shadow-md`}
          onPress={navigateToApps}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="rocket" size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-4">Apps entdecken</Text>
        </TouchableOpacity>

        {/* Feature List */}
        <FeatureList isDarkMode={isDarkMode} />
      </ScrollView>
    </View>
  );
}

// NativeWind wird für das Styling verwendet, daher sind keine StyleSheet-Definitionen erforderlich
