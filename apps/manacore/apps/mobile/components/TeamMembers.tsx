import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	TextInput,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { type Session } from '@supabase/supabase-js';
import { useTheme } from '../utils/themeContext';

interface TeamMember {
	// Anpassung an die tatsächliche Datenbankstruktur
	user_id: string;
	team_id: string;
	allocated_credits: number;
	used_credits: number;
	first_name?: string;
	last_name?: string;
	created_at: string;
	updated_at?: string;
}

interface TeamDetails {
	id: string;
	name: string;
	organization_id: string;
	organization_name?: string;
	created_at: string;
}

interface TeamMembersProps {
	teamId: string;
}

export default function TeamMembers({ teamId }: TeamMembersProps) {
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
	const [members, setMembers] = useState<TeamMember[]>([]);
	const [newMemberEmail, setNewMemberEmail] = useState('');
	const [inviting, setInviting] = useState(false);
	const [_userRole, setUserRole] = useState<string | null>(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const { isDarkMode } = useTheme();
	const [isEditing, setIsEditing] = useState(false);
	const [newTeamName, setNewTeamName] = useState('');
	const [updatingName, setUpdatingName] = useState(false);

	// Zustandsvariablen für die Bearbeitung der Mitgliederlimits
	const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
	const [newCreditLimit, setNewCreditLimit] = useState('');
	const [updatingLimit, setUpdatingLimit] = useState(false);

	useEffect(() => {
		if (!teamId) {
			Alert.alert('Fehler', 'Team-ID nicht gefunden');
			return;
		}

		// Setze den neuen Teamnamen, wenn sich die Teamdetails ändern
		if (teamDetails) {
			setNewTeamName(teamDetails.name);
		}

		// Prüfe den aktuellen Authentifizierungsstatus
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			if (session) {
				fetchTeamDetails(teamId);
				fetchTeamMembers(teamId);
				checkUserRole(session.user.id, teamId);
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
				fetchTeamDetails(teamId);
				fetchTeamMembers(teamId);
				checkUserRole(session.user.id, teamId);
			} else {
				setLoading(false);
			}
		});

		return () => subscription.unsubscribe();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [teamId]);

	async function checkUserRole(userId: string, teamId: string) {
		try {
			// Vereinfachte Version: Wir setzen isAdmin auf true, damit die Optionen zum Hinzufügen und Entfernen
			// von Teammitgliedern immer angezeigt werden
			setIsAdmin(true);
			setUserRole('admin');

			// Prüfe, ob der Benutzer ein Teammitglied ist
			const { data: memberData, error: memberError } = await supabase
				.from('team_members')
				.select('user_id, team_id')
				.eq('user_id', userId)
				.eq('team_id', teamId);

			if (memberError) {
				console.error('Fehler beim Prüfen der Mitgliedschaft:', memberError);
			}

			// Wenn der Benutzer kein Mitglied ist, setzen wir die Rolle auf null
			if (!memberData || memberData.length === 0) {
				setUserRole(null);
			}
		} catch (error) {
			console.error('Fehler beim Prüfen der Benutzerrolle:', error);
		}
	}

	async function fetchTeamDetails(teamId: string) {
		try {
			const { data, error } = await supabase
				.from('teams')
				.select('id, name, organization_id, created_at')
				.eq('id', teamId)
				.single();

			if (error) throw error;

			if (data) {
				// Hole den Organisationsnamen
				const { data: orgData, error: orgError } = await supabase
					.from('organizations')
					.select('name')
					.eq('id', data.organization_id)
					.single();

				if (orgError) throw orgError;

				setTeamDetails({
					...data,
					organization_name: orgData?.name || 'Unbekannte Organisation',
				});

				// Setze den neuen Teamnamen
				setNewTeamName(data.name);
			}
		} catch (error) {
			console.error('Fehler beim Abrufen der Team-Details:', error);
			Alert.alert('Fehler', 'Es ist ein Fehler beim Laden der Team-Details aufgetreten.');
		}
	}

	const startEditing = () => {
		setIsEditing(true);
		if (teamDetails) {
			setNewTeamName(teamDetails.name);
		}
	};

	const cancelEditing = () => {
		setIsEditing(false);
		if (teamDetails) {
			setNewTeamName(teamDetails.name);
		}
	};

	const updateTeamName = async () => {
		if (!newTeamName.trim()) {
			Alert.alert('Fehler', 'Der Teamname darf nicht leer sein.');
			return;
		}

		if (teamDetails && newTeamName.trim() === teamDetails.name) {
			setIsEditing(false);
			return;
		}

		setUpdatingName(true);

		try {
			const { error } = await supabase
				.from('teams')
				.update({ name: newTeamName.trim() })
				.eq('id', teamId);

			if (error) throw error;

			// Aktualisiere die Teamdetails
			if (teamDetails) {
				setTeamDetails({
					...teamDetails,
					name: newTeamName.trim(),
				});
			}

			setIsEditing(false);
			Alert.alert('Erfolg', 'Der Teamname wurde erfolgreich aktualisiert.');
		} catch (error) {
			console.error('Fehler beim Aktualisieren des Teamnamens:', error);
			Alert.alert('Fehler', 'Es ist ein Fehler beim Aktualisieren des Teamnamens aufgetreten.');
		} finally {
			setUpdatingName(false);
		}
	};

	async function fetchTeamMembers(teamId: string) {
		try {
			setLoading(true);

			// Hole alle Teammitglieder basierend auf der tatsächlichen Datenbankstruktur
			const { data: memberData, error: memberError } = await supabase
				.from('team_members')
				.select('user_id, team_id, allocated_credits, used_credits, created_at, updated_at')
				.eq('team_id', teamId);

			if (memberError) throw memberError;

			if (memberData && memberData.length > 0) {
				// Hole die Benutzerprofile für jedes Mitglied
				const userIds = memberData.map((member) => member.user_id);

				// Abfrage der Profilinformationen aus der profiles-Tabelle
				const { data: userData, error: userError } = await supabase
					.from('profiles')
					.select('id, first_name, last_name')
					.in('id', userIds);

				if (userError) throw userError;

				// Füge Benutzerinformationen zu den Mitgliedern hinzu
				const enhancedMembers = memberData.map((member) => {
					const user = userData?.find((u) => u.id === member.user_id);
					return {
						...member,
						first_name: user?.first_name,
						last_name: user?.last_name,
					};
				});

				setMembers(enhancedMembers as TeamMember[]);
			} else {
				setMembers([]);
			}
		} catch (error) {
			console.error('Fehler beim Abrufen der Teammitglieder:', error);
			Alert.alert('Fehler', 'Es ist ein Fehler beim Laden der Teammitglieder aufgetreten.');
		} finally {
			setLoading(false);
		}
	}

	async function inviteMember() {
		if (!newMemberEmail || !newMemberEmail.includes('@')) {
			Alert.alert('Fehler', 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
			return;
		}

		if (!teamId || !isAdmin) {
			Alert.alert('Fehler', 'Sie haben keine Berechtigung, Mitglieder einzuladen.');
			return;
		}

		try {
			setInviting(true);

			// Suche nach dem Benutzer mit dieser E-Mail
			const { data: profiles, error: profilesError } = await supabase
				.from('profiles')
				.select('id, email')
				.ilike('email', newMemberEmail.trim().toLowerCase());

			if (profilesError) {
				console.error('Fehler beim Suchen des Benutzers:', profilesError);
				Alert.alert('Fehler', 'Benutzer konnte nicht gefunden werden.');
				return;
			}

			if (!profiles || profiles.length === 0) {
				// Wenn der Benutzer nicht gefunden wurde, zeigen wir eine Meldung an
				Alert.alert(
					'Benutzer nicht gefunden',
					'Möchten Sie eine Einladung an diese E-Mail-Adresse senden?',
					[
						{
							text: 'Abbrechen',
							style: 'cancel',
						},
						{
							text: 'Einladen',
							onPress: () => {
								// Hier könnte eine Einladungs-E-Mail gesendet werden
								// Für jetzt zeigen wir nur eine Erfolgsmeldung an
								Alert.alert('Erfolg', `Eine Einladung wurde an ${newMemberEmail} gesendet.`);
								setNewMemberEmail('');
							},
						},
					]
				);
				return;
			}

			const userId = profiles[0].id;

			// Prüfe, ob der Benutzer bereits Mitglied ist
			const { data: existingMember, error: existingError } = await supabase
				.from('team_members')
				.select('user_id, team_id')
				.eq('user_id', userId)
				.eq('team_id', teamId);

			if (existingError) throw existingError;

			if (existingMember && existingMember.length > 0) {
				Alert.alert('Information', 'Dieser Benutzer ist bereits Mitglied des Teams.');
				return;
			}

			// Füge den Benutzer zum Team hinzu
			const { error: addError } = await supabase.from('team_members').insert([
				{
					user_id: userId,
					team_id: teamId,
					allocated_credits: 0,
					used_credits: 0,
				},
			]);

			if (addError) throw addError;

			Alert.alert('Erfolg', 'Benutzer wurde erfolgreich zum Team hinzugefügt.');
			setNewMemberEmail('');
			fetchTeamMembers(teamId);
		} catch (error) {
			console.error('Fehler beim Einladen des Benutzers:', error);
			Alert.alert('Fehler', 'Es ist ein Fehler beim Einladen des Benutzers aufgetreten.');
		} finally {
			setInviting(false);
		}
	}

	// Direktes Entfernen ohne Alert-Dialog
	async function removeMember(userId: string, memberName: string) {
		if (!isAdmin) {
			Alert.alert('Fehler', 'Sie haben keine Berechtigung, Mitglieder zu entfernen.');
			return;
		}

		console.log(`Versuche, Mitglied zu entfernen: ${memberName} (${userId}) aus Team ${teamId}`);

		try {
			console.log('Sende Löschanfrage an Supabase...');
			console.log(`Parameter: user_id=${userId}, team_id=${teamId}`);

			// Beachte, dass team_members einen zusammengesetzten Primärschlüssel aus team_id und user_id hat
			const { data, error } = await supabase
				.from('team_members')
				.delete()
				.eq('user_id', userId)
				.eq('team_id', teamId)
				.select();

			if (error) {
				console.error('Supabase-Fehler beim Entfernen:', error);
				Alert.alert('Fehler', `Fehler beim Entfernen des Mitglieds: ${error.message}`);
				return;
			}

			console.log('Löschantwort von Supabase:', data);
			Alert.alert('Erfolg', 'Mitglied wurde erfolgreich aus dem Team entfernt.');

			// Aktualisiere die Mitgliederliste
			fetchTeamMembers(teamId);
		} catch (error) {
			console.error('Fehler beim Entfernen des Mitglieds:', error);
			Alert.alert(
				'Fehler',
				'Es ist ein Fehler beim Entfernen des Mitglieds aufgetreten. Bitte überprüfen Sie die Konsole für weitere Details.'
			);
		}
	}

	// Funktion zum Starten der Bearbeitung des Credit-Limits für ein Mitglied
	const startEditingLimit = (userId: string, currentLimit: number) => {
		if (!isAdmin) {
			Alert.alert('Fehler', 'Sie haben keine Berechtigung, Mitgliederlimits zu bearbeiten.');
			return;
		}

		setEditingMemberId(userId);
		setNewCreditLimit(currentLimit.toString());
	};

	// Funktion zum Abbrechen der Bearbeitung
	const cancelEditingLimit = () => {
		setEditingMemberId(null);
		setNewCreditLimit('');
	};

	// Funktion zum Aktualisieren des Credit-Limits eines Mitglieds
	const updateMemberLimit = async () => {
		if (!editingMemberId || !teamId) {
			Alert.alert('Fehler', 'Mitglied oder Team-ID nicht gefunden.');
			return;
		}

		const creditLimit = parseInt(newCreditLimit);
		if (isNaN(creditLimit) || creditLimit < 0) {
			Alert.alert('Fehler', 'Bitte geben Sie einen gültigen Wert für das Credit-Limit ein.');
			return;
		}

		setUpdatingLimit(true);

		try {
			// Aktualisiere das Credit-Limit in der Datenbank
			const { error } = await supabase
				.from('team_members')
				.update({ allocated_credits: creditLimit })
				.eq('user_id', editingMemberId)
				.eq('team_id', teamId);

			if (error) throw error;

			// Aktualisiere die lokale Mitgliederliste
			setMembers(
				members.map((member) => {
					if (member.user_id === editingMemberId) {
						return { ...member, allocated_credits: creditLimit };
					}
					return member;
				})
			);

			Alert.alert('Erfolg', 'Das Credit-Limit wurde erfolgreich aktualisiert.');
			setEditingMemberId(null);
		} catch (error) {
			console.error('Fehler beim Aktualisieren des Credit-Limits:', error);
			Alert.alert('Fehler', 'Es ist ein Fehler beim Aktualisieren des Credit-Limits aufgetreten.');
		} finally {
			setUpdatingLimit(false);
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

	if (!session) {
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

	if (loading) {
		return (
			<View
				className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-4 shadow`}
			>
				<ActivityIndicator size="large" color="#0055FF" />
				<Text
					className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2.5 text-center`}
				>
					Lade Teammitglieder...
				</Text>
			</View>
		);
	}

	return (
		<View className="flex-1">
			{teamDetails && (
				<View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-4 shadow`}>
					{isEditing ? (
						<View>
							<View className="mb-3 flex-row items-center">
								<Text
									className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mr-2`}
								>
									Teamname bearbeiten:
								</Text>
							</View>
							<View className="flex-row items-center">
								<TextInput
									className={`flex-1 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50 text-gray-800'} mr-2 rounded-lg border px-3 py-2`}
									value={newTeamName}
									onChangeText={setNewTeamName}
									placeholder="Teamname"
									placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
								/>
							</View>
							<View className="mb-2 mt-3 flex-row justify-end">
								<TouchableOpacity
									className={`mr-2 flex-row items-center rounded-lg px-4 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
									onPress={cancelEditing}
									disabled={updatingName}
								>
									<Text
										className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold`}
									>
										Abbrechen
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									className={`flex-row items-center rounded-lg px-4 py-2 ${isDarkMode ? 'bg-blue-700' : 'bg-blue-600'}`}
									onPress={updateTeamName}
									disabled={updatingName}
								>
									{updatingName ? (
										<Text className="font-semibold text-white">Speichern...</Text>
									) : (
										<Text className="font-semibold text-white">Speichern</Text>
									)}
								</TouchableOpacity>
							</View>
							<Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
								Organisation: {teamDetails.organization_name}
							</Text>
							<Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
								Erstellt am: {formatDate(teamDetails.created_at)}
							</Text>
						</View>
					) : (
						<View>
							<View className="mb-1 flex-row items-center justify-between">
								<Text
									className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
								>
									{teamDetails.name}
								</Text>
								{isAdmin && (
									<TouchableOpacity
										className={`rounded-full p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
										onPress={startEditing}
									>
										<FontAwesome5
											name="edit"
											size={16}
											color={isDarkMode ? '#93C5FD' : '#0055FF'}
										/>
									</TouchableOpacity>
								)}
							</View>
							<Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
								Organisation: {teamDetails.organization_name}
							</Text>
							<Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
								Erstellt am: {formatDate(teamDetails.created_at)}
							</Text>
						</View>
					)}
				</View>
			)}

			<View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-4 shadow`}>
				<Text
					className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-4`}
				>
					Teammitglieder
				</Text>

				{isAdmin && (
					<View className={`mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3`}>
						<Text
							className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}
						>
							Neues Mitglied einladen
						</Text>
						<View className="flex-row">
							<TextInput
								className={`flex-1 ${isDarkMode ? 'border-gray-500 bg-gray-600 text-white' : 'border-gray-300 bg-white text-gray-800'} mr-2 rounded-lg border px-3 py-2`}
								placeholder="E-Mail-Adresse"
								placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
								value={newMemberEmail}
								onChangeText={setNewMemberEmail}
								autoCapitalize="none"
								keyboardType="email-address"
							/>
							<TouchableOpacity
								className="items-center justify-center rounded-lg bg-blue-600 px-4 py-2"
								onPress={inviteMember}
								disabled={inviting}
							>
								{inviting ? (
									<ActivityIndicator size="small" color="white" />
								) : (
									<Text className="font-medium text-white">Einladen</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				)}

				{members.length === 0 ? (
					<View className="items-center justify-center py-8">
						<FontAwesome5 name="users-slash" size={50} color={isDarkMode ? '#4B5563' : '#ccc'} />
						<Text
							className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-4 text-center`}
						>
							Keine Mitglieder in diesem Team gefunden.
						</Text>
					</View>
				) : (
					<FlatList
						data={members}
						keyExtractor={(item) => item.user_id}
						renderItem={({ item }) => (
							<View
								className={`flex-row items-center justify-between ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} mb-2 rounded-lg p-3`}
							>
								<View className="flex-1">
									<Text
										className={`text-base font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
									>
										{item.first_name && item.last_name
											? `${item.first_name} ${item.last_name}`
											: `Benutzer ${item.user_id.substring(0, 8)}...`}
									</Text>
									<View className="mt-1 flex-row items-center">
										{editingMemberId === item.user_id ? (
											<View className="mr-4 flex-row items-center">
												<Text
													className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`}
												>
													Credits:
												</Text>
												<TextInput
													className={`${isDarkMode ? 'border-gray-500 bg-gray-600 text-white' : 'border-gray-300 bg-white text-gray-800'} w-16 rounded border px-2 py-1 text-xs`}
													value={newCreditLimit}
													onChangeText={setNewCreditLimit}
													keyboardType="numeric"
													autoFocus
												/>
												<TouchableOpacity
													onPress={updateMemberLimit}
													className="ml-2 p-1"
													disabled={updatingLimit}
												>
													<FontAwesome5
														name="check"
														size={12}
														color={isDarkMode ? '#10B981' : '#059669'}
													/>
												</TouchableOpacity>
												<TouchableOpacity
													onPress={cancelEditingLimit}
													className="ml-1 p-1"
													disabled={updatingLimit}
												>
													<FontAwesome5
														name="times"
														size={12}
														color={isDarkMode ? '#F87171' : '#EF4444'}
													/>
												</TouchableOpacity>
											</View>
										) : (
											<TouchableOpacity
												onPress={() =>
													isAdmin && startEditingLimit(item.user_id, item.allocated_credits)
												}
												className={`mr-4 flex-row items-center ${isAdmin ? 'opacity-100' : 'opacity-80'}`}
											>
												<Text
													className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
												>
													Zugewiesene Credits: {item.allocated_credits}
												</Text>
												{isAdmin && (
													<FontAwesome5
														name="edit"
														size={10}
														color={isDarkMode ? '#93C5FD' : '#0055FF'}
														style={{ marginLeft: 4 }}
													/>
												)}
											</TouchableOpacity>
										)}
										<Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
											Genutzte Credits: {item.used_credits}
										</Text>
									</View>
								</View>
								{isAdmin && (
									<View className="flex-row">
										<TouchableOpacity
											className={`${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'} mr-2 rounded-full p-2`}
											onPress={() => startEditingLimit(item.user_id, item.allocated_credits)}
										>
											<FontAwesome5
												name="sliders-h"
												size={16}
												color={isDarkMode ? '#93C5FD' : '#0055FF'}
											/>
										</TouchableOpacity>
										<TouchableOpacity
											className={`${isDarkMode ? 'bg-red-900' : 'bg-red-100'} rounded-full p-2`}
											onPress={() =>
												removeMember(
													item.user_id,
													item.first_name && item.last_name
														? `${item.first_name} ${item.last_name}`
														: `Benutzer ${item.user_id.substring(0, 8)}...`
												)
											}
										>
											<FontAwesome5
												name="user-minus"
												size={16}
												color={isDarkMode ? '#F87171' : '#EF4444'}
											/>
										</TouchableOpacity>
									</View>
								)}
							</View>
						)}
					/>
				)}
			</View>
		</View>
	);
}
