import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthProvider';
import { api } from '../services/api';
import { useTheme } from '../utils/themeContext';

// TODO: Mana-Übertragung zwischen Benutzern ist in mana-core-auth noch nicht implementiert.
// Diese Komponente zeigt vorerst nur den aktuellen Kontostand an.

export default function SendMana() {
	const { isDarkMode } = useTheme();
	const { user } = useAuth();
	const [userCredits, setUserCredits] = useState(0);

	useEffect(() => {
		if (user) {
			fetchUserCredits();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	async function fetchUserCredits() {
		try {
			const { data } = await api.getCreditBalance();
			if (data) {
				setUserCredits(data.balance || 0);
			}
		} catch (error) {
			console.error('Fehler beim Abrufen der Kredite:', error);
			setUserCredits(0);
		}
	}

	// Dynamische Stile basierend auf dem aktuellen Theme
	const styles = StyleSheet.create({
		container: {
			backgroundColor: isDarkMode ? '#1E1E1E' : 'white',
			borderRadius: 10,
			padding: 20,
			marginBottom: 20,
			shadowColor: isDarkMode ? '#000000' : '#000000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: isDarkMode ? 0.5 : 0.1,
			shadowRadius: 4,
			elevation: 3,
		},
		header: {
			fontSize: 22,
			fontWeight: 'bold',
			marginBottom: 20,
			color: isDarkMode ? '#F9FAFB' : '#333',
		},
		creditInfo: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: isDarkMode ? '#1E3A8A' : '#f0f8ff',
			padding: 15,
			borderRadius: 8,
			marginBottom: 20,
		},
		creditLabel: {
			fontSize: 16,
			fontWeight: '500',
			color: isDarkMode ? '#E5E7EB' : '#333',
		},
		creditAmount: {
			fontSize: 18,
			fontWeight: 'bold',
			color: isDarkMode ? '#93C5FD' : '#0055FF',
			marginLeft: 10,
		},
		notLoggedIn: {
			fontSize: 16,
			color: isDarkMode ? '#9CA3AF' : '#666',
			textAlign: 'center',
			padding: 20,
		},
		comingSoon: {
			fontSize: 14,
			color: isDarkMode ? '#9CA3AF' : '#666',
			textAlign: 'center',
			fontStyle: 'italic',
		},
	});

	if (!user) {
		return (
			<View style={styles.container}>
				<Text style={styles.notLoggedIn}>Bitte melden Sie sich an, um Mana zu senden.</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.header}>Mana senden</Text>

			<View style={styles.creditInfo}>
				<Text style={styles.creditLabel}>Verfügbares Mana:</Text>
				<Text style={styles.creditAmount}>{userCredits}</Text>
			</View>

			<Text style={styles.comingSoon}>
				Die Mana-Übertragung zwischen Benutzern wird bald verfügbar sein.
			</Text>
		</View>
	);
}
