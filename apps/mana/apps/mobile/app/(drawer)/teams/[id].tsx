import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import TeamMembers from '../../../components/TeamMembers';
import { useTheme } from '../../../utils/themeContext';

// TODO: Team-Details sind in mana-auth noch nicht implementiert.
// Diese Seite zeigt vorerst die vereinfachte TeamMembers-Komponente an.

export default function TeamDetails() {
	const router = useRouter();
	const { id: teamId, name: initialTeamName } = useLocalSearchParams<{
		id: string;
		name: string;
	}>();
	const { isDarkMode } = useTheme();
	const [teamName, setTeamName] = useState(initialTeamName || '');

	useEffect(() => {
		if (initialTeamName) {
			setTeamName(initialTeamName);
		}
	}, [initialTeamName]);

	const navigateBack = () => {
		router.push('/teams');
	};

	return (
		<>
			<Stack.Screen
				options={{
					title: teamName || 'Team-Details',
					headerLargeTitle: true,
				}}
			/>

			<Container>
				<ScrollView className="flex-1">
					<View className="mx-2.5 my-2.5 flex-row justify-between">
						<TouchableOpacity
							className={`flex-row items-center rounded-lg border px-4 py-2 ${isDarkMode ? 'border-blue-500' : 'border-blue-600'}`}
							onPress={navigateBack}
						>
							<FontAwesome5
								name="arrow-left"
								size={16}
								color={isDarkMode ? '#93C5FD' : '#0055FF'}
								className="mr-2"
							/>
							<Text
								className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} text-sm font-semibold`}
							>
								Zurück zu meinen Teams
							</Text>
						</TouchableOpacity>
					</View>

					<TeamMembers teamId={teamId} />
				</ScrollView>
			</Container>
		</>
	);
}
