import React, { useState } from 'react';
import {
	View,
	StyleSheet,
	Pressable,
	TextInput,
	Platform,
	KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from '~/components/atoms/Icon';
import { useTranslation } from 'react-i18next';
import colors from '~/tailwind.config.js';

interface PromptCreationBarProps {
	onSubmit: (title: string, promptText: string) => void;
	titlePlaceholder?: string;
	promptPlaceholder?: string;
	disabled?: boolean;
	initialTitle?: string;
	initialPrompt?: string;
}

/**
 * PromptCreationBar Component
 *
 * A dual input field with a submit button for creating new prompts.
 * Has separate fields for title and prompt text.
 * Styled similarly to PillFilter for consistent UI.
 * Positioned sticky at the bottom of the screen.
 */
const PromptCreationBar: React.FC<PromptCreationBarProps> = ({
	onSubmit,
	titlePlaceholder = 'Titel eingeben...',
	promptPlaceholder = 'Prompt eingeben...',
	disabled = false,
	initialTitle = '',
	initialPrompt = '',
}) => {
	const { isDark, themeVariant } = useTheme();
	const { t } = useTranslation();
	const [titleValue, setTitleValue] = useState(initialTitle);
	const [promptValue, setPromptValue] = useState(initialPrompt);

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

	const handleSubmit = () => {
		if (titleValue.trim() && promptValue.trim() && !disabled) {
			onSubmit(titleValue.trim(), promptValue.trim());
			setTitleValue('');
			setPromptValue('');
		}
	};

	const isSubmitDisabled = disabled || !titleValue.trim() || !promptValue.trim();

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
			style={{
				width: '100%',
			}}
		>
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
				<View style={[styles.inputsContainer]}>
					{/* Title Input */}
					<View style={[styles.inputContainer, { borderColor: borderLightColor, marginBottom: 8 }]}>
						<TextInput
							style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
							value={titleValue}
							onChangeText={setTitleValue}
							placeholder={titlePlaceholder}
							placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
							editable={!disabled}
							multiline={false}
							returnKeyType="next"
						/>
					</View>

					{/* Prompt Input */}
					<View style={[styles.inputContainer, { borderColor: borderLightColor }]}>
						<TextInput
							style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
							value={promptValue}
							onChangeText={setPromptValue}
							placeholder={promptPlaceholder}
							placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
							editable={!disabled}
							multiline={true}
							numberOfLines={2}
							textAlignVertical="top"
						/>
					</View>
				</View>

				{/* Submit Button */}
				<Pressable
					onPress={handleSubmit}
					style={({ pressed }) => [
						styles.submitButton,
						pressed && styles.submitButtonPressed,
						isSubmitDisabled && styles.submitButtonDisabled,
					]}
					disabled={isSubmitDisabled}
				>
					<Icon
						name="add-circle-outline"
						size={24}
						color={
							isSubmitDisabled
								? isDark
									? 'rgba(255, 255, 255, 0.3)'
									: 'rgba(0, 0, 0, 0.3)'
								: isDark
									? '#FFFFFF'
									: '#000000'
						}
					/>
				</Pressable>
			</View>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		paddingVertical: 12,
		paddingHorizontal: 16,
		flexDirection: 'row',
		alignItems: 'flex-end',
	},
	inputsContainer: {
		flex: 1,
		marginRight: 12,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
		borderRadius: 16,
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
	submitButton: {
		padding: 12,
		borderRadius: 24,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#FF9500',
		width: 48,
		height: 48,
	},
	submitButtonPressed: {
		opacity: 0.7,
	},
	submitButtonDisabled: {
		opacity: 0.5,
		backgroundColor: 'rgba(0, 0, 0, 0.1)',
	},
});

export default PromptCreationBar;
