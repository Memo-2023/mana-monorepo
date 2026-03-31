import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	Easing,
	runOnJS,
} from 'react-native-reanimated';
import Icon from '~/components/atoms/Icon';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useBottomBarStore } from '../store/bottomBarStore';
import type { BottomBarConfig } from '../types';

const COLLAPSED_ICON_SIZE = 48;
const SCREEN_WIDTH = Dimensions.get('window').width;
const ANIMATION_DURATION = 300;

interface BottomBarSlotProps {
	config: BottomBarConfig;
}

export default function BottomBarSlot({ config }: BottomBarSlotProps) {
	const { isDark } = useTheme();
	const collapsedIds = useBottomBarStore((s) => s.collapsedIds);
	const toggleCollapse = useBottomBarStore((s) => s.toggleCollapse);
	const setBarHeight = useBottomBarStore((s) => s.setBarHeight);

	const isCollapsed = collapsedIds.has(config.id);
	const canCollapse = config.collapsible !== false;

	const translateX = useSharedValue(isCollapsed ? SCREEN_WIDTH : 0);

	// Animate when collapse state changes
	React.useEffect(() => {
		translateX.value = withTiming(isCollapsed ? SCREEN_WIDTH : 0, {
			duration: ANIMATION_DURATION,
			easing: Easing.out(Easing.cubic),
		});
	}, [isCollapsed]);

	const contentAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	const handleLayout = useCallback(
		(e: any) => {
			const height = e.nativeEvent.layout.height;
			setBarHeight(config.id, height);
		},
		[config.id, setBarHeight]
	);

	const handleToggle = useCallback(() => {
		toggleCollapse(config.id);
	}, [config.id, toggleCollapse]);

	if (config.visible === false) return null;

	return (
		<View onLayout={handleLayout}>
			<Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
				{/* Collapse button on the left */}
				{canCollapse && !isCollapsed && (
					<Pressable onPress={handleToggle} style={styles.collapseButton} hitSlop={8}>
						<Icon
							name="chevron-forward"
							size={14}
							color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}
						/>
					</Pressable>
				)}

				{/* Bar content */}
				<View style={styles.barContent}>{config.content}</View>

				{/* Collapsed icon overlay (shown when collapsed, positioned at the start of the translated view) */}
				{isCollapsed && (
					<Pressable
						onPress={handleToggle}
						style={[
							styles.collapsedIconButton,
							{
								backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
								// Position at the left edge (which is now at the right of screen due to translateX)
								position: 'absolute',
								left: -COLLAPSED_ICON_SIZE - 8,
								top: 0,
								bottom: 0,
								justifyContent: 'center',
							},
						]}
					>
						<Icon name={config.collapsedIcon} size={22} color={isDark ? '#FFFFFF' : '#000000'} />
					</Pressable>
				)}
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	contentContainer: {
		flexDirection: 'row',
		alignItems: 'stretch',
		position: 'relative',
	},
	collapseButton: {
		width: 20,
		justifyContent: 'center',
		alignItems: 'center',
		borderTopRightRadius: 0,
		borderBottomRightRadius: 0,
	},
	barContent: {
		flex: 1,
	},
	collapsedIconButton: {
		width: COLLAPSED_ICON_SIZE,
		height: COLLAPSED_ICON_SIZE,
		borderRadius: COLLAPSED_ICON_SIZE / 2,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
