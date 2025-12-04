import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	ScrollView,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { type Session } from '@supabase/supabase-js';
import { useTheme } from '../utils/themeContext';

interface UserRole {
	role_id: string;
	roles?: {
		name: string;
	};
}

interface CreateOrganizationProps {
	onOrgCreated?: (orgId: string, orgName: string) => void;
}

export default function CreateOrganization({ onOrgCreated }: CreateOrganizationProps) {
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(false);
	const [organizationName, setOrganizationName] = useState('');
	const [initialCredits, setInitialCredits] = useState('');
	const [userHasPermission, setUserHasPermission] = useState(false);
	const [checkingPermission, setCheckingPermission] = useState(true);
	const { isDarkMode } = useTheme();

	useEffect(() => {
		// Prüfe den aktuellen Authentifizierungsstatus
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			if (session) {
				checkUserPermission(session.user.id);
			} else {
				setCheckingPermission(false);
			}
		});

		// Abonniere Authentifizierungsänderungen
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			if (session) {
				checkUserPermission(session.user.id);
			} else {
				setCheckingPermission(false);
			}
		});

		return () => subscription.unsubscribe();
	}, []);

	async function checkUserPermission(userId: string) {
		try {
			setCheckingPermission(true);

			// Prüfe, ob der Benutzer ein System-Administrator ist
			const { data: userRoles, error: userRolesError } = (await supabase
				.from('user_roles')
				.select('role_id, roles(name)')
				.eq('user_id', userId)) as { data: UserRole[] | null; error: any };

			if (userRolesError) throw userRolesError;

			if (userRoles && userRoles.length > 0) {
				// Prüfe, ob der Benutzer die Rolle "system_admin" hat
				const isSystemAdmin = userRoles.some((role) => {
					const roleName = role.roles?.name;
					return roleName === 'system_admin';
				});

				setUserHasPermission(isSystemAdmin);
			} else {
				setUserHasPermission(false);
			}
		} catch (error) {
			console.error('Fehler beim Prüfen der Benutzerberechtigungen:', error);
			setUserHasPermission(false);
		} finally {
			setCheckingPermission(false);
		}
	}

	async function createOrganization() {
		if (!session) {
			Alert.alert('Fehler', 'Sie müssen angemeldet sein, um eine Organisation zu erstellen.');
			return;
		}

		if (!userHasPermission) {
			Alert.alert('Fehler', 'Sie haben keine Berechtigung, Organisationen zu erstellen.');
			return;
		}

		if (!organizationName.trim()) {
			Alert.alert('Fehler', 'Bitte geben Sie einen Organisationsnamen ein.');
			return;
		}

		const credits = parseInt(initialCredits);
		if (isNaN(credits) || credits < 0) {
			Alert.alert('Fehler', 'Bitte geben Sie eine gültige Anzahl an Krediten ein.');
			return;
		}

		try {
			setLoading(true);

			// 1. Erstelle die Organisation
			const { data: organization, error: orgError } = await supabase
				.from('organizations')
				.insert([
					{
						name: organizationName.trim(),
						total_credits: credits,
						used_credits: 0,
					},
				])
				.select()
				.single();

			if (orgError) throw orgError;

			// 2. Hole die org_admin Rolle
			const { data: adminRole, error: roleError } = await supabase
				.from('roles')
				.select('id')
				.eq('name', 'org_admin')
				.single();

			if (roleError) throw roleError;

			// 3. Füge den aktuellen Benutzer als Organisations-Administrator hinzu
			const { error: userRoleError } = await supabase.from('user_roles').insert([
				{
					user_id: session.user.id,
					role_id: adminRole.id,
					organization_id: organization.id,
				},
			]);

			if (userRoleError) throw userRoleError;

			// Erfolgsbenachrichtigung anzeigen und direkt navigieren
			Alert.alert('Erfolg', `Die Organisation "${organizationName}" wurde erfolgreich erstellt.`);

			// Direkt zur Organisationsdetailseite navigieren, ohne auf OK zu warten
			if (onOrgCreated) {
				console.log('Navigiere zur neuen Organisationsseite:', organization.id, organization.name);
				onOrgCreated(organization.id, organization.name);
			}

			// Formular zurücksetzen
			setOrganizationName('');
			setInitialCredits('');
		} catch (error) {
			console.error('Fehler beim Erstellen der Organisation:', error);
			Alert.alert('Fehler', 'Es ist ein Fehler beim Erstellen der Organisation aufgetreten.');
		} finally {
			setLoading(false);
		}
	}

	if (!session) {
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

	if (checkingPermission) {
		return (
			<View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-5 shadow`}>
				<ActivityIndicator size="large" color={isDarkMode ? '#93C5FD' : '#0055FF'} />
				<Text
					className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2.5 text-center`}
				>
					Prüfe Berechtigungen...
				</Text>
			</View>
		);
	}

	if (!userHasPermission) {
		return (
			<View className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-5 shadow`}>
				<Text
					className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} p-5 text-center`}
				>
					Sie haben keine Berechtigung, Organisationen zu erstellen. Bitte kontaktieren Sie einen
					Administrator.
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

				<View className="mb-4">
					<Text
						className={`mb-2 text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
					>
						Anfängliche Kredite
					</Text>
					<TextInput
						className={`h-12 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50 text-gray-800'} rounded-lg px-4 text-base`}
						value={initialCredits}
						onChangeText={setInitialCredits}
						placeholder="Anzahl der Kredite eingeben"
						placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
						keyboardType="number-pad"
					/>
					<Text className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
						Dies ist die Gesamtanzahl der Kredite, die dieser Organisation zur Verfügung stehen
						werden.
					</Text>
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

// NativeWind wird für das Styling verwendet, daher sind keine StyleSheet-Definitionen erforderlich
