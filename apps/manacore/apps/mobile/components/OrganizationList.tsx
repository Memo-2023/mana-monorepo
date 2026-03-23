import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { api } from '../services/api';
import { useTheme } from '../utils/themeContext';
import { useRouter } from 'expo-router';

interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string;
	createdAt: string;
	metadata?: Record<string, any>;
}

interface OrganizationListProps {
	hideTitle?: boolean;
}

// Definiere die Ref-Schnittstelle
interface OrganizationListRef {
	refreshOrganizations: () => void;
}

const OrganizationList = forwardRef<OrganizationListRef, OrganizationListProps>(
	({ hideTitle = false }, ref) => {
		const { user } = useAuth();
		const [loading, setLoading] = useState(true);
		const [organizations, setOrganizations] = useState<Organization[]>([]);
		const { isDarkMode } = useTheme();
		const router = useRouter();

		// Stelle die refreshOrganizations-Methode über die Ref zur Verfügung
		useImperativeHandle(ref, () => ({
			refreshOrganizations: () => {
				if (user) {
					fetchUserOrganizations();
				}
			},
		}));

		useEffect(() => {
			if (user) {
				fetchUserOrganizations();
			} else {
				setLoading(false);
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [user]);

		async function fetchUserOrganizations() {
			try {
				setLoading(true);

				const { data, error } = await api.getOrganizations();

				if (error) {
					throw new Error(error);
				}

				setOrganizations(data || []);
			} catch (error) {
				console.error('Fehler beim Abrufen der Organisationen:', error);
				Alert.alert('Fehler', 'Es ist ein Fehler beim Laden Ihrer Organisationen aufgetreten.');
			} finally {
				setLoading(false);
			}
		}

		const formatDate = (dateString: string) => {
			const date = new Date(dateString);
			return date.toLocaleDateString('de-DE', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
		};

		if (!user) {
			return (
				<View
					className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-4 shadow`}
				>
					<Text
						className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} p-5 text-center`}
					>
						Bitte melden Sie sich an, um Ihre Organisationen zu sehen.
					</Text>
				</View>
			);
		}

		if (loading) {
			return (
				<View
					className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-4 shadow`}
				>
					<ActivityIndicator size="large" color={isDarkMode ? '#93C5FD' : '#0055FF'} />
					<Text
						className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2.5 text-center`}
					>
						Lade Organisationen...
					</Text>
				</View>
			);
		}

		if (organizations.length === 0) {
			return (
				<View
					className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-4 shadow`}
				>
					<FontAwesome5
						name="building"
						size={50}
						color={isDarkMode ? '#4B5563' : '#ccc'}
						className="mb-4 self-center"
					/>
					<Text
						className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-2.5 text-center`}
					>
						Sie gehören derzeit keiner Organisation an.
					</Text>
					<Text
						className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} px-5 text-center`}
					>
						Erstellen Sie eine neue Organisation oder bitten Sie einen Administrator, Sie einer
						Organisation hinzuzufügen.
					</Text>
				</View>
			);
		}

		return (
			<View
				className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-4 shadow`}
			>
				{!hideTitle && (
					<Text
						className={`mb-4 text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
					>
						Meine Organisationen
					</Text>
				)}
				<FlatList
					data={organizations}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<TouchableOpacity
							onPress={() => {
								router.push({
									pathname: '/organizations/[id]',
									params: { id: item.id, name: item.name },
								});
							}}
							className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} mb-2.5 rounded-lg p-4 shadow-sm`}
							activeOpacity={0.7}
						>
							{/* Header mit Organisationsname */}
							<View className="mb-3 flex-row items-center justify-between">
								<View className="flex-row items-center">
									<FontAwesome5
										name="building"
										size={18}
										color={isDarkMode ? '#93C5FD' : '#0055FF'}
										className="mr-2.5"
									/>
									<Text
										className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
									>
										{item.name}
									</Text>
								</View>
							</View>

							{/* Erstellungsdatum */}
							<View className="flex-row items-center">
								<FontAwesome5
									name="calendar-alt"
									size={14}
									color={isDarkMode ? '#9CA3AF' : '#666'}
									className="mr-2"
								/>
								<Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
									{formatDate(item.createdAt)}
								</Text>
							</View>
						</TouchableOpacity>
					)}
					className="pb-5"
				/>
			</View>
		);
	}
);

export default OrganizationList;
