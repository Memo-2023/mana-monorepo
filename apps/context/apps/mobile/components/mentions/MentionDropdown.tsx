import React, { useEffect, useState, useRef } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	Dimensions,
	Platform,
} from 'react-native';
import { Document } from '~/services/supabaseService';
import { useTheme } from '~/utils/theme';

interface MentionDropdownProps {
	documents: Document[];
	onSelectDocument: (document: Document) => void;
	position?: { top: number; left: number }; // Optional, wir verwenden jetzt eine feste Position
	visible: boolean;
	maxHeight?: number;
	fullWidth?: boolean; // Ob das Dropdown die volle Breite einnehmen soll
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
	documents,
	onSelectDocument,
	position,
	visible,
	maxHeight = 200,
	fullWidth = false,
}) => {
	const { mode } = useTheme();
	const isDark = mode === 'dark';
	const dropdownRef = useRef<View>(null);
	const [isHovered, setIsHovered] = useState(false);
	const [isVisible, setIsVisible] = useState(visible);

	// Wenn visible sich ändert, aktualisiere isVisible
	useEffect(() => {
		if (visible) {
			setIsVisible(true);
		} else if (!isHovered) {
			// Nur ausblenden, wenn explizit angefordert und nicht mit der Maus darüber
			setIsVisible(false);
		}
	}, [visible, isHovered]);

	// Debug-Ausgabe
	useEffect(() => {
		if (isVisible) {
			console.log('MentionDropdown ist sichtbar mit', documents.length, 'Dokumenten');
			console.log('Position:', position);
		}
	}, [isVisible, documents, position]);

	// Kein automatisches Ausblenden mehr
	// Die Liste bleibt sichtbar, bis der Benutzer eine Auswahl trifft oder das Textfeld verlässt

	if (!isVisible || documents.length === 0) {
		return null;
	}

	// Bildschirmbreite für fullWidth-Option
	const { width: screenWidth } = Dimensions.get('window');

	return (
		<View
			ref={dropdownRef}
			style={[
				styles.container,
				{
					// Wenn position vorhanden ist, verwende sie, sonst feste Position
					top: position ? position.top : 100,
					left: position ? position.left : 20,
					// Wenn fullWidth, dann volle Breite, sonst 250px
					width: fullWidth ? screenWidth : 250,
					maxHeight,
					backgroundColor: isDark ? '#1f2937' : '#ffffff',
					borderColor: isDark ? '#374151' : '#e5e7eb',
					// Schatten für bessere Sichtbarkeit
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.15,
					shadowRadius: 3,
					elevation: 5,
				},
			]}
			{...(Platform.OS === 'web'
				? {
						onMouseEnter: () => setIsHovered(true),
						onMouseLeave: () => setIsHovered(false),
					}
				: {})}
		>
			<ScrollView style={styles.scrollView}>
				{documents.map((doc) => (
					<TouchableOpacity
						key={doc.id}
						style={[styles.documentItem, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
						onPress={() => {
							// Dokument auswählen und Dropdown schließen
							onSelectDocument(doc);
							// Dropdown erst schließen, nachdem die Auswahl verarbeitet wurde
							setTimeout(() => {
								setIsVisible(false);
							}, 200);
						}}
					>
						<Text
							style={{
								fontSize: 14,
								fontWeight: '500',
								color: isDark ? '#f3f4f6' : '#1f2937',
							}}
						>
							{doc.title}
						</Text>
						<Text
							style={{
								fontSize: 12,
								color: isDark ? '#9ca3af' : '#6b7280',
								marginTop: 2,
							}}
						>
							{getDocumentTypeLabel(doc.type)}
						</Text>
					</TouchableOpacity>
				))}
			</ScrollView>
		</View>
	);
};

const getDocumentTypeLabel = (type: 'text' | 'context' | 'prompt'): string => {
	switch (type) {
		case 'text':
			return 'Text';
		case 'context':
			return 'Kontext';
		case 'prompt':
			return 'Prompt';
		default:
			return 'Dokument';
	}
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		zIndex: 9999, // Höherer z-Index, damit es über allem schwebt
		borderWidth: 1,
		borderRadius: 8,
		overflow: 'hidden',
	},
	scrollView: {
		flex: 1,
	},
	documentItem: {
		padding: 10,
		borderBottomWidth: 1,
	},
});
