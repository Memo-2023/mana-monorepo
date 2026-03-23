import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthProvider';
import { api } from '../services/api';
import { useTheme, lightColors, darkColors } from '../utils/themeContext';

export default function DashboardStats() {
	const router = useRouter();
	const { isDarkMode } = useTheme();
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [orgCount, setOrgCount] = useState(0);
	const [availableMana, setAvailableMana] = useState(0);
	const [totalMana, setTotalMana] = useState(0);

	useEffect(() => {
		if (user) {
			fetchUserStats();
		} else {
			setLoading(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	async function fetchUserStats() {
		try {
			setLoading(true);

			// Fetch organizations count
			const { data: orgsData } = await api.getOrganizations();
			setOrgCount(orgsData?.length || 0);

			// Fetch credit balance
			const { data: creditData } = await api.getCreditBalance();
			if (creditData) {
				setTotalMana(creditData.totalCredits || 0);
				setAvailableMana(creditData.balance || 0);
			}
		} catch (error) {
			console.error('Fehler beim Abrufen der Benutzerstatistiken:', error);
		} finally {
			setLoading(false);
		}
	}

	if (!user || loading) {
		return (
			<View
				className={`flex-row justify-between ${isDarkMode ? 'bg-gray-800' : 'bg-white'} mb-5 rounded-lg p-4 shadow`}
			>
				<ActivityIndicator size="small" color={isDarkMode ? '#60A5FA' : '#0055FF'} />
			</View>
		);
	}

	return (
		<View className="mb-5">
			{/* Mana-Anzeige */}
			<View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} mb-3 rounded-lg p-4 shadow`}>
				<TouchableOpacity className="items-center" onPress={() => router.push('/get-mana')}>
					<View className="mb-2 flex-row items-center">
						<FontAwesome5 name="fire" size={18} color="#F59E0B" className="mr-2" />
						<Text className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
							Verfügbares Mana
						</Text>
					</View>
					<View className="mb-2 h-4 w-full rounded-full bg-gray-200 dark:bg-gray-700">
						<View
							className="h-4 rounded-full"
							style={{
								width:
									totalMana > 0 ? `${Math.min(100, (availableMana / totalMana) * 100)}%` : '0%',
								backgroundColor: isDarkMode ? darkColors.primary : lightColors.primary,
							}}
						/>
					</View>
					<View className="w-full flex-row justify-between">
						<Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
							Verfügbar: {availableMana}
						</Text>
						<Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
							Gesamt: {totalMana}
						</Text>
					</View>
				</TouchableOpacity>
			</View>

			{/* Organisationen */}
			<View
				className={`flex-row justify-between ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow`}
			>
				<TouchableOpacity
					className={`flex-1 flex-row items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3`}
					onPress={() => router.push('/organizations')}
				>
					<View className="items-center">
						<View className="mb-1 flex-row items-center">
							<FontAwesome5
								name="building"
								size={16}
								color={isDarkMode ? '#60A5FA' : '#0055FF'}
								className="mr-2"
							/>
							<Text
								className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
							>
								Organisationen
							</Text>
						</View>
						<View
							className={`${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'} rounded-full px-3 py-1`}
						>
							<Text className={`${isDarkMode ? 'text-blue-300' : 'text-blue-700'} font-medium`}>
								{orgCount}
							</Text>
						</View>
					</View>
				</TouchableOpacity>
			</View>
		</View>
	);
}
