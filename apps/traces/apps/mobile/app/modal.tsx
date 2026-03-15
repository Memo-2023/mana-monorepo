import { FontAwesome } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

import { ThemeWrapper } from '~/components/ThemeWrapper';
import { useTheme } from '~/utils/themeContext';

export default function Modal() {
	const { isDarkMode, colors } = useTheme();

	return (
		<ThemeWrapper>
			<ScrollView
				style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}
				contentContainerStyle={styles.contentContainer}
			>
				<View style={styles.header}>
					<FontAwesome name="map-marker" size={48} color={colors.primary} style={styles.icon} />
					<Text style={[styles.title, isDarkMode && { color: '#FFFFFF' }]}>Standortverlauf</Text>
					<Text style={[styles.subtitle, isDarkMode && { color: '#AAAAAA' }]}>
						Deine Bewegungen im Blick
					</Text>
				</View>

				<View style={styles.section}>
					<Text style={[styles.sectionTitle, isDarkMode && { color: '#FFFFFF' }]}>
						Über diese App
					</Text>
					<Text style={[styles.paragraph, isDarkMode && { color: '#DDDDDD' }]}>
						Diese App ermöglicht es dir, deinen Standortverlauf aufzuzeichnen und auf einer Karte
						darzustellen. So kannst du nachvollziehen, wie du dich durch die Welt bewegst.
					</Text>
				</View>

				<View style={styles.section}>
					<Text style={[styles.sectionTitle, isDarkMode && { color: '#FFFFFF' }]}>Funktionen</Text>
					<View style={styles.featureItem}>
						<FontAwesome name="map" size={24} color={colors.primary} style={styles.featureIcon} />
						<View style={styles.featureText}>
							<Text style={[styles.featureTitle, isDarkMode && { color: '#FFFFFF' }]}>
								Echtzeit-Tracking
							</Text>
							<Text style={[styles.featureDescription, isDarkMode && { color: '#AAAAAA' }]}>
								Verfolge deinen aktuellen Standort in Echtzeit auf der Karte.
							</Text>
						</View>
					</View>
					<View style={styles.featureItem}>
						<FontAwesome
							name="history"
							size={24}
							color={colors.primary}
							style={styles.featureIcon}
						/>
						<View style={styles.featureText}>
							<Text style={[styles.featureTitle, isDarkMode && { color: '#FFFFFF' }]}>
								Standortverlauf
							</Text>
							<Text style={[styles.featureDescription, isDarkMode && { color: '#AAAAAA' }]}>
								Sieh dir deinen kompletten Bewegungsverlauf mit Details zu jedem Standort an.
							</Text>
						</View>
					</View>
					<View style={styles.featureItem}>
						<FontAwesome name="lock" size={24} color={colors.primary} style={styles.featureIcon} />
						<View style={styles.featureText}>
							<Text style={[styles.featureTitle, isDarkMode && { color: '#FFFFFF' }]}>
								Lokale Speicherung
							</Text>
							<Text style={[styles.featureDescription, isDarkMode && { color: '#AAAAAA' }]}>
								Alle deine Daten werden nur lokal auf deinem Gerät gespeichert.
							</Text>
						</View>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={[styles.sectionTitle, isDarkMode && { color: '#FFFFFF' }]}>Datenschutz</Text>
					<Text style={[styles.paragraph, isDarkMode && { color: '#DDDDDD' }]}>
						Deine Standortdaten werden ausschließlich lokal auf deinem Gerät gespeichert und nicht
						an externe Server übertragen. Du behältst die volle Kontrolle über deine Daten.
					</Text>
				</View>

				<Link href="/" asChild>
					<TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]}>
						<Text style={styles.buttonText}>Zurück zur App</Text>
					</TouchableOpacity>
				</Link>
			</ScrollView>
			<StatusBar style={isDarkMode ? 'light' : Platform.OS === 'ios' ? 'dark' : 'auto'} />
		</ThemeWrapper>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	contentContainer: {
		padding: 24,
		paddingBottom: 48,
	},
	header: {
		alignItems: 'center',
		marginBottom: 24,
	},
	icon: {
		marginBottom: 16,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
		marginTop: 4,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 12,
	},
	paragraph: {
		fontSize: 16,
		lineHeight: 24,
		color: '#444',
	},
	featureItem: {
		flexDirection: 'row',
		marginBottom: 16,
		alignItems: 'flex-start',
	},
	featureIcon: {
		marginRight: 16,
		marginTop: 2,
	},
	featureText: {
		flex: 1,
	},
	featureTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	featureDescription: {
		fontSize: 14,
		color: '#666',
		lineHeight: 20,
	},
	button: {
		// backgroundColor set dynamically via colors.primary
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 8,
		alignItems: 'center',
		marginTop: 16,
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
