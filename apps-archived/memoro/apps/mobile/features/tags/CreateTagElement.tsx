import React, { useState, useMemo } from 'react';
import { View, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '~/components/atoms/Icon';
import ColorPicker from './ColorPicker';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import { useTranslation } from 'react-i18next';

// Verfügbare Farben für Tags
export const TAG_COLORS = [
	'#FF6B6B', // Rot
	'#FFA726', // Orange
	'#FFD54F', // Gelb
	'#66BB6A', // Grün
	'#4ECDC4', // Türkis
	'#42A5F5', // Blau
	'#9C27B0', // Lila
	'#EC407A', // Pink
	'#8D6E63', // Braun
	'#78909C', // Grau
];

interface CreateTagElementProps {
	isDark: boolean;
	onCreateTag: (name: string, color: string) => Promise<void>;
}

/**
 * A floating input bar for creating new tags with color selection.
 * Styled similarly to PromptBar for consistent UI.
 * Positioned sticky at the bottom of the screen with KeyboardAvoidingView.
 */
const CreateTagElement = ({ isDark, onCreateTag }: CreateTagElementProps) => {
	const { t } = useTranslation();
	const [newTagName, setNewTagName] = useState('');
	const [selectedColor, setSelectedColor] = useState('#4ECDC4'); // Standard-Farbe
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showColorPicker, setShowColorPicker] = useState(false);
	const { themeVariant } = useTheme();
	const insets = useSafeAreaInsets();

	// Colors matching the page background (same as login page)
	const menuBackgroundColor = useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.pageBackground || '#1a1a1a'
			: themeColors?.[themeVariant]?.pageBackground || '#FFFFFF';
	}, [isDark, themeVariant]);

	const borderColor = useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.border || '#424242'
			: themeColors?.[themeVariant]?.border || '#e6e6e6';
	}, [isDark, themeVariant]);

	const borderLightColor = useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.borderLight || '#333333'
			: themeColors?.[themeVariant]?.borderLight || '#f2f2f2';
	}, [isDark, themeVariant]);

	const textColor = isDark ? '#FFFFFF' : '#000000';
	const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';

	/**
	 * Verarbeitet das Absenden eines neuen Tags
	 */
	const handleSubmit = async () => {
		if (newTagName.trim() === '' || isSubmitting) return;

		try {
			setIsSubmitting(true);
			await onCreateTag(newTagName, selectedColor);
			setNewTagName(''); // Zurücksetzen nach erfolgreichem Erstellen
			setShowColorPicker(false); // Farbauswahl schließen
		} catch (error) {
			console.debug('Fehler beim Erstellen des Tags:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	/**
	 * Schaltet die Farbauswahl ein/aus
	 */
	const toggleColorPicker = () => {
		setShowColorPicker(!showColorPicker);
	};

	/**
	 * Verarbeitet die Auswahl einer Farbe
	 */
	const handleColorSelect = (color: string) => {
		setSelectedColor(color);
		// Farbauswahl bleibt geöffnet, damit der Benutzer mehrere Farben ausprobieren kann
	};

	return (
		<View
			style={{
				backgroundColor: menuBackgroundColor,
				borderTopWidth: 1,
				borderColor: borderColor,
				shadowColor: '#000',
				shadowOffset: { width: 0, height: -2 },
				shadowOpacity: isDark ? 0.3 : 0.1,
				shadowRadius: 3,
				elevation: 5,
				width: '100%',
				paddingTop: 12,
				paddingHorizontal: 16,
				paddingBottom: 8 + (insets.bottom || 0),
				borderRadius: 0,
			}}
		>
			{/* Color picker row */}
			{showColorPicker && (
				<View style={{ marginBottom: 12 }}>
					<ColorPicker
						colors={TAG_COLORS}
						selectedColor={selectedColor}
						onSelectColor={handleColorSelect}
						isDark={isDark}
					/>
				</View>
			)}

			{/* Input container matching PromptBar style */}
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					backgroundColor: 'rgba(0, 0, 0, 0.05)',
					borderRadius: 24,
					paddingHorizontal: 16,
					paddingVertical: 10,
					borderWidth: 1,
					borderColor: borderLightColor,
				}}
			>
				{/* Color selection button */}
				<Pressable
					onPress={toggleColorPicker}
					style={({ pressed }) => ({
						padding: 4,
						marginRight: 20,
						opacity: pressed ? 0.7 : 1,
					})}
				>
					<View
						style={{
							width: 24,
							height: 24,
							borderRadius: 12,
							backgroundColor: selectedColor,
							borderWidth: 1,
							borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
						}}
					/>
				</Pressable>

				{/* Text input */}
				<TextInput
					style={{
						flex: 1,
						fontSize: 16,
						paddingVertical: 4,
						paddingLeft: 8,
						minHeight: 24,
						color: textColor,
					}}
					placeholder={t('tags.create_tag_placeholder', 'Neuen Tag erstellen...')}
					placeholderTextColor={placeholderColor}
					value={newTagName}
					onChangeText={setNewTagName}
					onSubmitEditing={handleSubmit}
					returnKeyType="send"
				/>

				{/* Submit button */}
				<Pressable
					onPress={handleSubmit}
					disabled={newTagName.trim() === '' || isSubmitting}
					style={({ pressed }) => ({
						padding: 8,
						borderRadius: 20,
						justifyContent: 'center',
						alignItems: 'center',
						marginLeft: 4,
						opacity: pressed ? 0.7 : newTagName.trim() === '' || isSubmitting ? 0.3 : 1,
					})}
				>
					{isSubmitting ? (
						<ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
					) : (
						<Icon
							name="send"
							size={20}
							color={
								newTagName.trim() === ''
									? isDark
										? 'rgba(255, 255, 255, 0.3)'
										: 'rgba(0, 0, 0, 0.3)'
									: isDark
										? '#FFFFFF'
										: '#000000'
							}
						/>
					)}
				</Pressable>
			</View>
		</View>
	);
};

export default CreateTagElement;
