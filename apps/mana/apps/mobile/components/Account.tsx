import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthProvider';
import { api } from '../services/api';

export default function Account() {
	const { user, signOut } = useAuth();
	const [loading, setLoading] = useState(true);
	const [name, setName] = useState('');
	const [creditBalance, setCreditBalance] = useState<number | null>(null);

	useEffect(() => {
		if (user) loadProfile();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	async function loadProfile() {
		try {
			setLoading(true);
			const { data, error } = await api.getProfile();

			if (error) {
				throw new Error(error);
			}

			if (data) {
				setName(data.name || '');
			}

			// Also load credit balance
			const { data: creditData } = await api.getCreditBalance();
			if (creditData) {
				setCreditBalance(creditData.balance);
			}
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert('Fehler beim Laden des Profils', error.message);
			}
		} finally {
			setLoading(false);
		}
	}

	async function updateProfile() {
		try {
			setLoading(true);

			const { error } = await api.updateProfile({ name });

			if (error) {
				throw new Error(error);
			}

			Alert.alert('Erfolg', 'Profil erfolgreich aktualisiert!');
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert('Fehler beim Aktualisieren des Profils', error.message);
			}
		} finally {
			setLoading(false);
		}
	}

	async function handleSignOut() {
		try {
			setLoading(true);
			await signOut();
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert('Fehler beim Abmelden', error.message);
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<View style={styles.container}>
			<View style={styles.profileContainer}>
				<Text style={styles.header}>Mein Profil</Text>

				<View style={styles.formGroup}>
					<Text style={styles.label}>E-Mail</Text>
					<Text style={styles.value}>{user?.email}</Text>
				</View>

				<View style={styles.formGroup}>
					<Text style={styles.label}>Name</Text>
					<TextInput
						style={styles.input}
						value={name}
						onChangeText={setName}
						placeholder="Name eingeben"
					/>
				</View>

				{creditBalance !== null && (
					<View style={styles.quotaContainer}>
						<Text style={styles.label}>Verfügbare Kredite</Text>
						<Text style={styles.quota}>{creditBalance}</Text>
					</View>
				)}

				<TouchableOpacity style={styles.button} onPress={updateProfile} disabled={loading}>
					<Text style={styles.buttonText}>
						{loading ? 'Wird aktualisiert...' : 'Profil aktualisieren'}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.button, styles.signOutButton]}
					onPress={handleSignOut}
					disabled={loading}
				>
					<Text style={styles.buttonText}>Abmelden</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	profileContainer: {
		backgroundColor: 'white',
		padding: 20,
		borderRadius: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	header: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	formGroup: {
		marginBottom: 15,
	},
	label: {
		fontSize: 16,
		marginBottom: 5,
		fontWeight: '500',
	},
	value: {
		fontSize: 16,
		color: '#666',
		paddingVertical: 10,
	},
	input: {
		height: 50,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 5,
		paddingHorizontal: 10,
		backgroundColor: '#f9f9f9',
	},
	quotaContainer: {
		marginVertical: 15,
		padding: 15,
		backgroundColor: '#f0f8ff',
		borderRadius: 5,
	},
	quota: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#0055FF',
	},
	button: {
		backgroundColor: '#0055FF',
		height: 50,
		borderRadius: 5,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 15,
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
	signOutButton: {
		backgroundColor: '#ff3b30',
		marginTop: 10,
	},
});
