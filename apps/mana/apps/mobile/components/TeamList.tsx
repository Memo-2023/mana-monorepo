import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { useTheme } from '../utils/themeContext';

// TODO: Teams mit Credit-Zuweisung sind in mana-auth noch nicht implementiert.
// Diese Komponente zeigt vorerst einen Hinweis an.

interface TeamListProps {
	hideTitle?: boolean;
}

// Stub for external callers that used refreshTeamList
export function refreshTeamList(_userId: string, callback?: () => void) {
	// No-op: Teams are not yet available via mana-auth
	if (callback) callback();
}

export default function TeamList({ hideTitle = false }: TeamListProps) {
	const { isDarkMode } = useTheme();
	const { user } = useAuth();

	if (!user) {
		return (
			<Text
				className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mx-2.5 p-5 text-center`}
			>
				Bitte melden Sie sich an, um Ihre Teams zu sehen.
			</Text>
		);
	}

	return (
		<>
			{!hideTitle && (
				<Text
					className={`mb-4 text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} px-2.5`}
				>
					Meine Teams
				</Text>
			)}
			<View className="mx-2.5 flex-1 items-center justify-center p-4">
				<FontAwesome5
					name="users"
					size={50}
					color={isDarkMode ? '#4B5563' : '#ccc'}
					className="mb-4"
				/>
				<Text
					className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-2.5 text-center`}
				>
					Teams werden bald verfügbar sein.
				</Text>
				<Text
					className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} px-5 text-center`}
				>
					Die Team-Verwaltung mit Credit-Zuweisung wird derzeit auf das neue Auth-System migriert.
				</Text>
			</View>
		</>
	);
}
