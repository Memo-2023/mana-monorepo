import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';
import { useTheme } from '../utils/themeContext';
import { useRouter } from 'expo-router';

interface Organization {
	id: string;
	name: string;
	total_credits: number;
	used_credits: number;
	created_at: string;
	team_count?: number;
	user_role?: string;
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
		const [session, setSession] = useState<Session | null>(null);
		const [loading, setLoading] = useState(true);
		const [organizations, setOrganizations] = useState<Organization[]>([]);
		const { isDarkMode } = useTheme();
		const router = useRouter();

		// Stelle die refreshOrganizations-Methode über die Ref zur Verfügung
		useImperativeHandle(ref, () => ({
			refreshOrganizations: () => {
				if (session) {
					console.log('Aktualisiere Organisationsliste');
					fetchUserOrganizations(session.user.id);
				}
			},
		}));

		useEffect(() => {
			// Prüfe den aktuellen Authentifizierungsstatus
			supabase.auth.getSession().then(({ data: { session } }) => {
				setSession(session);
				if (session) {
					fetchUserOrganizations(session.user.id);
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
					fetchUserOrganizations(session.user.id);
				} else {
					setLoading(false);
				}
			});

			return () => subscription.unsubscribe();
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		async function fetchUserOrganizations(userId: string) {
			try {
				setLoading(true);

				// Hole alle Organisationen, in denen der Benutzer eine Rolle hat
				const { data: userRoles, error: userRolesError } = (await supabase
					.from('user_roles')
					.select('organization_id, role_id, roles(name)')
					.eq('user_id', userId)
					.not('organization_id', 'is', null)) as {
					data: Array<{
						organization_id: string;
						role_id: string;
						roles: { name: string };
					}> | null;
					error: any;
				};

				if (userRolesError) throw userRolesError;

				if (userRoles && userRoles.length > 0) {
					// Extrahiere die Organisations-IDs
					const orgIds = [...new Set(userRoles.map((role) => role.organization_id))];

					// Hole die Organisations-Details
					const { data: orgsData, error: orgsError } = await supabase
						.from('organizations')
						.select('id, name, total_credits, used_credits, created_at')
						.in('id', orgIds);

					if (orgsError) throw orgsError;

					if (orgsData && orgsData.length > 0) {
						// Hole die Anzahl der Teams für jede Organisation
						const orgsWithTeamCount = await Promise.all(
							orgsData.map(async (org) => {
								// Finde die Rolle des Benutzers in dieser Organisation
								const userRolesInOrg = userRoles.filter((role) => role.organization_id === org.id);
								const highestRole = findHighestRole(userRolesInOrg);

								// Hole die Anzahl der Teams in dieser Organisation
								const { count, error: teamCountError } = await supabase
									.from('teams')
									.select('id', { count: 'exact', head: true })
									.eq('organization_id', org.id);

								if (teamCountError) {
									console.error('Fehler beim Abrufen der Team-Anzahl:', teamCountError);
									return {
										...org,
										team_count: 0,
										user_role: highestRole,
									};
								}

								return {
									...org,
									team_count: count || 0,
									user_role: highestRole,
								};
							})
						);

						setOrganizations(orgsWithTeamCount);
					} else {
						setOrganizations([]);
					}
				} else {
					setOrganizations([]);
				}
			} catch (error) {
				console.error('Fehler beim Abrufen der Organisationen:', error);
				Alert.alert('Fehler', 'Es ist ein Fehler beim Laden Ihrer Organisationen aufgetreten.');
			} finally {
				setLoading(false);
			}
		}

		// Hilfsfunktion, um die höchste Rolle eines Benutzers zu finden
		function findHighestRole(
			userRoles: Array<{ role_id: string; roles: { name: string } }>
		): string {
			const roleHierarchy = {
				system_admin: 4,
				org_admin: 3,
				team_admin: 2,
				member: 1,
			};

			let highestRoleName = 'member';
			let highestRoleValue = 0;

			userRoles.forEach((role) => {
				const roleName = role.roles?.name;
				if (roleName && roleHierarchy[roleName as keyof typeof roleHierarchy] > highestRoleValue) {
					highestRoleName = roleName;
					highestRoleValue = roleHierarchy[roleName as keyof typeof roleHierarchy];
				}
			});

			return highestRoleName;
		}

		// Keine Aufklappfunktion mehr benötigt

		const formatDate = (dateString: string) => {
			const date = new Date(dateString);
			return date.toLocaleDateString('de-DE', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
		};

		// Diese Funktion wird nicht mehr benötigt, da wir direkt mit NativeWind-Klassen arbeiten

		const getRoleName = (role: string) => {
			switch (role) {
				case 'system_admin':
					return 'System-Admin';
				case 'org_admin':
					return 'Organisations-Admin';
				case 'team_admin':
					return 'Team-Admin';
				default:
					return 'Mitglied';
			}
		};

		if (!session) {
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
								console.log('Organisation angeklickt:', item.id, item.name);
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
								<View
									className={`rounded-full px-2 py-0.5 ${item.user_role === 'system_admin' ? 'bg-red-600' : item.user_role === 'org_admin' ? 'bg-orange-500' : item.user_role === 'team_admin' ? 'bg-green-600' : 'bg-gray-600'}`}
								>
									<Text className="text-xs font-medium text-white">
										{getRoleName(item.user_role || 'member')}
									</Text>
								</View>
							</View>

							{/* Mittlerer Bereich mit Teams und Erstellungsdatum */}
							<View className="mb-3 flex-row items-center justify-between">
								<View className="flex-row items-center">
									<FontAwesome5
										name="users"
										size={14}
										color={isDarkMode ? '#9CA3AF' : '#666'}
										className="mr-2"
									/>
									<Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
										{item.team_count} {item.team_count === 1 ? 'Team' : 'Teams'}
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
									<Text
										className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}
									>
										Gesamte Kredite
									</Text>
									<Text
										className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
									>
										{item.total_credits}
									</Text>
								</View>

								<View
									className={`flex-1 items-center border-x ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
								>
									<Text
										className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}
									>
										Verwendete Kredite
									</Text>
									<Text
										className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
									>
										{item.used_credits}
									</Text>
								</View>

								<View className="flex-1 items-center">
									<Text
										className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}
									>
										Verfügbar
									</Text>
									<Text
										className={`text-base font-semibold ${item.total_credits - item.used_credits > 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : isDarkMode ? 'text-red-400' : 'text-red-600'}`}
									>
										{item.total_credits - item.used_credits}
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					)}
					className="pb-5"
				/>
			</View>
		);
	}
);

// NativeWind wird für das Styling verwendet, daher sind keine StyleSheet-Definitionen erforderlich

// Exportiere die Komponente mit forwardRef
export default OrganizationList;
