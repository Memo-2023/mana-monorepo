import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/Text';
import { useTheme } from '~/utils/theme/theme';

interface AIActionButtonProps {
	onPress: () => void;
	disabled?: boolean;
	isGenerating?: boolean;
	hasPrompt?: boolean;
	style?: any;
}

export const AIActionButton: React.FC<AIActionButtonProps> = ({
	onPress,
	disabled = false,
	isGenerating = false,
	hasPrompt = false,
	style,
}) => {
	const { isDark } = useTheme();
	const [isPressed, setIsPressed] = useState(false);

	// Bestimme den Button-Text basierend auf dem Kontext
	const getButtonText = () => {
		if (isGenerating) return 'Generiere...';
		if (hasPrompt) return 'Prompt senden';
		return 'Mit KI fortsetzen';
	};

	// Bestimme das Button-Icon basierend auf dem Kontext
	const getButtonIcon = () => {
		if (isGenerating) return undefined;
		if (hasPrompt) return 'send';
		return 'sparkles-outline';
	};

	// Bestimme die Hintergrundfarbe basierend auf dem Zustand
	const getBackgroundColor = () => {
		if (disabled) return isDark ? '#4b5563' : '#d1d5db';
		if (isPressed) return '#4338ca'; // Dunkleres Indigo für Pressed-State
		return '#4f46e5'; // Standard Indigo
	};

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled || isGenerating}
			onPressIn={() => setIsPressed(true)}
			onPressOut={() => setIsPressed(false)}
			style={({ pressed }) => [
				styles.button,
				{
					backgroundColor: getBackgroundColor(),
					transform: [{ scale: pressed ? 0.98 : 1 }],
					opacity: disabled ? 0.7 : 1,
				},
				style,
			]}
		>
			<View style={styles.buttonContent}>
				{getButtonIcon() && (
					<Ionicons
						name={getButtonIcon() || 'sparkles-outline'}
						size={18}
						color="#ffffff"
						style={{ marginRight: 8 }}
					/>
				)}
				<Text style={styles.buttonText}>{getButtonText()}</Text>
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	button: {
		borderRadius: 8,
		paddingHorizontal: 16,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 1.5,
		justifyContent: 'center',
		height: '100%',
		flex: 1,
	},
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonText: {
		color: '#ffffff',
		fontWeight: '500',
		fontSize: 14,
	},
});
