import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { useTheme } from '../utils/themeContext';

// TODO: Team-Erstellung ist in mana-core-auth noch nicht implementiert.
// Diese Komponente zeigt vorerst einen Hinweis an.

interface CreateTeamProps {
	onTeamCreated?: (teamId: string, teamName: string) => void;
}

export default function CreateTeam({ onTeamCreated: _onTeamCreated }: CreateTeamProps) {
	const { isDarkMode } = useTheme();
	const { user } = useAuth();

	if (!user) {
		return (
			<View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-5 shadow`}>
				<Text
					className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} p-5 text-center`}
				>
					Bitte melden Sie sich an, um Teams zu erstellen.
				</Text>
			</View>
		);
	}

	return (
		<View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-5 shadow`}>
			<Text className={`mb-5 text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
				Neues Team erstellen
			</Text>

			<View className="items-center py-8">
				<FontAwesome5 name="users" size={50} color={isDarkMode ? '#4B5563' : '#9CA3AF'} />
				<Text
					className={`mt-4 text-center text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
				>
					Die Team-Erstellung wird derzeit auf das neue Auth-System migriert und ist bald wieder
					verfügbar.
				</Text>
			</View>
		</View>
	);
}
