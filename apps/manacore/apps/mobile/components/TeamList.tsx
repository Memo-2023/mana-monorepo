import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { type Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/themeContext';

interface Team {
	id: string;
	name: string;
	organization_id: string;
	organization_name?: string;
	allocated_credits?: number;
	used_credits?: number;
	created_at: string;
}

interface TeamListProps {
	hideTitle?: boolean;
}

// Funktion zum Aktualisieren der Teamliste, die von außen aufgerufen werden kann
export function refreshTeamList(userId: string, callback?: () => void) {
	if (!userId) return;

	// Hole alle Teams, in denen der Benutzer Mitglied ist
	supabase
		.from('team_members')
		.select('team_id, allocated_credits, used_credits')
		.eq('user_id', userId)
		.then(({ data: teamMembers, error: teamMembersError }) => {
			if (teamMembersError) {
				console.error('Fehler beim Abrufen der Team-Mitglieder:', teamMembersError);
				if (callback) callback();
				return;
			}

			if (teamMembers && teamMembers.length > 0) {
				// Extrahiere die Team-IDs
				const teamIds = teamMembers.map((member) => member.team_id);

				// Hole die Team-Details
				supabase
					.from('teams')
					.select('id, name, organization_id, created_at')
					.in('id', teamIds)
					.then(({ data: teamsData, error: teamsError }) => {
						if (teamsError) {
							console.error('Fehler beim Abrufen der Teams:', teamsError);
							if (callback) callback();
							return;
						}

						if (teamsData && teamsData.length > 0) {
							// Hole die Organisationsnamen für jedes Team
							const orgIds = [...new Set(teamsData.map((team) => team.organization_id))];

							supabase
								.from('organizations')
								.select('id, name')
								.in('id', orgIds)
								.then(({ data: orgsData, error: orgsError }) => {
									if (orgsError) {
										console.error('Fehler beim Abrufen der Organisationen:', orgsError);
										if (callback) callback();
										return;
									}

									// Globales Event auslösen, um alle TeamList-Komponenten zu aktualisieren
									const event = new CustomEvent('teamlist-refresh', {
										detail: {
											teams: teamsData.map((team) => {
												const org = orgsData?.find((org) => org.id === team.organization_id);
												const memberInfo = teamMembers.find((member) => member.team_id === team.id);

												return {
													...team,
													organization_name: org?.name || 'Unbekannte Organisation',
													allocated_credits: memberInfo?.allocated_credits || 0,
													used_credits: memberInfo?.used_credits || 0,
												};
											}),
										},
									});

									// Event auslösen
									if (typeof window !== 'undefined') {
										window.dispatchEvent(event);
									}

									if (callback) callback();
								});
						} else {
							// Globales Event mit leerer Liste auslösen
							if (typeof window !== 'undefined') {
								window.dispatchEvent(
									new CustomEvent('teamlist-refresh', { detail: { teams: [] } })
								);
							}
							if (callback) callback();
						}
					});
			} else {
				// Globales Event mit leerer Liste auslösen
				if (typeof window !== 'undefined') {
					window.dispatchEvent(new CustomEvent('teamlist-refresh', { detail: { teams: [] } }));
				}
				if (callback) callback();
			}
		});
}

export default function TeamList({ hideTitle = false }: TeamListProps) {
	const router = useRouter();
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const [teams, setTeams] = useState<Team[]>([]);
	const { isDarkMode } = useTheme();

	useEffect(() => {
		// Prüfe den aktuellen Authentifizierungsstatus
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			if (session) {
				fetchUserTeams(session.user.id);
			} else {
				setLoading(false);
			}
		});

		// Abonniere Authentifizierungsänderungen
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			if (session) {
				fetchUserTeams(session.user.id);
			} else {
				setLoading(false);
			}
		});

		// Listener für teamlist-refresh Event hinzufügen
		const handleTeamListRefresh = (event: any) => {
			if (event.detail && event.detail.teams) {
				setTeams(event.detail.teams);
				setLoading(false);
			}
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('teamlist-refresh', handleTeamListRefresh);
		}

		return () => {
			subscription.unsubscribe();
			if (typeof window !== 'undefined') {
				window.removeEventListener('teamlist-refresh', handleTeamListRefresh);
			}
		};
	}, []);

	async function fetchUserTeams(userId: string) {
		try {
			setLoading(true);

			// Hole alle Teams, in denen der Benutzer Mitglied ist
			const { data: teamMembers, error: teamMembersError } = await supabase
				.from('team_members')
				.select('team_id, allocated_credits, used_credits')
				.eq('user_id', userId);

			if (teamMembersError) throw teamMembersError;

			if (teamMembers && teamMembers.length > 0) {
				// Extrahiere die Team-IDs
				const teamIds = teamMembers.map((member) => member.team_id);

				// Hole die Team-Details
				const { data: teamsData, error: teamsError } = await supabase
					.from('teams')
					.select('id, name, organization_id, created_at')
					.in('id', teamIds);

				if (teamsError) throw teamsError;

				if (teamsData && teamsData.length > 0) {
					// Hole die Organisationsnamen für jedes Team
					const orgIds = [...new Set(teamsData.map((team) => team.organization_id))];

					const { data: orgsData, error: orgsError } = await supabase
						.from('organizations')
						.select('id, name')
						.in('id', orgIds);

					if (orgsError) throw orgsError;

					// Füge Organisationsnamen und Kredit-Informationen zu den Teams hinzu
					const enhancedTeams = teamsData.map((team) => {
						const org = orgsData?.find((org) => org.id === team.organization_id);
						const memberInfo = teamMembers.find((member) => member.team_id === team.id);

						return {
							...team,
							organization_name: org?.name || 'Unbekannte Organisation',
							allocated_credits: memberInfo?.allocated_credits || 0,
							used_credits: memberInfo?.used_credits || 0,
						};
					});

					setTeams(enhancedTeams);
				} else {
					setTeams([]);
				}
			} else {
				setTeams([]);
			}
		} catch (error) {
			console.error('Fehler beim Abrufen der Teams:', error);
			Alert.alert('Fehler', 'Es ist ein Fehler beim Laden Ihrer Teams aufgetreten.');
		} finally {
			setLoading(false);
		}
	}

	// Keine Aufklappfunktion mehr benötigt

	const navigateToTeamDetails = (teamId: string, teamName: string) => {
		// Verwende die korrekte Expo Router Navigation
		router.push({
			pathname: '/teams/[id]',
			params: { id: teamId, name: teamName },
		});
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('de-DE', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	if (!session) {
		return (
			<Text
				className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mx-2.5 p-5 text-center`}
			>
				Bitte melden Sie sich an, um Ihre Teams zu sehen.
			</Text>
		);
	}

	if (loading) {
		return (
			<View className="mx-2.5 flex-1 items-center justify-center p-4">
				<ActivityIndicator size="large" color="#0055FF" />
				<Text
					className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2.5 text-center`}
				>
					Lade Teams...
				</Text>
			</View>
		);
	}

	if (teams.length === 0) {
		return (
			<View className="mx-2.5 flex-1 items-center justify-center p-4">
				<FontAwesome5
					name="users-slash"
					size={50}
					color={isDarkMode ? '#4B5563' : '#ccc'}
					className="mb-4"
				/>
				<Text
					className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-2.5 text-center`}
				>
					Sie sind derzeit kein Mitglied in einem Team.
				</Text>
				<Text
					className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} px-5 text-center`}
				>
					Erstellen Sie ein neues Team oder bitten Sie einen Administrator, Sie einem Team
					hinzuzufügen.
				</Text>
			</View>
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
			<FlatList
				data={teams}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<TouchableOpacity
						className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} mb-2.5 rounded-lg p-4 shadow-sm`}
						style={Platform.OS === 'web' ? { cursor: 'pointer' } : undefined}
						onPress={() => navigateToTeamDetails(item.id, item.name)}
						activeOpacity={0.7}
					>
						{/* Header mit Teamname */}
						<View className="mb-3 flex-row items-center justify-between">
							<View className="flex-row items-center">
								<FontAwesome5
									name="users"
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
							<FontAwesome5
								name="chevron-right"
								size={14}
								color={isDarkMode ? '#93C5FD' : '#0055FF'}
							/>
						</View>

						{/* Mittlerer Bereich mit Organisation und Erstellungsdatum */}
						<View className="mb-3 flex-row items-center justify-between">
							<View className="flex-row items-center">
								<FontAwesome5
									name="building"
									size={14}
									color={isDarkMode ? '#9CA3AF' : '#666'}
									className="mr-2"
								/>
								<Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
									{item.organization_name}
								</Text>
							</View>
							<View className="flex-row items-center">
								<FontAwesome5
									name="calendar-alt"
									size={14}
									color={isDarkMode ? '#9CA3AF' : '#666'}
									className="mr-2"
								/>
								<Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
									{formatDate(item.created_at)}
								</Text>
							</View>
						</View>

						{/* Unterer Bereich mit Kreditinformationen */}
						<View
							className={`mt-1 flex-row justify-between border-t pt-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
						>
							<View className="flex-1 items-center">
								<Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
									Zugewiesen
								</Text>
								<Text
									className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
								>
									{item.allocated_credits}
								</Text>
							</View>

							<View
								className={`flex-1 items-center border-x ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
							>
								<Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
									Verwendet
								</Text>
								<Text
									className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
								>
									{item.used_credits}
								</Text>
							</View>

							<View className="flex-1 items-center">
								<Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
									Verfügbar
								</Text>
								<Text
									className={`text-base font-semibold ${(item.allocated_credits || 0) - (item.used_credits || 0) > 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : isDarkMode ? 'text-red-400' : 'text-red-600'}`}
								>
									{(item.allocated_credits || 0) - (item.used_credits || 0)}
								</Text>
							</View>
						</View>
					</TouchableOpacity>
				)}
				className="px-2.5 pb-5"
			/>
		</>
	);
}

// NativeWind wird für das Styling verwendet, daher sind keine StyleSheet-Definitionen erforderlich
