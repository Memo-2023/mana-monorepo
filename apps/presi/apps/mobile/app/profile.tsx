import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../components/ThemeProvider';
import { getUserDecks, getDeckSlides } from '../services/firestore';
import { auth } from '../firebaseConfig';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface UserStats {
	totalDecks: number;
	totalSlides: number;
}

export default function ProfileScreen() {
	const { theme } = useTheme();
	const [stats, setStats] = useState<UserStats>({ totalDecks: 0, totalSlides: 0 });
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadStats() {
			if (!auth.currentUser) return;

			try {
				setLoading(true);
				const decks = await getUserDecks(auth.currentUser.uid);
				let totalSlides = 0;

				// Get slides for each deck
				for (const deck of decks) {
					const slides = await getDeckSlides(deck.id);
					totalSlides += slides.length;
				}

				setStats({
					totalDecks: decks.length,
					totalSlides: totalSlides,
				});
			} catch (error) {
				console.error('Error loading user stats:', error);
			} finally {
				setLoading(false);
			}
		}

		loadStats();
	}, []);

	if (loading) {
		return (
			<View style={[styles.container, { backgroundColor: theme.colors.backgroundPage }]}>
				<Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
					Loading stats...
				</Text>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.backgroundPage }]}>
			<View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
				<View style={styles.avatarContainer}>
					<MaterialIcons name="account-circle" size={80} color={theme.colors.textPrimary} />
				</View>
				<Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
					{auth.currentUser?.email || 'User'}
				</Text>
			</View>

			<View style={[styles.statsContainer, { backgroundColor: theme.colors.backgroundPrimary }]}>
				<View style={styles.statItem}>
					<MaterialIcons name="folder" size={32} color={theme.colors.textPrimary} />
					<Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
						{stats.totalDecks}
					</Text>
					<Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Decks</Text>
				</View>

				<View style={[styles.divider, { backgroundColor: theme.colors.borderPrimary }]} />

				<View style={styles.statItem}>
					<MaterialIcons name="slideshow" size={32} color={theme.colors.textPrimary} />
					<Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
						{stats.totalSlides}
					</Text>
					<Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
						Total Slides
					</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	header: {
		padding: 24,
		borderRadius: 12,
		alignItems: 'center',
		marginBottom: 16,
	},
	avatarContainer: {
		marginBottom: 16,
	},
	userName: {
		fontSize: 24,
		fontWeight: '600',
	},
	statsContainer: {
		flexDirection: 'row',
		padding: 24,
		borderRadius: 12,
		justifyContent: 'space-around',
		alignItems: 'center',
	},
	statItem: {
		alignItems: 'center',
	},
	statValue: {
		fontSize: 32,
		fontWeight: '700',
		marginTop: 8,
	},
	statLabel: {
		fontSize: 14,
		marginTop: 4,
	},
	divider: {
		width: 1,
		height: '80%',
	},
	loadingText: {
		fontSize: 16,
		textAlign: 'center',
	},
});
