import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, Text, View, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import { useTheme } from '../../utils/themeContext';

// TODO: App-Liste (Satellites) war zuvor in Supabase gespeichert.
// Bis diese Daten über mana-auth oder einen eigenen Endpunkt verfügbar sind,
// verwenden wir eine statische Liste der bekannten Mana-Apps.

interface AppInfo {
	id: string;
	name: string;
	description: string;
	icon: string;
	link_web?: string;
}

const MANA_APPS: AppInfo[] = [
	{
		id: 'chat',
		name: 'Chat',
		description: 'KI-Chat-Anwendung mit verschiedenen Modellen',
		icon: 'comments',
		link_web: 'https://chat.mana.how',
	},
	{
		id: 'picture',
		name: 'Picture',
		description: 'KI-Bildgenerierung',
		icon: 'image',
		link_web: 'https://picture.mana.how',
	},
	{
		id: 'quotes',
		name: 'Quotes',
		description: 'Tägliche Inspirationszitate',
		icon: 'quote-left',
		link_web: 'https://quotes.mana.how',
	},
	{
		id: 'cards',
		name: 'Cards',
		description: 'Karten- und Deck-Verwaltung',
		icon: 'layer-group',
		link_web: 'https://cards.mana.how',
	},
	{
		id: 'contacts',
		name: 'Contacts',
		description: 'Kontaktverwaltung',
		icon: 'address-book',
	},
];

export default function Apps() {
	const { isDarkMode } = useTheme();

	const openAppLink = async (app: AppInfo) => {
		try {
			if (!app.link_web) {
				Alert.alert('Bald verfügbar', `${app.name} wird bald verfügbar sein.`, [{ text: 'OK' }]);
				return;
			}

			const canOpen = await Linking.canOpenURL(app.link_web);
			if (canOpen) {
				await Linking.openURL(app.link_web);
			} else {
				Alert.alert('Fehler', `Der Link für ${app.name} kann nicht geöffnet werden.`, [
					{ text: 'OK' },
				]);
			}
		} catch (error) {
			console.error('Fehler beim Öffnen des Links:', error);
			Alert.alert('Fehler', 'Beim Öffnen des Links ist ein Fehler aufgetreten.', [{ text: 'OK' }]);
		}
	};

	return (
		<>
			<Stack.Screen
				options={{
					title: 'Apps',
					headerLargeTitle: true,
				}}
			/>
			<Container>
				<ScrollView className="flex-1">
					<View className="mx-2.5 my-4">
						<Text
							className={`mb-2 text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
						>
							Verfügbare Apps
						</Text>
						<Text className={`mb-6 text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
							Entdecke Apps, die mit Mana verbunden werden können
						</Text>

						<View className="flex-row flex-wrap justify-between">
							{MANA_APPS.map((app) => (
								<TouchableOpacity
									key={app.id}
									className={`mb-4 w-[48%] overflow-hidden rounded-xl shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
									onPress={() => openAppLink(app)}
									activeOpacity={0.7}
								>
									<View className="items-center p-4">
										<View className="mb-3 h-16 w-16 items-center justify-center rounded-lg bg-gray-200">
											<FontAwesome5
												name={app.icon}
												size={24}
												color={isDarkMode ? '#60A5FA' : '#0055FF'}
											/>
										</View>

										<Text
											className={`mb-1 text-center text-base font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
										>
											{app.name}
										</Text>

										<Text
											className={`text-center text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
											numberOfLines={2}
											ellipsizeMode="tail"
										>
											{app.description}
										</Text>
									</View>

									<TouchableOpacity
										className={`w-full py-2 ${isDarkMode ? 'bg-blue-700' : 'bg-blue-600'}`}
										onPress={() => openAppLink(app)}
										disabled={!app.link_web}
									>
										<Text className="text-center text-sm font-medium text-white">
											{app.link_web ? 'Öffnen' : 'Bald verfügbar'}
										</Text>
									</TouchableOpacity>
								</TouchableOpacity>
							))}
						</View>

						<View className={`mt-4 rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
							<Text
								className={`mb-2 text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
							>
								Über Apps
							</Text>
							<Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
								Apps sind Erweiterungen, die mit Mana verbunden werden können, um zusätzliche
								Funktionen zu nutzen. Jede App bietet spezifische Funktionen, die deine
								Mana-Erfahrung verbessern.
							</Text>
						</View>
					</View>
				</ScrollView>
			</Container>
		</>
	);
}
