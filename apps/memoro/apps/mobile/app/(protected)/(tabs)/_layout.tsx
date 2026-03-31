import React, { useState, useMemo, memo, useEffect, useRef } from 'react';
import { Link, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import { HeaderButton } from '~/components/HeaderButton';
import { TabBarIcon } from '~/components/TabBarIcon';
import colors from '~/tailwind.config.js';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import CustomMenu from '~/components/atoms/CustomMenu';
import { useUnuploadedCount } from '~/features/storage/hooks/useUnuploadedCount';
import { useInitializeUploadStatus } from '~/features/storage/store/uploadStatusStore';
import NotificationBadge from '~/components/atoms/NotificationBadge';
import { useBottomBarStore } from '~/features/bottomBar';
import { useGlobalSearchStore } from '~/features/search';
import { useMainMenuItems } from '~/features/menus/useMainMenuItems';

// ── TabPill: wiederverwendbare Pill-Komponente für alle Tabs ──
// Wenn `asView` gesetzt ist, wird ein View statt Pressable gerendert (für CustomMenu-Wrapper).
const TabPill = memo(
	({
		label,
		iconName,
		isActive,
		isDark,
		activeBackgroundColor,
		hoverBackgroundColor,
		inactiveBackgroundColor,
		onPress,
		badge,
		asView,
	}: {
		label: string;
		iconName: string;
		isActive: boolean;
		isDark: boolean;
		activeBackgroundColor: string;
		hoverBackgroundColor: string;
		inactiveBackgroundColor: string;
		onPress?: () => void;
		badge?: number;
		asView?: boolean;
	}) => {
		const [isHovered, setIsHovered] = useState(false);
		const iconColor = isDark ? '#FFFFFF' : '#000000';
		const pillBorderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
		const contentOpacity = isActive ? 1.0 : 0.5;

		const hoverProps =
			Platform.OS === 'web'
				? {
						onMouseEnter: () => setIsHovered(true),
						onMouseLeave: () => setIsHovered(false),
					}
				: {};

		const backgroundColor = isActive
			? activeBackgroundColor
			: isHovered
				? hoverBackgroundColor
				: 'transparent';

		const activeBorderColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';

		const pillStyle = [
			styles.pill,
			{
				backgroundColor,
				borderWidth: isActive ? 1 : 0,
				borderColor: isActive ? activeBorderColor : 'transparent',
			},
		];

		const content = (
			<View style={[styles.pillContent, { opacity: contentOpacity }]}>
				<View style={styles.iconWrapper}>
					<Icon name={iconName} size={20} color={iconColor} />
					{badge != null && badge > 0 && (
						<NotificationBadge count={badge} size="small" style={styles.badge} />
					)}
				</View>
				<Text
					style={[
						styles.pillLabel,
						{
							color: iconColor,
							fontWeight: isActive ? '600' : '500',
						},
					]}
				>
					{label}
				</Text>
			</View>
		);

		if (asView) {
			return (
				<View style={pillStyle} {...hoverProps}>
					{content}
				</View>
			);
		}

		return (
			<Pressable onPress={onPress} style={pillStyle} {...hoverProps}>
				{content}
			</Pressable>
		);
	}
);

TabPill.displayName = 'TabPill';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		borderTopWidth: 0,
		borderWidth: 0,
		backgroundColor: 'transparent',
		paddingHorizontal: 12,
		paddingTop: 8,
		paddingBottom: 4,
		gap: 4,
	},
	pill: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderRadius: 50,
	},
	pillContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	pillLabel: {
		fontSize: 15,
		marginLeft: 4,
		marginTop: 1,
		fontFamily: 'System',
	},
	iconWrapper: {
		position: 'relative',
	},
	badge: {
		position: 'absolute',
		top: -6,
		right: -8,
		zIndex: 10,
	},
	menuPillWrapper: {
		flex: 1,
	},
});

