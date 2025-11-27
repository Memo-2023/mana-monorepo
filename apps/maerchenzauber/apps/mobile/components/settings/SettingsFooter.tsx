import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Constants from 'expo-constants';
import Text from '../atoms/Text';
import Icon from '../atoms/Icon';

interface SettingsFooterProps {
	onLongPress: () => void;
}

export default function SettingsFooter({ onLongPress }: SettingsFooterProps) {
	return (
		<>
			<TouchableOpacity
				style={styles.footerCard}
				onLongPress={onLongPress}
				delayLongPress={1000}
				activeOpacity={1}
			>
				<View style={styles.footerContent}>
					<View style={styles.footerRow}>
						<Icon set="ionicons" name="heart" size={16} color="#FFCB00" style={styles.footerIcon} />
						<Text style={styles.footerText}>Mit Liebe gezaubert am Bodensee</Text>
					</View>

					<View style={styles.footerRow}>
						<Text style={styles.footerText}>von Nils Weiser & Till Schneider</Text>
					</View>

					<View style={styles.footerRow}>
						<Text style={styles.footerTextSmall}>Memoro GmbH</Text>
					</View>
				</View>
			</TouchableOpacity>

			<View style={styles.versionContainer}>
				<Text style={styles.versionText}>
					Version {Constants.expoConfig?.version || '1.1.0'} (
					{Platform.OS === 'ios'
						? `Build ${Constants.expoConfig?.ios?.buildNumber || '30'}`
						: `Build ${Constants.expoConfig?.android?.versionCode || '30'}`}
					)
				</Text>
				{__DEV__ && (
					<Text style={styles.versionTextSecondary}>Development Mode • {Platform.OS}</Text>
				)}
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	footerCard: {
		marginTop: 24,
		marginBottom: 24,
		borderRadius: 12,
		backgroundColor: '#2C2C2C',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.08)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	footerContent: {
		paddingVertical: 16,
		paddingHorizontal: 24,
		alignItems: 'center',
	},
	footerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8,
	},
	footerIcon: {
		marginRight: 6,
	},
	footerText: {
		color: '#CCCCCC',
		fontSize: 14,
		fontWeight: '500',
	},
	footerTextSmall: {
		color: '#999999',
		fontSize: 13,
	},
	versionContainer: {
		alignItems: 'center',
		paddingVertical: 16,
		paddingBottom: 24,
	},
	versionText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '500',
		textAlign: 'center',
	},
	versionTextSecondary: {
		color: '#999999',
		fontSize: 11,
		marginTop: 4,
		textAlign: 'center',
	},
});
