import { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Pressable, ViewStyle, PlatformColor } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiquidGlassView } from '@callstack/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	interpolate,
} from 'react-native-reanimated';
import { useTheme } from '~/contexts/ThemeContext';
import { Text } from './Text';
import { Tag } from '~/store/tagStore';

type FilterBarProps = {
	isMinimized?: boolean;
	scrollY?: number;
	filterMode: 'all' | 'favorites';
	onFilterModeChange: (mode: 'all' | 'favorites') => void;
	tags: Tag[];
	selectedTags: string[];
	onToggleTag: (tagId: string) => void;
	onClearFilters: () => void;
	generateBarExpanded?: boolean;
};

export function FilterBar({
	isMinimized: externalIsMinimized = false,
	scrollY = 0,
	filterMode,
	onFilterModeChange,
	tags,
	selectedTags,
	onToggleTag,
	onClearFilters,
	generateBarExpanded = false,
}: FilterBarProps) {
	const insets = useSafeAreaInsets();
	const { theme } = useTheme();
	const [manuallyExpanded, setManuallyExpanded] = useState(false);
	const lastScrollY = useRef(0);

	// Track scroll changes and close if scrolling while manually opened
	useEffect(() => {
		const scrollDiff = Math.abs(scrollY - lastScrollY.current);

		// If user scrolls more than 20px, close the bar
		if (scrollDiff > 20 && manuallyExpanded) {
			setManuallyExpanded(false);
		}

		lastScrollY.current = scrollY;
	}, [scrollY]);

	// Determine if bar should be minimized - always stay minimized unless manually expanded
	const isMinimized = !manuallyExpanded;

	// Animation value: 0 = FAB, 1 = full bar
	const animationProgress = useSharedValue(0);

	// Shared value for generate bar expanded state - starts at 0
	const generateBarExpandedShared = useSharedValue(0);

	// Animate when minimized state changes
	useEffect(() => {
		animationProgress.value = withTiming(isMinimized ? 0 : 1, {
			duration: 300,
		});
	}, [isMinimized]);

	// Update shared value when generateBarExpanded changes
	useEffect(() => {
		console.log('FilterBar: generateBarExpanded changed to', generateBarExpanded);
		generateBarExpandedShared.value = withTiming(generateBarExpanded ? 1 : 0, {
			duration: 300,
		});
	}, [generateBarExpanded]);

	const hasActiveFilters = filterMode === 'favorites' || selectedTags.length > 0;

	return (
		<Animated.View
			style={[
				{
					position: 'absolute',
					left: 24,
					right: 24,
					zIndex: 2,
				},
				useAnimatedStyle(() => {
					const baseBottom = interpolate(
						animationProgress.value,
						[0, 1],
						[insets.bottom + 122, insets.bottom + 129] // Lower when minimized (FAB), higher when expanded (bar)
					);

					// Move up 4px when generate bar is expanded
					const offset = generateBarExpandedShared.value * 4;

					return {
						bottom: baseBottom + offset,
					};
				}),
			]}
		>
			<Pressable
				onPress={() => {
					if (isMinimized) {
						setManuallyExpanded(true);
					}
				}}
				disabled={!isMinimized}
			>
				<Animated.View
					style={[
						{
							overflow: 'hidden',
						},
						useAnimatedStyle(() => {
							// FAB size: 52x52
							const width = interpolate(
								animationProgress.value,
								[0, 1],
								[52, 400] // FAB width to full bar width
							);
							const height = interpolate(
								animationProgress.value,
								[0, 1],
								[52, 60] // FAB height to bar height
							);
							const borderRadius = interpolate(
								animationProgress.value,
								[0, 1],
								[26, 999] // FAB round to bar round
							);

							return {
								width: animationProgress.value === 1 ? '100%' : width,
								height,
								borderRadius,
								...theme.shadows.lg,
							};
						}),
					]}
				>
					{/* FAB Icon - only visible when minimized */}
					<Animated.View
						style={[
							{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								borderRadius: 26,
								overflow: 'hidden',
							},
							useAnimatedStyle(() => ({
								opacity: interpolate(animationProgress.value, [0, 0.3], [1, 0]),
								transform: [
									{
										scale: interpolate(animationProgress.value, [0, 0.3], [1, 0.8]),
									},
								],
							})),
						]}
						pointerEvents={isMinimized ? 'auto' : 'none'}
					>
						<LiquidGlassView
							effect="regular"
							interactive={true}
							colorScheme="system"
							style={{
								flex: 1,
								justifyContent: 'center',
								alignItems: 'center',
								borderRadius: 26,
								overflow: 'hidden',
							}}
						>
							<View>
								<Ionicons name="filter" size={20} color={PlatformColor('labelColor')} />
								{hasActiveFilters && (
									<View
										style={{
											position: 'absolute',
											top: -4,
											right: -4,
											width: 12,
											height: 12,
											borderRadius: 6,
											backgroundColor: theme.colors.primary.default,
										}}
									/>
								)}
							</View>
						</LiquidGlassView>
					</Animated.View>

					{/* Full Bar Content - only visible when not minimized */}
					<Animated.View
						style={[
							{
								width: '100%',
							},
							useAnimatedStyle(() => ({
								opacity: interpolate(animationProgress.value, [0.7, 1], [0, 1]),
							})),
						]}
						pointerEvents={isMinimized ? 'none' : 'auto'}
					>
						<LiquidGlassView
							effect="regular"
							interactive={true}
							colorScheme="system"
							style={{ borderRadius: 999, overflow: 'hidden', width: '100%' }}
						>
							<View
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									paddingVertical: 8,
									paddingHorizontal: 12,
								}}
							>
								{/* Favorites Pill */}
								<Pressable
									onPress={() =>
										onFilterModeChange(filterMode === 'favorites' ? 'all' : 'favorites')
									}
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										paddingHorizontal: 16,
										paddingVertical: 8,
										borderRadius: 999,
										borderWidth: 2,
										borderColor:
											filterMode === 'favorites'
												? theme.colors.primary.default
												: PlatformColor('separatorColor'),
										backgroundColor:
											filterMode === 'favorites' ? theme.colors.primary.default : 'transparent',
										marginRight: 8,
									}}
								>
									<Ionicons
										name={filterMode === 'favorites' ? 'heart' : 'heart-outline'}
										size={16}
										color={filterMode === 'favorites' ? 'white' : PlatformColor('labelColor')}
										style={{ marginRight: 6 }}
									/>
									<Text
										style={{
											color: filterMode === 'favorites' ? 'white' : PlatformColor('labelColor'),
											fontSize: 14,
											fontWeight: '600',
										}}
									>
										Favoriten
									</Text>
								</Pressable>

								{/* Tags Pills - Horizontal Scrollable */}
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={{ paddingRight: 8 }}
									style={{ flex: 1 }}
								>
									{tags.map((tag) => {
										const isSelected = selectedTags.includes(tag.id);
										return (
											<Pressable
												key={tag.id}
												onPress={() => onToggleTag(tag.id)}
												style={{
													flexDirection: 'row',
													alignItems: 'center',
													paddingHorizontal: 16,
													paddingVertical: 8,
													borderRadius: 999,
													borderWidth: 2,
													borderColor: isSelected
														? theme.colors.primary.default
														: PlatformColor('separatorColor'),
													backgroundColor: isSelected
														? theme.colors.primary.default
														: 'transparent',
													marginRight: 8,
												}}
											>
												<Text
													style={{
														color: isSelected ? 'white' : PlatformColor('labelColor'),
														fontSize: 14,
														fontWeight: '600',
													}}
												>
													{tag.name}
												</Text>
											</Pressable>
										);
									})}
								</ScrollView>

								{/* Clear Filters Button */}
								{hasActiveFilters && (
									<Pressable
										onPress={onClearFilters}
										style={{
											paddingHorizontal: 8,
											paddingVertical: 8,
										}}
									>
										<Ionicons name="close-circle" size={24} color={PlatformColor('labelColor')} />
									</Pressable>
								)}

								{/* Tags Management Button */}
								<Pressable
									onPress={() => router.push('/tags')}
									style={{
										paddingHorizontal: 12,
										paddingVertical: 8,
									}}
								>
									<Ionicons name="pricetag-outline" size={24} color={PlatformColor('labelColor')} />
								</Pressable>
							</View>
						</LiquidGlassView>
					</Animated.View>
				</Animated.View>
			</Pressable>
		</Animated.View>
	);
}