// ── TabBarRegistrar ──
// Receives tab bar props from Tabs, registers content into BottomBarStack, renders nothing.
const TabBarRegistrar = memo(
	({
		state,
		descriptors,
		navigation,
		menuBackgroundColor,
		activeTabBackgroundColor,
		hoverTabBackgroundColor,
		inactiveTabBackgroundColor,
		isDark,
	}: any) => {
		const { t } = useTranslation();

		useInitializeUploadStatus();
		const unuploadedCount = useUnuploadedCount();
		const menuItems = useMainMenuItems();
		const searchProvider = useGlobalSearchStore((s) => s.provider);
		const isSearchActive = useGlobalSearchStore((s) => s.isActive);
		const toggleSearch = useGlobalSearchStore((s) => s.toggleSearch);
		const requestSearch = useGlobalSearchStore((s) => s.requestSearch);

		// Icon-Namen für die Router-Tabs
		const tabIconNames: Record<string, string> = {
			index: 'mic-outline',
			memos: 'archive-outline',
		};

		// Build the tab bar content
		const tabBarContent = (
			<View style={[styles.container]}>
				{state.routes.map((route: any, index: number) => {
					const { options } = descriptors[route.key];
					const label = options.title || route.name;
					const isFocused = state.index === index;

					return (
						<TabPill
							key={route.key}
							label={label}
							iconName={tabIconNames[route.name] || 'ellipse-outline'}
							isActive={isFocused}
							isDark={isDark}
							activeBackgroundColor={activeTabBackgroundColor}
							hoverBackgroundColor={hoverTabBackgroundColor}
							inactiveBackgroundColor={inactiveTabBackgroundColor}
							onPress={() => {
								const event = navigation.emit({
									type: 'tabPress',
									target: route.key,
									canPreventDefault: true,
								});
								if (!isFocused && !event.defaultPrevented) {
									navigation.navigate(route.name);
								}
							}}
						/>
					);
				})}

				{/* Search-Pill */}
				<TabPill
					label={t('common.search', 'Suche')}
					iconName="search-outline"
					isActive={isSearchActive}
					isDark={isDark}
					activeBackgroundColor={activeTabBackgroundColor}
					hoverBackgroundColor={hoverTabBackgroundColor}
					inactiveBackgroundColor={inactiveTabBackgroundColor}
					onPress={() => {
						if (isSearchActive) {
							toggleSearch();
							return;
						}
						// Navigate to memos if not there, then activate search
						if (state.routes[state.index].name !== 'memos') {
							navigation.navigate('memos');
						}
						requestSearch();
					}}
				/>

				{/* Menu-Pill */}
				<CustomMenu items={menuItems} disableRotation style={styles.menuPillWrapper}>
					<TabPill
						label={t('menu.menu', 'Menu')}
						iconName="menu"
						isActive={false}
						isDark={isDark}
						activeBackgroundColor={activeTabBackgroundColor}
						hoverBackgroundColor={hoverTabBackgroundColor}
						inactiveBackgroundColor={inactiveTabBackgroundColor}
						badge={unuploadedCount}
						asView
					/>
				</CustomMenu>
			</View>
		);

		// Track the values that actually change the tab bar content
		const activeTabIndex = state.index;
		const hasSearchProvider = !!searchProvider;
		const contentKey = `${activeTabIndex}-${isDark}-${activeTabBackgroundColor}-${hoverTabBackgroundColor}-${inactiveTabBackgroundColor}-${unuploadedCount}-${hasSearchProvider}-${isSearchActive}`;
		const contentKeyRef = useRef(contentKey);

		// Register on mount, unregister on unmount
		useEffect(() => {
			useBottomBarStore.getState().registerBar({
				id: 'tab-bar',
				priority: -10, // Always at the very bottom
				collapsedIcon: 'apps-outline',
				collapsible: false,
				visible: true,
				content: tabBarContent,
			});

			return () => {
				useBottomBarStore.getState().unregisterBar('tab-bar');
			};
		}, []);

		// Update content only when meaningful values change
		useEffect(() => {
			if (contentKeyRef.current === contentKey) return;
			contentKeyRef.current = contentKey;

			const bars = useBottomBarStore.getState().bars;
			if (bars['tab-bar']) {
				useBottomBarStore.getState().updateBarContent('tab-bar', tabBarContent);
			}
		}, [contentKey]);

		// Render nothing - BottomBarStack renders the content
		return null;
	}
);

TabBarRegistrar.displayName = 'TabBarRegistrar';

// ── TabLayout ──
export default function TabLayout() {
	const { isDark, themeVariant } = useTheme();
	const { t } = useTranslation();

	const themeColors = useMemo(() => {
		const menuBackgroundColor = isDark
			? (colors.theme?.extend?.colors?.dark as any)?.[themeVariant]?.menuBackground
			: (colors.theme?.extend?.colors as any)?.[themeVariant]?.menuBackground;

		const activeTabBackgroundColor = isDark
			? (colors.theme?.extend?.colors?.dark as any)?.[themeVariant]?.contentBackgroundHover
			: (colors.theme?.extend?.colors as any)?.[themeVariant]?.contentBackgroundHover;

		const hoverTabBackgroundColor = activeTabBackgroundColor + '99';

		const inactiveTabBackgroundColor = isDark
			? (colors.theme?.extend?.colors?.dark as any)?.[themeVariant]?.contentBackground
			: (colors.theme?.extend?.colors as any)?.[themeVariant]?.contentBackground;

		return {
			menuBackgroundColor,
			activeTabBackgroundColor,
			hoverTabBackgroundColor,
			inactiveTabBackgroundColor,
		};
	}, [isDark, themeVariant]);

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarHideOnKeyboard: true,
				animation: 'none',
				tabBarStyle: {
					display: 'none', // Hidden - rendered via BottomBarStack
				},
				sceneContainerStyle: {
					flex: 1,
					backgroundColor: 'transparent',
				},
				contentStyle: { backgroundColor: 'transparent' },
			}}
			tabBar={(props) => (
				<TabBarRegistrar
					{...props}
					menuBackgroundColor={themeColors.menuBackgroundColor}
					activeTabBackgroundColor={themeColors.activeTabBackgroundColor}
					hoverTabBackgroundColor={themeColors.hoverTabBackgroundColor}
					inactiveTabBackgroundColor={themeColors.inactiveTabBackgroundColor}
					isDark={isDark}
				/>
			)}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: t('tabs.record', 'Record'),
					tabBarIcon: ({ color, focused, size }) => (
						<TabBarIcon name="mic-outline" color={color} focused={focused} size={size} />
					),
					headerRight: () => (
						<Link href="/(protected)/settings" asChild>
							<HeaderButton />
						</Link>
					),
				}}
			/>
			<Tabs.Screen
				name="memos"
				options={{
					title: t('tabs.memos', 'Memos'),
					tabBarIcon: ({ color, focused, size }) => (
						<TabBarIcon name="archive-outline" color={color} focused={focused} size={size} />
					),
				}}
			/>
		</Tabs>
	);
}
