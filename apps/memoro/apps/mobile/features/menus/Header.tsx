import React, { useMemo } from 'react';
import { View, Pressable, Platform, ScrollView, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
// BlurView import removed
import colors from '~/tailwind.config.js';
import Icon from '~/components/atoms/Icon';
import CircleIconButton from '~/components/atoms/CircleIconButton';
import Text from '~/components/atoms/Text';
import { ArrowCircleLeft } from 'phosphor-react-native';

interface RightIconProps {
	name: string;
	onPress?: () => void;
	href?: string;
	customElement?: React.ReactNode;
}

interface TagItem {
	id: string;
	name: string;
	color: string;
}

interface HeaderProps {
	title?: string;
	showBackButton?: boolean;
	rightIcon?: string;
	onRightIconPress?: () => void;
	rightIconHref?: string;
	rightIcons?: RightIconProps[];
	className?: string;
	onThemeToggle?: () => void;
	selectedTags?: TagItem[];
	onTagRemove?: (tagId: string) => void;
	isHomePage?: boolean;
	scrollableTitle?: boolean;
	showTitle?: boolean;
	isMemoDetailPage?: boolean;
	backgroundColor?: string;
}

/**
 * Header-Komponente
 *
 * Eine wiederverwendbare Header-Komponente für alle Seiten der Anwendung.
 * Unterstützt einen Titel, einen Zurück-Button und ein optionales rechtes Icon.
 *
 * Beispiel:
 * ```tsx
 * <Header title="Startseite" />
 * <Header title="Einstellungen" showBackButton />
 * <Header title="Profil" rightIcon="settings-outline" rightIconHref="/settings" />
 * ```
 */
const Header: React.FC<HeaderProps> = ({
	title,
	showBackButton = false,
	rightIcon,
	onRightIconPress,
	rightIconHref,
	rightIcons,
	className = '',
	onThemeToggle,
	selectedTags = [],
	onTagRemove,
	isHomePage = false,
	scrollableTitle = false,
	showTitle = true,
	isMemoDetailPage = false,
	backgroundColor,
}) => {
	const { t } = useTranslation();
	const { tw, isDark, themeVariant } = useTheme();
	const router = useRouter();
	const pathname = usePathname();
	const insets = useSafeAreaInsets();

	// Use a fixed top padding for initial render to prevent layout shift
	// iOS typically has 44-47px status bar, Android varies but usually 0-24px
	const safeTopPadding = insets.top || (Platform.OS === 'ios' ? 44 : 0);

	// Generate title text based on selected tags - moved up for animation
	const getTitleText = () => {
		if (selectedTags && selectedTags.length > 0) {
			// Join tag names with ' & ' separator
			return selectedTags.map((tag) => tag.name).join(' & ');
		}
		// Return title directly, don't fallback to 'Memoro' if title is empty string
		return title === '' ? '' : title || t('app.name', 'Memoro');
	};

	// Get the actual title text that will be displayed
	const actualTitleText = getTitleText();

	// Track if this is the initial render to skip animation
	const isInitialRender = React.useRef(true);

	// Animation for title fade in/out - initialize based on showTitle prop
	const titleOpacity = React.useRef(
		new Animated.Value(showTitle && actualTitleText ? 1 : 0)
	).current;

	// Animate title opacity when showTitle or title text changes (skip on initial render)
	React.useEffect(() => {
		// Skip animation on initial render to prevent layout shift
		if (isInitialRender.current) {
			isInitialRender.current = false;
			// Set opacity directly without animation
			const initialOpacity = showTitle && actualTitleText ? 1 : 0;
			titleOpacity.setValue(initialOpacity);
			return;
		}

		const targetOpacity = showTitle && actualTitleText ? 1 : 0;
		Animated.timing(titleOpacity, {
			toValue: targetOpacity,
			duration: 200,
			useNativeDriver: true,
		}).start();
	}, [showTitle, actualTitleText, titleOpacity]);

	const triggerHaptic = async () => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		} catch (error) {
			console.debug('Haptic feedback error:', error);
		}
	};

	// Determine the header background color based on the theme
	// Use provided backgroundColor or default to menuBackground
	const headerBackgroundColor = useMemo(() => {
		if (backgroundColor) {
			return backgroundColor;
		}
		return isDark
			? colors.theme.extend.colors.dark[themeVariant].menuBackground
			: colors.theme.extend.colors[themeVariant].menuBackground;
	}, [backgroundColor, isDark, themeVariant]);

	// Blur effect code removed

	// Bestimme die Textfarbe basierend auf dem Theme
	const textColor = useMemo(() => (isDark ? '#FFFFFF' : '#000000'), [isDark]);

	// Theme color for back button
	const backButtonColor = useMemo(() => {
		return isDark
			? (colors.theme?.extend?.colors?.dark as any)?.[themeVariant]?.borderStrong
			: (colors.theme?.extend?.colors as any)?.[themeVariant]?.borderStrong;
	}, [isDark, themeVariant]);

	// Handler für den Zurück-Button
	const handleBackPress = async () => {
		await triggerHaptic();
		router.back();
	};

	// Rendere die rechten Icons
	const renderRightIcons = () => {
		// Container für rechte Icons und Menü
		const rightContainer = (
			<View
				className={tw('flex-row items-center')}
				style={{ height: '100%', alignItems: 'center' }}
			>
				{/* Zeige die konfigurierten Icons an */}
				{rightIcons && rightIcons.length > 0 && (
					<View className={tw('flex-row')}>
						{rightIcons.map((icon, index) => {
							// Wenn ein benutzerdefiniertes Element vorhanden ist, verwende dieses
							if (icon.customElement) {
								return (
									<React.Fragment key={`custom-${index}`}>{icon.customElement}</React.Fragment>
								);
							}

							// Ansonsten Standard-Icon-Element erstellen
							const iconName =
								icon.name === 'share-outline' && Platform.OS === 'android'
									? 'share-social-outline'
									: icon.name;

							const handlePress = async () => {
								await triggerHaptic();
								icon.onPress?.();
							};

							if (icon.href) {
								return (
									<Link key={`link-${index}`} href={icon.href as any} asChild>
										<Pressable onPress={handlePress} style={{ marginLeft: 4 }}>
											<CircleIconButton>
												<Icon name={iconName} size={24} color={textColor} />
											</CircleIconButton>
										</Pressable>
									</Link>
								);
							}

							return (
								<Pressable key={`icon-${index}`} onPress={handlePress} style={{ marginLeft: 4 }}>
									<CircleIconButton>
										<Icon name={iconName} size={24} color={textColor} />
									</CircleIconButton>
								</Pressable>
							);
						})}
					</View>
				)}

				{/* Einzelnes Icon, wenn keine Icon-Liste vorhanden ist */}
				{!rightIcons && rightIcon && (
					<View style={{ marginLeft: 4 }}>
						{rightIconHref ? (
							<Link href={rightIconHref as any} asChild>
								<Pressable
									onPress={async () => {
										await triggerHaptic();
										onRightIconPress?.();
									}}
								>
									<CircleIconButton>
										<Icon name={rightIcon} size={24} color={textColor} />
									</CircleIconButton>
								</Pressable>
							</Link>
						) : (
							<Pressable
								onPress={async () => {
									await triggerHaptic();
									onRightIconPress?.();
								}}
							>
								<CircleIconButton>
									<Icon name={rightIcon} size={24} color={textColor} />
								</CircleIconButton>
							</Pressable>
						)}
					</View>
				)}
			</View>
		);

		return rightContainer;
	};

	// Always use default text color for title
	const getTitleColor = () => {
		return textColor;
	};

	return (
		<View
			className={tw(`${className}`)}
			style={{
				backgroundColor: headerBackgroundColor,
				zIndex: Platform.OS === 'web' ? 1000 : undefined,
				borderBottomWidth: 0,
				elevation: 0,
				shadowOpacity: 0,
				paddingTop: safeTopPadding,
			}}
		>
			<View
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: headerBackgroundColor,
				}}
			/>
			<View
				style={
					Platform.OS === 'web'
						? {
								maxWidth: 640, // Match WebContainer's default width
								width: '100%',
								marginHorizontal: 'auto',
								paddingHorizontal: Dimensions.get('window').width > 1024 ? 24 : 0, // Match WebContainer's padding
							}
						: {}
				}
			>
				<View
					className={tw('flex-row items-center justify-between')}
					style={{ height: 44, marginBottom: 0 }}
				>
					<View
						className={tw('flex-row items-center')}
						style={{
							flex: 1,
							minWidth: 0,
							paddingLeft: showBackButton ? 8 : 18,
							height: '100%',
							alignItems: 'center',
						}}
					>
						{showBackButton && (
							<Pressable className={tw('ml-0 mr-6 p-3')} onPress={handleBackPress}>
								<ArrowCircleLeft size={44} color={backButtonColor || textColor} weight="fill" />
							</Pressable>
						)}
						<View
							style={{
								flexShrink: 1,
								marginRight: scrollableTitle ? 0 : 8,
								flex: 1,
								position: 'relative',
								justifyContent: 'center',
								alignItems: 'center',
								height: '100%',
							}}
						>
							<Animated.View style={{ opacity: titleOpacity }}>
								{scrollableTitle ? (
									<View style={{ position: 'relative' }}>
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											contentContainerStyle={{ alignItems: 'center', paddingRight: 60 }}
										>
											<Pressable
												onPress={async () => {
													// If there are selected tags, allow removing them by clicking on the title
													if (selectedTags && selectedTags.length > 0 && onTagRemove) {
														await triggerHaptic();
														// Remove all tags one by one
														selectedTags.forEach((tag) => onTagRemove(tag.id));
													}
												}}
											>
												<Text
													variant={isMemoDetailPage ? 'h3' : 'h2'}
													className={tw('font-bold')}
													style={{ color: getTitleColor() }}
												>
													{actualTitleText}
												</Text>
											</Pressable>
										</ScrollView>
										{/* Gradient overlay for scrollable title */}
										<LinearGradient
											colors={[
												headerBackgroundColor + '00', // 0% opacity (transparent)
												headerBackgroundColor, // 100% opacity
											]}
											locations={[0, 0.8]}
											start={{ x: 0, y: 0 }}
											end={{ x: 1, y: 0 }}
											style={{
												position: 'absolute',
												right: 0,
												top: 0,
												bottom: 0,
												width: 80,
												pointerEvents: 'none',
												zIndex: 10,
											}}
										/>
									</View>
								) : (
									<Pressable
										onPress={async () => {
											// If there are selected tags, allow removing them by clicking on the title
											if (selectedTags && selectedTags.length > 0 && onTagRemove) {
												await triggerHaptic();
												// Remove all tags one by one
												selectedTags.forEach((tag) => onTagRemove(tag.id));
											}
										}}
									>
										<Text
											variant={isMemoDetailPage ? 'h3' : 'h2'}
											className={tw('font-bold')}
											numberOfLines={1}
											ellipsizeMode="tail"
											style={{ color: getTitleColor(), textAlign: 'center' }}
										>
											{actualTitleText}
										</Text>
									</Pressable>
								)}
							</Animated.View>
						</View>
					</View>

					{renderRightIcons()}
				</View>
			</View>
		</View>
	);
};

export default Header as React.FC<HeaderProps>;
