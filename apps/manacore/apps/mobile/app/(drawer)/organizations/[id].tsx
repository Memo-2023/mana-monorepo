import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
	ScrollView,
	Text,
	View,
	TouchableOpacity,
	TextInput,
	Alert,
	ActivityIndicator,
	Modal,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import { useTheme } from '../../../utils/themeContext';
import { supabase } from '../../../utils/supabase';

interface OrganizationDetails {
	id: string;
	name: string;
	total_credits: number;
	used_credits: number;
	created_at: string;
	team_count: number;
	user_count: number;
}

export default function OrganizationDetails() {
	const router = useRouter();
	const { id: orgId, name: initialOrgName } = useLocalSearchParams<{ id: string; name: string }>();
	const { isDarkMode } = useTheme();
	const [orgName, setOrgName] = useState(initialOrgName || '');
	const [isEditing, setIsEditing] = useState(false);
	const [newOrgName, setNewOrgName] = useState('');
	const [loading, setLoading] = useState(false);
	const [deletingOrg, setDeletingOrg] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [orgDetails, setOrgDetails] = useState<OrganizationDetails | null>(null);
	const [userRole, setUserRole] = useState<string>('');
	const [loadingDetails, setLoadingDetails] = useState(true);

	useEffect(() => {
		if (initialOrgName) {
			setOrgName(initialOrgName);
			setNewOrgName(initialOrgName);
		}

		fetchOrganizationDetails();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialOrgName, orgId]);

	const fetchOrganizationDetails = async () => {
		if (!orgId) return;

		try {
			setLoadingDetails(true);

			// Hole die Organisation
			const { data: org, error: orgError } = await supabase
				.from('organizations')
				.select('id, name, total_credits, used_credits, created_at')
				.eq('id', orgId)
				.single();

			if (orgError) throw orgError;

			// Hole die Anzahl der Teams in dieser Organisation
			const { count: teamCount, error: teamCountError } = await supabase
				.from('teams')
				.select('id', { count: 'exact', head: true })
				.eq('organization_id', orgId);

			if (teamCountError) throw teamCountError;

			// Hole die Anzahl der Benutzer in dieser Organisation
			const { data: userRoles, error: userRolesError } = await supabase
				.from('user_roles')
				.select('user_id')
				.eq('organization_id', orgId);

			if (userRolesError) throw userRolesError;

			// Entferne Duplikate (ein Benutzer kann mehrere Rollen haben)
			const uniqueUserIds = [...new Set(userRoles.map((role) => role.user_id))];

			// Hole die aktuelle Benutzerrolle
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (session?.user) {
				const { data: currentUserRoles, error: currentUserRolesError } = await supabase
					.from('user_roles')
					.select('roles(name)')
					.eq('user_id', session.user.id)
					.eq('organization_id', orgId);

				if (currentUserRolesError) throw currentUserRolesError;

				// Finde die höchste Rolle
				const roleHierarchy = {
					system_admin: 4,
					org_admin: 3,
					team_admin: 2,
					member: 1,
				};

				let highestRole = 'member';
				let highestRoleValue = 0;

				// Typensichere Iteration über die Benutzerrollen
				// Wir müssen die Daten zuerst in das erwartete Format konvertieren
				currentUserRoles.forEach((userRole: any) => {
					// Prüfe, ob die Rolle existiert und ein Name vorhanden ist
					const roleName = userRole.roles?.name;
					if (
						roleName &&
						roleHierarchy[roleName as keyof typeof roleHierarchy] > highestRoleValue
					) {
						highestRole = roleName;
						highestRoleValue = roleHierarchy[roleName as keyof typeof roleHierarchy];
					}
				});

				setUserRole(highestRole);
			}

			setOrgDetails({
				...org,
				team_count: teamCount || 0,
				user_count: uniqueUserIds.length,
			});

			setOrgName(org.name);
			setNewOrgName(org.name);
		} catch (error) {
			console.error('Fehler beim Laden der Organisationsdetails:', error);
			Alert.alert('Fehler', 'Es ist ein Fehler beim Laden der Organisationsdetails aufgetreten.');
		} finally {
			setLoadingDetails(false);
		}
	};

	const navigateBack = () => {
		router.replace('/organizations');
	};

	const toggleEditMode = () => {
		if (isEditing) {
			setIsEditing(false);
		} else {
			setNewOrgName(orgName);
			setIsEditing(true);
		}
	};

	const updateOrganizationName = async () => {
		if (!orgId || !newOrgName.trim() || newOrgName.trim() === orgName) {
			setIsEditing(false);
			return;
		}

		try {
			setLoading(true);

			const { error } = await supabase
				.from('organizations')
				.update({ name: newOrgName.trim() })
				.eq('id', orgId);

			if (error) throw error;

			setOrgName(newOrgName.trim());
			setIsEditing(false);

			Alert.alert('Erfolg', 'Der Organisationsname wurde erfolgreich aktualisiert.');
		} catch (error) {
			console.error('Fehler beim Aktualisieren des Organisationsnamens:', error);
			Alert.alert(
				'Fehler',
				'Es ist ein Fehler beim Aktualisieren des Organisationsnamens aufgetreten.'
			);
		} finally {
			setLoading(false);
		}
	};

	const deleteOrg = () => {
		console.log('Delete organization button clicked, orgId:', orgId);
		// Modal öffnen statt Alert anzeigen
		setShowDeleteModal(true);
	};

	const confirmDelete = () => {
		console.log('Löschen bestätigt für Organisation:', orgId);
		setShowDeleteModal(false);
		handleOrgDeletion();
	};

	const cancelDelete = () => {
		console.log('Löschen abgebrochen');
		setShowDeleteModal(false);
	};

	const handleOrgDeletion = async () => {
		if (!orgId) return;

		try {
			setDeletingOrg(true);

			console.log('Starte Löschvorgang für Organisation:', orgId);

			// 1. Prüfe, ob es Teams in dieser Organisation gibt
			const { count: teamCount, error: teamCountError } = await supabase
				.from('teams')
				.select('id', { count: 'exact', head: true })
				.eq('organization_id', orgId);

			if (teamCountError) throw teamCountError;

			if (teamCount && teamCount > 0) {
				Alert.alert(
					'Fehler',
					'Diese Organisation enthält noch Teams. Bitte lösche zuerst alle Teams, bevor du die Organisation löschst.'
				);
				return;
			}

			// 2. Lösche alle Benutzerrollen für diese Organisation
			console.log('Lösche Benutzerrollen für Organisation:', orgId);
			const { error: userRolesError } = await supabase
				.from('user_roles')
				.delete()
				.eq('organization_id', orgId);

			if (userRolesError) throw userRolesError;

			// 3. Lösche die Organisation
			console.log('Lösche Organisation:', orgId);
			const { error: orgError } = await supabase.from('organizations').delete().eq('id', orgId);

			if (orgError) throw orgError;

			console.log('Organisation erfolgreich gelöscht');

			// Erfolgsmeldung anzeigen und zurück zur Organisationsliste navigieren
			Alert.alert('Erfolg', 'Die Organisation wurde erfolgreich gelöscht.', [
				{
					text: 'OK',
					onPress: () => {
						console.log('Navigating back to organizations list');
						// Zurück zur Organisationsliste navigieren
						router.replace('/organizations');
					},
				},
			]);

			// Auch ohne Klick auf OK zurück zur Organisationsliste navigieren (nach kurzer Verzögerung)
			setTimeout(() => {
				router.replace('/organizations');
			}, 1000);
		} catch (error: any) {
			console.error('Fehler beim Löschen der Organisation:', error);

			// Detaillierte Fehlermeldung anzeigen
			Alert.alert(
				'Fehler',
				`Es ist ein Fehler beim Löschen der Organisation aufgetreten: ${error?.message || JSON.stringify(error)}`,
				[{ text: 'OK' }]
			);
		} finally {
			setDeletingOrg(false);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('de-DE', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

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

	return (
		<>
			<Stack.Screen
				options={{
					title: orgName || 'Organisations-Details',
					headerLargeTitle: true,
				}}
			/>

			{/* Lösch-Bestätigungsmodal */}
			<Modal
				animationType="fade"
				transparent
				visible={showDeleteModal}
				onRequestClose={cancelDelete}
			>
				<View
					className="flex-1 items-center justify-center"
					style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
				>
					<View
						className={`m-5 rounded-xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
						style={{ width: '80%' }}
					>
						<View className="mb-4 items-center">
							<FontAwesome5 name="exclamation-triangle" size={40} color="#EF4444" />
						</View>

						<Text
							className={`mb-2 text-center text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
						>
							Organisation löschen
						</Text>

						<Text
							className={`mb-6 text-center text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
						>
							{`Möchtest du die Organisation "${orgName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
						</Text>

						<View className="flex-row justify-between">
							<TouchableOpacity
								className={`mr-2 flex-1 rounded-lg py-3 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
								onPress={cancelDelete}
							>
								<Text
									className={`text-center font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
								>
									Abbrechen
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								className="ml-2 flex-1 rounded-lg bg-red-600 py-3"
								onPress={confirmDelete}
								disabled={deletingOrg}
							>
								{deletingOrg ? (
									<ActivityIndicator size="small" color="white" />
								) : (
									<Text className="text-center font-medium text-white">Löschen</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

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
								Meine Organisationen
							</Text>
						</TouchableOpacity>

						{(userRole === 'org_admin' || userRole === 'system_admin') && (
							<TouchableOpacity
								className={`flex-row items-center rounded-lg px-4 py-2 ${deletingOrg ? 'bg-gray-500' : 'bg-red-600'}`}
								onPress={deleteOrg}
								disabled={deletingOrg}
								activeOpacity={0.7}
							>
								{deletingOrg ? (
									<ActivityIndicator size="small" color="white" />
								) : (
									<>
										<FontAwesome5 name="trash-alt" size={16} color="white" className="mr-2" />
										<Text className="text-sm font-semibold text-white">Organisation löschen</Text>
									</>
								)}
							</TouchableOpacity>
						)}
					</View>

					{loadingDetails ? (
						<View
							className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-5 shadow`}
						>
							<ActivityIndicator size="large" color={isDarkMode ? '#93C5FD' : '#0055FF'} />
							<Text
								className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2.5 text-center`}
							>
								Lade Organisationsdetails...
							</Text>
						</View>
					) : (
						<>
							<View
								className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-5 shadow`}
							>
								<View className="mb-4 flex-row items-center justify-between">
									{isEditing ? (
										<View className="flex-1 flex-row items-center">
											<TextInput
												className={`h-12 flex-1 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50 text-gray-800'} rounded-lg px-4 text-base`}
												value={newOrgName}
												onChangeText={setNewOrgName}
												placeholder="Organisationsname"
												placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
												autoFocus
											/>
											<TouchableOpacity
												className="ml-2 p-2"
												onPress={updateOrganizationName}
												disabled={loading}
											>
												{loading ? (
													<ActivityIndicator
														size="small"
														color={isDarkMode ? '#93C5FD' : '#0055FF'}
													/>
												) : (
													<FontAwesome5
														name="check"
														size={20}
														color={isDarkMode ? '#93C5FD' : '#0055FF'}
													/>
												)}
											</TouchableOpacity>
											<TouchableOpacity className="ml-2 p-2" onPress={toggleEditMode}>
												<FontAwesome5
													name="times"
													size={20}
													color={isDarkMode ? '#F87171' : '#EF4444'}
												/>
											</TouchableOpacity>
										</View>
									) : (
										<>
											<View className="flex-row items-center">
												<FontAwesome5
													name="building"
													size={24}
													color={isDarkMode ? '#93C5FD' : '#0055FF'}
													className="mr-3"
												/>
												<Text
													className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
												>
													{orgName}
												</Text>
											</View>

											{(userRole === 'org_admin' || userRole === 'system_admin') && (
												<TouchableOpacity className="p-2" onPress={toggleEditMode}>
													<FontAwesome5
														name="edit"
														size={18}
														color={isDarkMode ? '#93C5FD' : '#0055FF'}
													/>
												</TouchableOpacity>
											)}
										</>
									)}
								</View>

								{orgDetails && (
									<>
										<View
											className={`flex-row justify-between border-t py-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
										>
											<Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
												Erstellt am
											</Text>
											<Text
												className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
											>
												{formatDate(orgDetails.created_at)}
											</Text>
										</View>

										<View
											className={`flex-row justify-between border-t py-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
										>
											<Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
												Teams
											</Text>
											<Text
												className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
											>
												{orgDetails.team_count}
											</Text>
										</View>

										<View
											className={`flex-row justify-between border-t py-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
										>
											<Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
												Mitglieder
											</Text>
											<Text
												className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
											>
												{orgDetails.user_count}
											</Text>
										</View>

										<View
											className={`flex-row justify-between border-t py-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
										>
											<Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
												Deine Rolle
											</Text>
											<View
												className={`rounded-full px-2 py-0.5 ${userRole === 'system_admin' ? 'bg-red-600' : userRole === 'org_admin' ? 'bg-orange-500' : userRole === 'team_admin' ? 'bg-green-600' : 'bg-gray-600'}`}
											>
												<Text className="text-xs font-medium text-white">
													{getRoleName(userRole)}
												</Text>
											</View>
										</View>
									</>
								)}
							</View>

							<View
								className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-5 shadow`}
							>
								<View className="mb-4 flex-row items-center">
									<FontAwesome5
										name="coins"
										size={20}
										color={isDarkMode ? '#93C5FD' : '#0055FF'}
										className="mr-2"
									/>
									<Text
										className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
									>
										Kredit-Übersicht
									</Text>
								</View>

								{orgDetails && (
									<View className="flex-row justify-between">
										<View
											className="mr-2 flex-1 items-center rounded-lg bg-opacity-20 p-3"
											style={{
												backgroundColor: isDarkMode
													? 'rgba(147, 197, 253, 0.1)'
													: 'rgba(0, 85, 255, 0.1)',
											}}
										>
											<Text
												className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}
											>
												Gesamt
											</Text>
											<Text
												className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
											>
												{orgDetails.total_credits}
											</Text>
										</View>

										<View
											className="mx-1 flex-1 items-center rounded-lg bg-opacity-20 p-3"
											style={{
												backgroundColor: isDarkMode
													? 'rgba(147, 197, 253, 0.1)'
													: 'rgba(0, 85, 255, 0.1)',
											}}
										>
											<Text
												className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}
											>
												Verwendet
											</Text>
											<Text
												className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
											>
												{orgDetails.used_credits}
											</Text>
										</View>

										<View
											className="ml-2 flex-1 items-center rounded-lg bg-opacity-20 p-3"
											style={{
												backgroundColor: isDarkMode
													? 'rgba(147, 197, 253, 0.1)'
													: 'rgba(0, 85, 255, 0.1)',
											}}
										>
											<Text
												className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}
											>
												Verfügbar
											</Text>
											<Text
												className={`text-2xl font-bold ${orgDetails.total_credits - orgDetails.used_credits > 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : isDarkMode ? 'text-red-400' : 'text-red-600'}`}
											>
												{orgDetails.total_credits - orgDetails.used_credits}
											</Text>
										</View>
									</View>
								)}
							</View>

							{/* Hier könnte später eine Liste der Teams oder Mitglieder angezeigt werden */}
						</>
					)}
				</ScrollView>
			</Container>
		</>
	);
}
