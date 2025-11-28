import React, { useEffect } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import Text from '~/components/Text';
import * as Haptics from 'expo-haptics';
import { useIsDarkMode } from '~/store/settingsStore';
import Animated, {
	FadeInDown,
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withTiming,
	interpolateColor,
} from 'react-native-reanimated';

interface Tab {
	key: string;
	label: string;
	count?: number;
}

interface TabSelectorProps {
	tabs: Tab[];
	activeTab: string;
	onTabChange: (tab: string) => void;
	animationDelay?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TabSelector({
	tabs,
	activeTab,
	onTabChange,
	animationDelay = 200,
}: TabSelectorProps) {
	const isDarkMode = useIsDarkMode();

	// Animation values for sliding indicator
	const activeIndex = tabs.findIndex((tab) => tab.key === activeTab);
	const translateX = useSharedValue(0);
	const indicatorWidth = useSharedValue(0);

	// Calculate tab width
	const containerPadding = 24 * 2; // px-6 on both sides
	const spacing = 8; // ml-2 between tabs
	const availableWidth = screenWidth - containerPadding - spacing * (tabs.length - 1);
	const tabWidth = availableWidth / tabs.length;

	useEffect(() => {
		// Calculate position including spacing
		const spacingOffset = activeIndex * spacing;
		const newPosition = activeIndex * tabWidth + spacingOffset;

		// Animate to new position with spring
		translateX.value = withSpring(newPosition, {
			damping: 20,
			stiffness: 200,
			mass: 0.8,
		});

		// Set width
		indicatorWidth.value = withSpring(tabWidth, {
			damping: 18,
			stiffness: 180,
		});
	}, [activeIndex, tabWidth]);

	const animatedIndicatorStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: translateX.value }],
			width: indicatorWidth.value,
		};
	});

	return (
		<Animated.View entering={FadeInDown.delay(animationDelay).duration(600)}>
			<View className="px-6 mb-6">
				<View className="relative">
					{/* Animated background indicator */}
					<Animated.View
						style={[
							{
								position: 'absolute',
								height: '100%',
								borderRadius: 999,
								backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
								zIndex: 0,
							},
							animatedIndicatorStyle,
						]}
					/>

					{/* Tab buttons */}
					<View className="flex-row">
						{tabs.map((tab, index) => {
							const isActive = activeTab === tab.key;

							// Individual tab animations
							const scale = useSharedValue(1);
							const backgroundOpacity = useSharedValue(isActive ? 0 : 1);
							const textOpacity = useSharedValue(1);

							useEffect(() => {
								backgroundOpacity.value = withTiming(isActive ? 0 : 1, { duration: 300 });
								textOpacity.value = withTiming(isActive ? 1 : 0.8, { duration: 300 });
							}, [isActive]);

							const animatedTabStyle = useAnimatedStyle(() => ({
								transform: [{ scale: scale.value }],
							}));

							const animatedBackgroundStyle = useAnimatedStyle(() => ({
								opacity: backgroundOpacity.value,
							}));

							const animatedTextContainerStyle = useAnimatedStyle(() => ({
								opacity: textOpacity.value,
							}));

							return (
								<Animated.View
									key={tab.key}
									className="flex-1"
									style={{
										marginLeft: index > 0 ? 8 : 0,
										zIndex: 1,
									}}
								>
									<AnimatedPressable
										onPressIn={() => {
											scale.value = withSpring(0.95);
										}}
										onPressOut={() => {
											scale.value = withSpring(1);
										}}
										onPress={() => {
											Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
											onTabChange(tab.key);
										}}
										className="py-3 rounded-full relative"
										style={animatedTabStyle}
									>
										{/* Tab background (hidden when active) */}
										<Animated.View
											className={`absolute inset-0 rounded-full ${
												isDarkMode ? 'bg-white/10' : 'bg-black/10'
											}`}
											style={animatedBackgroundStyle}
										/>

										{/* Tab content */}
										<Animated.View style={animatedTextContainerStyle}>
											<Text
												variant="body"
												color={isActive ? 'primary' : 'secondary'}
												weight="medium"
												className="text-center"
											>
												{tab.label}
												{tab.count !== undefined && ` (${tab.count})`}
											</Text>
										</Animated.View>
									</AnimatedPressable>
								</Animated.View>
							);
						})}
					</View>
				</View>
			</View>
		</Animated.View>
	);
}
