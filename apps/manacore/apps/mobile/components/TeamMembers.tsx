import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { useTheme } from '../utils/themeContext';

// TODO: Team-Mitgliederverwaltung mit Credit-Zuweisung ist in mana-core-auth noch nicht implementiert.
// Diese Komponente zeigt vorerst einen Hinweis an.

interface TeamMembersProps {
	teamId: string;
}

export default function TeamMembers({ teamId: _teamId }: TeamMembersProps) {
	const { user } = useAuth();
	const { isDarkMode } = useTheme();

	if (!user) {
		return (
			<View
				className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-4 shadow`}
			>
				<Text
					className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} p-5 text-center`}
				>
					Bitte melden Sie sich an, um Teammitglieder zu sehen.
				</Text>
			</View>
		);
	}

	return (
		<View className="flex-1">
			<View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-4 shadow`}>
				<Text
					className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}
				>
					Teammitglieder
				</Text>

				<View className="items-center justify-center py-8">
					<FontAwesome5 name="users" size={50} color={isDarkMode ? '#4B5563' : '#ccc'} />
					<Text
						className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-4 text-center`}
					>
						Die Team-Mitgliederverwaltung wird derzeit auf das neue Auth-System migriert und ist
						bald wieder verfügbar.
					</Text>
				</View>
			</View>
		</View>
	);
}
