import React, { ReactNode, useState, useEffect } from 'react';
import { View, Modal, Pressable, Platform, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import Button from '~/components/atoms/Button';
import colors from 'tailwindcss/colors';

interface BaseModalProps {
	isVisible: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	footerContent?: ReactNode;

	animationType?: 'slide' | 'fade' | 'none';
	closeOnOverlayPress?: boolean;
	showCloseButton?: boolean;
	hideFooter?: boolean;
	overlayOpacity?: number;
	position?: 'center' | 'top';
	scrollable?: boolean;
	noPadding?: boolean;

	primaryButtonText?: string;
	secondaryButtonText?: string;
	onPrimaryButtonPress?: () => void;
	onSecondaryButtonPress?: () => void;
	primaryButtonLoading?: boolean;
	secondaryButtonLoading?: boolean;
	primaryButtonDisabled?: boolean;
	secondaryButtonDisabled?: boolean;

	size?: 'small' | 'medium' | 'large' | 'full';
	maxWidth?: number;
}

// Responsive breakpoints
const BREAKPOINTS = {
	mobile: 768,
	tablet: 1024,
	desktop: 1440,
} as const;

// Max widths for different modal sizes
const MODAL_MAX_WIDTHS = {
	small: {
		mobile: 400,
		tablet: 400,
		desktop: 400,
	},
	medium: {
		mobile: 500,
		tablet: 600,
		desktop: 700,
	},
	large: {
		mobile: 600,
		tablet: 700,
		desktop: 800,
	},
	full: {
		mobile: '90%',
		tablet: '85%',
		desktop: '80%',
	},
} as const;

/**
 * Base Modal component that provides a consistent layout and behavior for all modals in the app.
 *
 * Features:
 * - Standardized header with title and close button
 * - Flexible content area
 * - Optional footer with configurable buttons
 * - Theme-aware styling
 * - Customizable animation and behavior
 */
const BaseModal: React.FC<BaseModalProps> = ({
	isVisible,
	onClose,
	title,
	children,
	footerContent,

	animationType = 'none',
	closeOnOverlayPress = true,
	showCloseButton = true,
	hideFooter = false,
	overlayOpacity = 0.5,
	position = 'center',
	scrollable = true,

	primaryButtonText,
	secondaryButtonText,
	onPrimaryButtonPress,
	onSecondaryButtonPress,
	primaryButtonLoading = false,
	secondaryButtonLoading = false,
	primaryButtonDisabled = false,
	noPadding = false,
	secondaryButtonDisabled = false,
	size = 'medium',
	maxWidth,
}) => {
	const { isDark, themeVariant } = useTheme();
	const insets = useSafeAreaInsets();
	const [windowWidth, setWindowWidth] = useState(() =>
		Platform.OS === 'web' ? Dimensions.get('window').width : 0
	);

	// Update window width on resize
	useEffect(() => {
		if (Platform.OS !== 'web') return;

		const updateWindowWidth = () => {
			setWindowWidth(Dimensions.get('window').width);
		};

		const subscription = Dimensions.addEventListener('change', updateWindowWidth);
		return () => subscription?.remove();
	}, []);

	// Debug borders (set to true to enable)
	const DEBUG_BORDERS = false;

	// Holen der Theme-Farben basierend auf der aktuellen Variante
	const themeColors = (colors as any).theme?.extend?.colors as Record<string, any>;

	// Hintergrundfarbe für das Modal basierend auf dem Theme (wie Header)
	const modalBgColor = isDark
		? themeColors?.dark?.[themeVariant]?.menuBackground || '#252525'
		: themeColors?.[themeVariant]?.menuBackground || '#DDDDDD';

	// Textfarbe basierend auf dem Theme
	const textColor = isDark
		? themeColors?.dark?.[themeVariant]?.text || '#FFFFFF'
		: themeColors?.[themeVariant]?.text || '#000000';

	// Primärfarbe für Akzente
	const primaryColor = isDark
		? themeColors?.dark?.[themeVariant]?.primary || '#f8d62b'
		: themeColors?.[themeVariant]?.primary || '#f8d62b';

	// Rahmenfarbe basierend auf dem Theme
	const borderColor = isDark
		? themeColors?.dark?.[themeVariant]?.border || '#424242'
		: themeColors?.[themeVariant]?.border || '#e6e6e6';

	// Standardmäßige Footer-Buttons, wenn keine benutzerdefinierten bereitgestellt werden
	const renderDefaultFooter = () => {
		if (!primaryButtonText && !secondaryButtonText) return null;

		return (
			<View
				className="flex-row justify-between items-center w-full"
				style={DEBUG_BORDERS ? { borderWidth: 2, borderColor: 'yellow' } : {}}
			>
				{secondaryButtonText && (
					<Button
						variant="secondary"
						title={secondaryButtonText}
						onPress={onSecondaryButtonPress || onClose}
						loading={secondaryButtonLoading}
						disabled={secondaryButtonDisabled}
						style={{
							flex: 1,
							marginRight: 12,
							...(DEBUG_BORDERS ? { borderWidth: 2, borderColor: 'cyan' } : {}),
						}}
					/>
				)}
				{primaryButtonText && (
					<Button
						variant="primary"
						title={primaryButtonText}
						onPress={onPrimaryButtonPress}
						loading={primaryButtonLoading}
						disabled={primaryButtonDisabled}
						style={{
							flex: 1,
							...(DEBUG_BORDERS ? { borderWidth: 2, borderColor: 'magenta' } : {}),
						}}
					/>
				)}
			</View>
		);
	};

	const maxModalHeight = Platform.select({
		ios: `${100 - (insets.top + insets.bottom) / 8}%`,
		android: '90%',
		default: '90%',
	});

	// Calculate responsive max width
	const getResponsiveMaxWidth = () => {
		// Priority 1: Explicit maxWidth prop
		if (maxWidth !== undefined) return maxWidth;

		// Priority 2: Size-based responsive widths
		const sizeConfig = MODAL_MAX_WIDTHS[size];

		if (Platform.OS !== 'web') {
			// On mobile platforms, use mobile size
			return typeof sizeConfig.mobile === 'string' ? sizeConfig.mobile : sizeConfig.mobile;
		}

		// Web: responsive based on window width
		if (windowWidth < BREAKPOINTS.mobile) {
			return sizeConfig.mobile;
		} else if (windowWidth < BREAKPOINTS.tablet) {
			return sizeConfig.tablet;
		} else {
			return sizeConfig.desktop;
		}
	};

	const responsiveMaxWidth = getResponsiveMaxWidth();

	return (
		<Modal
			visible={isVisible}
			animationType={animationType}
			transparent={true}
			onRequestClose={onClose}
		>
			<View
				style={{
					flex: 1,
					justifyContent: position === 'top' ? 'flex-start' : 'center',
					alignItems: 'center',
					backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
					paddingTop: position === 'top' ? insets.top + 20 : insets.top,
					paddingBottom: insets.bottom,
					paddingHorizontal: 16,
				}}
			>
				{closeOnOverlayPress && <Pressable className="absolute inset-0" onPress={onClose} />}
				<View
					style={{
						backgroundColor: modalBgColor,
						borderWidth: DEBUG_BORDERS ? 3 : 1,
						borderColor: DEBUG_BORDERS ? 'red' : borderColor,
						maxHeight: maxModalHeight,
						width: '100%',
						maxWidth: responsiveMaxWidth,
					}}
					className="rounded-2xl shadow-lg overflow-hidden"
				>
					{/* Header mit Padding */}
					<View
						className="px-5 pt-5"
						style={DEBUG_BORDERS ? { borderWidth: 2, borderColor: 'blue' } : {}}
					>
						<View className="flex-row justify-between items-center mb-4">
							<Text
								style={{ color: textColor }}
								className="text-xl font-bold flex-1 mr-2"
								numberOfLines={1}
							>
								{title}
							</Text>
							{showCloseButton && (
								<Pressable
									className="p-1"
									onPress={onClose}
									accessibilityRole="button"
									accessibilityLabel="Close"
								>
									<Icon name="close" size={Platform.OS === 'ios' ? 20 : 24} color={textColor} />
								</Pressable>
							)}
						</View>
					</View>

					{/* Divider nach dem Header - volle Breite */}
					<View
						style={{ height: 1, backgroundColor: isDark ? '#444444' : '#DDDDDD', width: '100%' }}
					/>

					{/* Content mit Padding - scrollbar wenn nötig */}
					{scrollable ? (
						<ScrollView
							style={{
								flexGrow: 1,
								...(DEBUG_BORDERS ? { borderWidth: 2, borderColor: 'green' } : {}),
							}}
							showsVerticalScrollIndicator={true}
							bounces={false}
							contentContainerStyle={{ flexGrow: 1 }}
						>
							<View
								className={noPadding ? 'w-full' : 'px-5 pt-6 pb-4'}
								style={DEBUG_BORDERS ? { borderWidth: 2, borderColor: 'orange' } : {}}
							>
								<View className="w-full">{children}</View>
							</View>
						</ScrollView>
					) : (
						<View
							style={{
								flexGrow: 1,
								...(DEBUG_BORDERS ? { borderWidth: 2, borderColor: 'green' } : {}),
							}}
							className={noPadding ? 'w-full' : 'px-5 pt-6 pb-4'}
						>
							<View
								className="w-full"
								style={DEBUG_BORDERS ? { borderWidth: 2, borderColor: 'orange' } : {}}
							>
								{children}
							</View>
						</View>
					)}

					{/* Divider vor dem Footer - volle Breite */}
					{!hideFooter && (
						<View
							style={{ height: 1, backgroundColor: isDark ? '#444444' : '#DDDDDD', width: '100%' }}
						/>
					)}

					{/* Footer mit Padding - immer sichtbar am unteren Rand */}
					{!hideFooter && (
						<View
							className="w-full px-5 py-4"
							style={DEBUG_BORDERS ? { borderWidth: 2, borderColor: 'purple' } : {}}
						>
							{footerContent || renderDefaultFooter()}
						</View>
					)}
				</View>
			</View>
		</Modal>
	);
};

export default BaseModal;
