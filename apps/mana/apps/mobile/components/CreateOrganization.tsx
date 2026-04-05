import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthProvider';
import { api } from '../services/api';
import { useTheme } from '../utils/themeContext';

interface CreateOrganizationProps {
	onOrgCreated?: (orgId: string, orgName: string) => void;
}

export default function CreateOrganization({ onOrgCreated }: CreateOrganizationProps) {
	const { user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [organizationName, setOrganizationName] = useState('');
	const { isDarkMode } = useTheme();

	async function createOrganization() {
		if (!user) {
			Alert.alert('Fehler', 'Sie müssen angemeldet sein, um eine Organisation zu erstellen.');
			return;
		}

		if (!organizationName.trim()) {
			Alert.alert('Fehler', 'Bitte geben Sie einen Organisationsnamen ein.');
			return;
		}

		try {
			setLoading(true);

			const { data, error } = await api.createOrganization({
				name: organizationName.trim(),
			});

			if (error) {
				throw new Error(error);
			}

			Alert.alert('Erfolg', `Die Organisation "${organizationName}" wurde erfolgreich erstellt.`);

			if (onOrgCreated && data) {
				const orgData = data as any;
				onOrgCreated(orgData.id || orgData.organizationId, organizationName.trim());
			}

			// Formular zurücksetzen
			setOrganizationName('');
		} catch (error: any) {
			console.error('Fehler beim Erstellen der Organisation:', error);
			Alert.alert(
				'Fehler',
				error.message || 'Es ist ein Fehler beim Erstellen der Organisation aufgetreten.'
			);
		} finally {
			setLoading(false);
		}
	}

	if (!user) {
		return (
			<View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-5 shadow`}>
				<Text
					className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} p-5 text-center`}
				>
					Bitte melden Sie sich an, um Organisationen zu erstellen.
				</Text>
			</View>
		);
	}

	return (
		<ScrollView className="flex-1">
			<View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-5 shadow`}>
				<Text
					className={`mb-5 text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
				>
					Neue Organisation erstellen
				</Text>

				<View className="mb-4">
					<Text
						className={`mb-2 text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
					>
						Organisationsname
					</Text>
					<TextInput
						className={`h-12 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50 text-gray-800'} rounded-lg px-4 text-base`}
						value={organizationName}
						onChangeText={setOrganizationName}
						placeholder="Name der Organisation eingeben"
						placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
					/>
				</View>

				<TouchableOpacity
					className={`${isDarkMode ? 'bg-blue-700' : 'bg-blue-600'} rounded-lg px-4 py-3 ${loading ? 'opacity-70' : ''}`}
					onPress={createOrganization}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator size="small" color="white" />
					) : (
						<Text className="text-center text-base font-semibold text-white">
							Organisation erstellen
						</Text>
					)}
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}
