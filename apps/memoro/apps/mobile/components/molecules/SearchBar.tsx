import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Platform } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from '~/components/atoms/Icon';
import Text from '~/components/atoms/Text';
import colors from '~/tailwind.config.js';

interface SearchBarProps {
	onSearch: (query: string) => void;
	onClose: () => void;
	placeholder?: string;
	autoFocus?: boolean;
	inputRef?: React.RefObject<TextInput | null>;
	currentIndex?: number;
	totalResults?: number;
	onNext?: () => void;
	onPrevious?: () => void;
	onChange?: (text: string) => void;
}

/**
 * SearchBar Component
 *
 * A dedicated search input field with navigation controls.
 * Positioned at the top of the screen for search functionality.
 */
const SearchBar: React.FC<SearchBarProps> = ({
	onSearch,
	onClose,
	placeholder = 'Suche...',
	autoFocus = false,
	inputRef,
	currentIndex = 0,
	totalResults = 0,
	onNext,
	onPrevious,
	onChange,
}) => {
	const internalInputRef = React.useRef<TextInput>(null);
	const textInputRef = inputRef || internalInputRef;
	const { isDark, themeVariant } = useTheme();
	const [inputValue, setInputValue] = useState('');

	// Direct access to colors from Tailwind config
	const menuBackgroundColor = React.useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.menuBackground || '#252525'
			: themeColors?.[themeVariant]?.menuBackground || '#FFFFFF';
	}, [isDark, themeVariant]);

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

	const handleSearch = () => {
		if (inputValue.trim()) {
			onSearch(inputValue.trim());
		}
	};

	const handleTextChange = (text: string) => {
		setInputValue(text);
		onChange?.(text);
		// Automatically search as user types (with debouncing handled by parent)
		if (text.trim()) {
			onSearch(text.trim());
		}
	};

	// Auto-focus when component mounts
	React.useEffect(() => {
		if (autoFocus && textInputRef.current) {
			const timer = setTimeout(() => {
				textInputRef.current?.focus();
			}, 100);

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
			{/* Search input container */}
			<View style={[styles.inputContainer, { borderColor: borderLightColor }]}>
				{/* Search icon */}
				<View style={styles.searchIconContainer}>
					<Icon
						name="search-outline"
						size={20}
						color={isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'}
					/>
				</View>

				<TextInput
					ref={textInputRef}
					style={[
						styles.input,
						{
							color: isDark ? '#FFFFFF' : '#000000',
						},
					]}
					value={inputValue}
					onChangeText={handleTextChange}
					placeholder={placeholder}
					placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
					multiline={false}
					returnKeyType="search"
					onSubmitEditing={handleSearch}
					autoFocus={autoFocus}
				/>

				{/* Close button */}
				<Pressable onPress={onClose} style={styles.closeButton}>
					<Icon
						name="close"
						size={20}
						color={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
					/>
				</Pressable>
			</View>

			{/* Navigation controls - show when there are results */}
			{totalResults > 0 && (
				<View style={styles.navigationContainer}>
					<Text style={[styles.resultCount, { color: isDark ? '#FFFFFF' : '#000000' }]}>
						{currentIndex} von {totalResults}
					</Text>
					<View style={styles.navigationButtons}>
						<Pressable
							onPress={onPrevious}
							style={[
								styles.navButton,
								{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
							]}
						>
							<Icon name="chevron-up" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
						</Pressable>
						<Pressable
							onPress={onNext}
							style={[
								styles.navButton,
								{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
							]}
						>
							<Icon name="chevron-down" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
						</Pressable>
					</View>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		paddingTop: 8,
		paddingBottom: 4,
		paddingHorizontal: 16,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
		borderRadius: 24,
		paddingHorizontal: 12,
		paddingVertical: Platform.OS === 'ios' ? 8 : 10,
		borderWidth: 1,
		height: Platform.OS === 'ios' ? 44 : 48, // Standard heights for touch targets
	},
	searchIconContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
		paddingHorizontal: 4,
	},
	closeButton: {
		padding: 6,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 8,
	},
	input: {
		flex: 1,
		fontSize: 16,
		paddingVertical: 0,
		paddingHorizontal: 0,
		margin: 0,
		textAlignVertical: 'center', // Android specific
		includeFontPadding: false, // Android specific - removes extra padding
		...Platform.select({
			ios: {
				lineHeight: 20, // Explicit line height for iOS
			},
			android: {
				paddingVertical: 2,
			},
		}),
	},
	searchButton: {
		padding: 8,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 4,
	},
	searchButtonPressed: {
		opacity: 0.7,
	},
	navigationContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
	},
	resultCount: {
		fontSize: 14,
		fontWeight: '500',
	},
	navigationButtons: {
		flexDirection: 'row',
		gap: 8,
	},
	navButton: {
		padding: 8,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default SearchBar;
