import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Keyboard, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useBottomBarStore } from '../store/bottomBarStore';
import BottomBarSlot from './BottomBarSlot';

export default function BottomBarStack() {
	const insets = useSafeAreaInsets();
	const { isDark } = useTheme();
	const bars = useBottomBarStore((s) => s.bars);
	// Subscribe to contentVersion to re-render when content changes
	const _contentVersion = useBottomBarStore((s) => s.contentVersion);

	const [keyboardHeight, setKeyboardHeight] = useState(0);

	// Listen for keyboard events
	useEffect(() => {
		const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
		const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

		const showSub = Keyboard.addListener(showEvent, (e) => {
			setKeyboardHeight(e.endCoordinates.height);
		});
		const hideSub = Keyboard.addListener(hideEvent, () => {
			setKeyboardHeight(0);
		});

		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	// Sort bars by priority descending so lowest priority (e.g. tab-bar at -10)
	// renders last in the column, placing it closest to the bottom screen edge.
	const sortedBars = useMemo(() => {
		return Object.values(bars)
			.filter((bar) => bar.visible !== false)
			.sort((a, b) => b.priority - a.priority);
	}, [bars, _contentVersion]);

	if (sortedBars.length === 0) return null;

	// Check if any visible bar wants to dodge the keyboard
	const hasDodgeBar =
		keyboardHeight > 0 && sortedBars.some((bar) => bar.keyboardBehavior === 'dodge');

	// When a dodge bar exists and keyboard is open, shift the entire container up.
	// Individual bars with 'hide' are collapsed to zero height.
	const containerBottom = hasDodgeBar ? keyboardHeight - insets.bottom : 0;

	const getBarStyle = (bar: (typeof sortedBars)[0]) => {
		if (keyboardHeight > 0 && bar.keyboardBehavior === 'hide') {
			return { height: 0, overflow: 'hidden' as const };
		}
		return {};
	};

	const gradientColors = isDark
		? (['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)'] as const)
		: (['transparent', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.95)'] as const);

	return (
		<View
			style={[styles.container, { bottom: containerBottom, paddingBottom: insets.bottom }]}
			pointerEvents="box-none"
		>
			<LinearGradient
				colors={gradientColors}
				style={StyleSheet.absoluteFill}
				pointerEvents="none"
			/>
			{sortedBars.map((bar) => (
				<View key={bar.id} style={getBarStyle(bar)} pointerEvents="box-none">
					<BottomBarSlot config={bar} />
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		left: 0,
		right: 0,
		zIndex: 1001,
		pointerEvents: 'box-none',
	},
});
