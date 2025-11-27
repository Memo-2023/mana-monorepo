import React, { useState, useEffect } from 'react';
import { View, Keyboard, KeyboardEvent, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '~/features/theme/ThemeProvider';
import SearchBar from './SearchBar';
import colors from '~/tailwind.config.js';
import { usePathname } from 'expo-router';

interface SearchOverlayProps {
	isVisible: boolean;
	onSearch: (query: string) => void;
	onClose: () => void;
	placeholder?: string;
	currentIndex?: number;
	totalResults?: number;
	onNext?: () => void;
	onPrevious?: () => void;
	onChange?: (text: string) => void;
	showBackdrop?: boolean;
}

/**
 * SearchOverlay Component
 *
 * A unified search overlay that handles keyboard positioning and optional backdrop.
 * Used consistently across the app for search functionality.
 */
const SearchOverlay: React.FC<SearchOverlayProps> = ({
	isVisible,
	onSearch,
	onClose,
	placeholder = 'Search...',
	currentIndex = 0,
	totalResults = 0,
	onNext,
	onPrevious,
	onChange,
	showBackdrop = false,
}) => {
	const { isDark, themeVariant } = useTheme();
	const insets = useSafeAreaInsets();
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const pathname = usePathname();

	// Check if we're on a tab page
	// Note: The pathname might be simplified to just '/memos' even though it's in the tabs layout
	const isTabPage =
		pathname?.includes('/(tabs)/') ||
		pathname === '/memos' ||
		pathname === '/spaces' ||
		pathname === '/';

	// Check which page we're on for positioning
	const isBlueprintsPage = pathname?.includes('blueprints');
	const isTagsPage = pathname?.includes('tags');

	// Get theme colors
	const pageBackgroundColor = React.useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.pageBackground || '#121212'
			: themeColors?.[themeVariant]?.pageBackground || '#FFFFFF';
	}, [isDark, themeVariant]);

	// Keyboard height tracking
	useEffect(() => {
		const keyboardWillShowListener = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			(e: KeyboardEvent) => {
				let adjustedHeight = e.endCoordinates.height;

				// ONLY adjust for tab pages, not for regular pages like tags
				if (isTabPage && Platform.OS === 'ios') {
					// When keyboard shows on tab pages, the tab bar is hidden
					// but its space is included in the keyboard height
					const TAB_BAR_HEIGHT = 49;
					const hasHomeIndicator = insets.bottom > 20;
					const HOME_INDICATOR_EXTRA = hasHomeIndicator ? 34 : 0;
					const FINE_ADJUSTMENT = 5; // Small extra adjustment for perfect alignment

					adjustedHeight =
						e.endCoordinates.height - TAB_BAR_HEIGHT - HOME_INDICATOR_EXTRA - FINE_ADJUSTMENT;
				}

				setKeyboardHeight(adjustedHeight);
			}
		);

		const keyboardWillHideListener = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			() => {
				setKeyboardHeight(0);
			}
		);

		return () => {
			keyboardWillShowListener.remove();
			keyboardWillHideListener.remove();
		};
	}, [isTabPage, insets.bottom]);

	if (!isVisible) {
		return null;
	}

	return (
		<>
			{/* Optional semi-transparent backdrop */}
			{showBackdrop && (
				<View
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)',
						zIndex: 999,
					}}
				/>
			)}

			{/* Search bar positioned on keyboard */}
			<View
				style={{
					position: 'absolute',
					// Position based on page context when keyboard is hidden
					bottom:
						keyboardHeight > 0
							? keyboardHeight
							: isBlueprintsPage
								? insets.bottom + 60 // Slightly lower on blueprints page
								: isTagsPage
									? insets.bottom + 12 // Same as tags page button
									: insets.bottom + 20, // Default for other pages
					left: 0,
					right: 0,
					width: '100%',
					zIndex: 1000,
				}}
			>
				<SearchBar
					onSearch={onSearch}
					onClose={onClose}
					placeholder={placeholder}
					autoFocus={true}
					currentIndex={currentIndex}
					totalResults={totalResults}
					onNext={onNext}
					onPrevious={onPrevious}
					onChange={onChange}
				/>
			</View>
		</>
	);
};

export default SearchOverlay;
