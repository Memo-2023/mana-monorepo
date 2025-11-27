import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from '~/components/atoms/Icon';
import Text from '~/components/atoms/Text';
import ManaIcon from '~/features/subscription/ManaIcon';
import colors from '~/tailwind.config.js';

interface PromptBarProps {
	onSubmit: (prompt: string) => void;
	placeholder?: string;
	disabled?: boolean;
	initialValue?: string;
	autoFocus?: boolean;
	inputRef?: React.RefObject<TextInput | null>;
	isLoading?: boolean;
	loadingText?: string;
	onClose?: () => void;
	showCloseButton?: boolean;
	manaCost?: number;
	manaCostLabel?: string;
}

/**
 * PromptBar Component
 *
 * An input field with a submit button for sending prompts or messages.
 * Styled similarly to PillFilter for consistent UI.
 * Positioned sticky at the bottom of the screen.
 */
const PromptBar: React.FC<PromptBarProps> = ({
	onSubmit,
	placeholder = 'Prompt eingeben...',
	disabled = false,
	initialValue = '',
	autoFocus = false,
	inputRef,
	isLoading = false,
	loadingText = 'Antwort wird generiert...',
	onClose,
	showCloseButton = false,
	manaCost,
	manaCostLabel,
}) => {
	// Erstelle einen internen Ref, wenn keiner von außen übergeben wurde
	const internalInputRef = React.useRef<TextInput>(null);
	const textInputRef = inputRef || internalInputRef;
	const { isDark, themeVariant, tw } = useTheme();
	const [inputValue, setInputValue] = useState(initialValue);
	// Direct access to colors from Tailwind config
	const menuBackgroundColor = React.useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.menuBackground || '#252525'
			: themeColors?.[themeVariant]?.menuBackground || '#FFFFFF';
	}, [isDark, themeVariant]);

	// Get border colors from theme
	const borderColor = React.useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.border || '#424242'
			: themeColors?.[themeVariant]?.border || '#e6e6e6';
	}, [isDark, themeVariant]);

	const borderLightColor = React.useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.borderLight || '#333333'
			: themeColors?.[themeVariant]?.borderLight || '#f2f2f2';
	}, [isDark, themeVariant]);

	const borderStrongColor = React.useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.borderStrong || '#616161'
			: themeColors?.[themeVariant]?.borderStrong || '#cccccc';
	}, [isDark, themeVariant]);

	const handleSubmit = () => {
		if (inputValue.trim() && !disabled && !isLoading) {
			onSubmit(inputValue.trim());
			setInputValue('');
		}
	};

	// Fokussiere das Eingabefeld, wenn autoFocus true ist
	React.useEffect(() => {
		if (autoFocus && textInputRef.current) {
			// Verzögerung, um sicherzustellen, dass die Komponente vollständig gerendert ist
			const timer = setTimeout(() => {
				textInputRef.current?.focus();
			}, 300);

			return () => clearTimeout(timer);
		}
	}, [autoFocus]);

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: menuBackgroundColor,
					borderTopWidth: 1,
					borderColor: borderColor,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: -2 },
					shadowOpacity: isDark ? 0.3 : 0.1,
					shadowRadius: 3,
					elevation: 5,
				},
			]}
		>
			{/* Mana cost display with close button in same row */}
			{(manaCost !== undefined || manaCostLabel || (showCloseButton && onClose)) && (
				<View style={styles.manaCostContainer}>
					{/* Spacer for left side to center the mana costs */}
					<View style={styles.spacer} />

					{/* Centered mana cost content */}
					<View style={styles.manaCostContent}>
						{manaCost !== undefined && <ManaIcon size={16} color="#0099FF" />}
						{manaCost !== undefined && (
							<Text style={[styles.manaCostText, { color: '#0099FF' }]}>{manaCost}</Text>
						)}
						{manaCostLabel && (
							<Text style={[styles.manaCostLabel, { color: isDark ? '#888' : '#666' }]}>
								{manaCostLabel}
							</Text>
						)}
					</View>

					{/* Close button on the right */}
					<View style={styles.rightSection}>
						{showCloseButton && onClose ? (
							<Pressable
								onPress={onClose}
								style={({ pressed }) => [
									styles.inlineCloseButton,
									pressed && styles.closeButtonPressed,
								]}
							>
								<Icon
									name="close"
									size={20}
									color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'}
								/>
							</Pressable>
						) : (
							<View style={styles.spacer} />
						)}
					</View>
				</View>
			)}

			<View style={[styles.inputContainer, { borderColor: borderLightColor }]}>
				<TextInput
					ref={textInputRef}
					style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
					value={inputValue}
					onChangeText={setInputValue}
					placeholder={placeholder}
					placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
					editable={!disabled && !isLoading}
					multiline={false}
					returnKeyType="send"
					onSubmitEditing={handleSubmit}
					autoFocus={autoFocus}
				/>

				<Pressable
					onPress={handleSubmit}
					style={({ pressed }) => [
						styles.sendButton,
						pressed && styles.sendButtonPressed,
						(disabled || isLoading) && styles.sendButtonDisabled,
					]}
					disabled={disabled || isLoading || !inputValue.trim()}
				>
					{isLoading ? (
						<ActivityIndicator
							size={16}
							color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'}
						/>
					) : (
						<Icon
							name="send"
							size={20}
							color={
								disabled || isLoading || !inputValue.trim()
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

const styles = StyleSheet.create({
	container: {
		width: '100%',
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	manaCostContainer: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
		paddingVertical: 8,
	},
	spacer: {
		flex: 1,
	},
	manaCostContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1,
	},
	rightSection: {
		flex: 1,
		alignItems: 'flex-end',
		justifyContent: 'center',
	},
	inlineCloseButton: {
		padding: 8,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	manaCostText: {
		marginLeft: 6,
		fontSize: 14,
		fontWeight: '600',
	},
	manaCostLabel: {
		marginLeft: 4,
		fontSize: 12,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
		borderRadius: 24,
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderWidth: 1,
	},
	input: {
		flex: 1,
		fontSize: 16,
		paddingVertical: 4,
		minHeight: 24,
	},
	closeButtonPressed: {
		opacity: 0.7,
	},
	sendButton: {
		padding: 8,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 4,
	},
	sendButtonPressed: {
		opacity: 0.7,
	},
	sendButtonDisabled: {
		opacity: 0.5,
	},
});

export default PromptBar;
