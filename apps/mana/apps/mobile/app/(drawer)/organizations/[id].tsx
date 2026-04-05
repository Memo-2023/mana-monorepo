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
	FlatList,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { Container } from '~/components/Container';
import { useTheme } from '../../../utils/themeContext';
import { useAuth } from '../../../context/AuthProvider';
import { api } from '../../../services/api';

interface OrgMember {
	id: string;
	userId: string;
	email?: string;
	name?: string;
	role: string;
	createdAt: string;
}

export default function OrganizationDetails() {
	const router = useRouter();
	const { id: orgId, name: initialOrgName } = useLocalSearchParams<{ id: string; name: string }>();
	const { isDarkMode } = useTheme();
	const { user } = useAuth();
	const [orgName, setOrgName] = useState(initialOrgName || '');
	const [orgDetails, setOrgDetails] = useState<any>(null);
	const [members, setMembers] = useState<OrgMember[]>([]);
	const [loadingDetails, setLoadingDetails] = useState(true);
	const [deletingOrg, setDeletingOrg] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	useEffect(() => {
		if (initialOrgName) {
			setOrgName(initialOrgName);
		}
		fetchOrganizationDetails();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialOrgName, orgId]);

	const fetchOrganizationDetails = async () => {
		if (!orgId) return;

		try {
			setLoadingDetails(true);

			const { data: org, error: orgError } = await api.getOrganization(orgId);
			if (orgError) throw new Error(orgError);

			if (org) {
				setOrgDetails(org);
				setOrgName(org.name);
			}

			// Fetch members
			const { data: membersData } = await api.getOrgMembers(orgId);
			if (membersData) {
				setMembers(membersData);
			}
		} catch (error: any) {
			console.error('Fehler beim Laden der Organisationsdetails:', error);
			Alert.alert('Fehler', 'Es ist ein Fehler beim Laden der Organisationsdetails aufgetreten.');
		} finally {
			setLoadingDetails(false);
		}
	};

	const navigateBack = () => {
		router.replace('/organizations');
	};

	const deleteOrg = () => {
		setShowDeleteModal(true);
	};

	const confirmDelete = () => {
		setShowDeleteModal(false);
		handleOrgDeletion();
	};

	const cancelDelete = () => {
		setShowDeleteModal(false);
	};

	const handleOrgDeletion = async () => {
		if (!orgId) return;

		try {
			setDeletingOrg(true);

			const { error } = await api.deleteOrganization(orgId);

			if (error) throw new Error(error);

			Alert.alert('Erfolg', 'Die Organisation wurde erfolgreich gelöscht.', [
				{
					text: 'OK',
					onPress: () => router.replace('/organizations'),
				},
			]);

			setTimeout(() => {
				router.replace('/organizations');
			}, 1000);
		} catch (error: any) {
			Alert.alert(
				'Fehler',
				`Es ist ein Fehler beim Löschen der Organisation aufgetreten: ${error?.message || 'Unbekannter Fehler'}`
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
			case 'owner':
				return 'Eigentümer';
			case 'admin':
				return 'Administrator';
			case 'member':
				return 'Mitglied';
			default:
				return role;
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
								<View className="mb-4 flex-row items-center">
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
												{formatDate(orgDetails.createdAt)}
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
												{members.length}
											</Text>
										</View>

										{orgDetails.slug && (
											<View
												className={`flex-row justify-between border-t py-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
											>
												<Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
													Slug
												</Text>
												<Text
													className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
												>
													{orgDetails.slug}
												</Text>
											</View>
										)}
									</>
								)}
							</View>

							{/* Mitglieder-Liste */}
							<View
								className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} m-2.5 rounded-lg p-5 shadow`}
							>
								<Text
									className={`mb-4 text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
								>
									Mitglieder
								</Text>

								{members.length === 0 ? (
									<Text className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Keine Mitglieder gefunden.
									</Text>
								) : (
									members.map((member) => (
										<View
											key={member.id}
											className={`mb-2 flex-row items-center justify-between rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
										>
											<View>
												<Text
													className={`text-base font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
												>
													{member.name ||
														member.email ||
														`Benutzer ${member.userId.substring(0, 8)}...`}
												</Text>
												{member.email && member.name && (
													<Text
														className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
													>
														{member.email}
													</Text>
												)}
											</View>
											<View
												className={`rounded-full px-2 py-0.5 ${member.role === 'owner' ? 'bg-red-600' : member.role === 'admin' ? 'bg-orange-500' : 'bg-gray-600'}`}
											>
												<Text className="text-xs font-medium text-white">
													{getRoleName(member.role)}
												</Text>
											</View>
										</View>
									))
								)}
							</View>
						</>
					)}
				</ScrollView>
			</Container>
		</>
	);
}
