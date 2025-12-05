import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '~/context/I18nContext';
import { useTheme } from '~/utils/theme/theme';

interface LanguagePickerProps {
	style?: any;
}

export const LanguagePicker: React.FC<LanguagePickerProps> = ({ style }) => {
	const { isDark } = useTheme();
	const { language, supportedLanguages, setLanguage } = useI18n();
	const [isModalVisible, setIsModalVisible] = useState(false);

	const currentLanguage = supportedLanguages.find((lang) => lang.code === language);

	const handleLanguageSelect = async (languageCode: string) => {
		await setLanguage(languageCode as any);
		setIsModalVisible(false);
	};

	return (
		<View style={[styles.container, style]}>
			<TouchableOpacity
				style={[
					styles.picker,
					{ backgroundColor: isDark ? '#1f2937' : '#ffffff' },
					{ borderColor: isDark ? '#374151' : '#e5e7eb' },
				]}
				onPress={() => setIsModalVisible(true)}
			>
				<View style={styles.pickerContent}>
					<View style={styles.iconContainer}>
						<Ionicons name="language-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
					</View>
					<View style={styles.textContainer}>
						<Text style={[styles.label, { color: isDark ? '#f9fafb' : '#1f2937' }]}>
							Language / Sprache
						</Text>
						<Text style={[styles.value, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
							{currentLanguage?.nativeName || 'English'}
						</Text>
					</View>
					<Ionicons name="chevron-forward" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
				</View>
			</TouchableOpacity>

			<Modal
				visible={isModalVisible}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setIsModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={[styles.modalContent, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
						<View style={styles.modalHeader}>
							<Text style={[styles.modalTitle, { color: isDark ? '#f9fafb' : '#1f2937' }]}>
								Select Language
							</Text>
							<TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
								<Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
							</TouchableOpacity>
						</View>

						<ScrollView style={styles.languageList}>
							{supportedLanguages.map((lang) => (
								<TouchableOpacity
									key={lang.code}
									style={[
										styles.languageItem,
										{ borderBottomColor: isDark ? '#374151' : '#e5e7eb' },
										language === lang.code && styles.selectedLanguageItem,
									]}
									onPress={() => handleLanguageSelect(lang.code)}
								>
									<View style={styles.languageItemContent}>
										<Text style={[styles.languageName, { color: isDark ? '#f9fafb' : '#1f2937' }]}>
											{lang.nativeName}
										</Text>
										<Text style={[styles.languageCode, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
											{lang.name}
										</Text>
									</View>
									{language === lang.code && (
										<Ionicons name="checkmark" size={20} color={isDark ? '#818cf8' : '#4f46e5'} />
									)}
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
	picker: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	pickerContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconContainer: {
		marginRight: 12,
	},
	textContainer: {
		flex: 1,
	},
	label: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 2,
	},
	value: {
		fontSize: 14,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '80%',
		maxWidth: 400,
		maxHeight: '70%',
		borderRadius: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	closeButton: {
		padding: 4,
	},
	languageList: {
		maxHeight: 300,
	},
	languageItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		borderBottomWidth: 1,
	},
	selectedLanguageItem: {
		backgroundColor: 'rgba(129, 140, 248, 0.1)',
	},
	languageItemContent: {
		flex: 1,
	},
	languageName: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 2,
	},
	languageCode: {
		fontSize: 14,
	},
});
