import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withRepeat,
	withSequence,
	Easing,
	SharedValue,
	interpolate,
} from 'react-native-reanimated';

const BAR_COUNT = 32;
const BAR_WIDTH = 5;
const GAP_FROM_BUTTON = 8;
const MIN_BAR_HEIGHT = 5;
const MAX_BAR_HEIGHT_IDLE = 14;
const MAX_BAR_HEIGHT_ACTIVE = 36;

interface RadialWaveformProps {
	/** Button diameter — waveform starts at the button edge */
	size: number;
	/** Whether recording is active */
	isActive: boolean;
	/** Whether recording is paused */
	isPaused: boolean;
	/** Current audio level (0-1 normalized) */
	audioLevel: number;
	/** Primary theme color for idle state */
	themeColor: string;
	/** Whether dark mode is active */
	isDark: boolean;
}

/**
 * Static seed pattern for idle state — gives each bar a unique base height.
 */
const IDLE_PATTERN = Array.from({ length: BAR_COUNT }, (_, i) => {
	return 0.3 + 0.5 * Math.abs(Math.sin(i * 2.7 + 0.5));
});

/**
 * RadialWaveform renders bars radiating outward from a circular button.
 *
 * Each bar is a "spoke" — a container View rotated around the button center,
 * with the actual bar inside growing outward from the button edge.
 *
 * - Idle: subtle gray bars with gentle breathing
 * - Recording: colored bars driven by metering history
 * - Paused: frozen bars at reduced opacity
 */
function RadialWaveform({
	size,
	isActive,
	isPaused,
	audioLevel,
	themeColor,
	isDark,
}: RadialWaveformProps) {
	// Spoke length: from center to max bar tip
	const spokeLength = size / 2 + GAP_FROM_BUTTON + MAX_BAR_HEIGHT_ACTIVE;
	// Where the bar base sits inside the spoke (measured from spoke bottom = center)
	const barBottomOffset = size / 2 + GAP_FROM_BUTTON;

	// Breathing animation for idle state
	const breathAnim = useSharedValue(0);

	useEffect(() => {
		if (!isActive) {
			breathAnim.value = withRepeat(
				withSequence(
					withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
					withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
				),
				-1,
				false
			);
		} else {
			breathAnim.value = withTiming(0, { duration: 300 });
		}
	}, [isActive, breathAnim]);

	// Waveform history — single shared value with array of levels
	const barLevels = useSharedValue<number[]>(new Array(BAR_COUNT).fill(0));
	const historyIndexRef = useRef(0);

	// Push new audio level into the ring buffer
	useEffect(() => {
		if (isActive && !isPaused) {
			const idx = historyIndexRef.current;
			const newLevels = [...barLevels.value];
			newLevels[idx] = audioLevel;
			barLevels.value = newLevels;
			historyIndexRef.current = (idx + 1) % BAR_COUNT;
		} else if (!isActive && historyIndexRef.current > 0) {
			// Reset all bars when recording stops
			barLevels.value = new Array(BAR_COUNT).fill(0);
			historyIndexRef.current = 0;
		}
	}, [audioLevel, isActive, isPaused, barLevels]);

	// Pre-compute bar angles
	const barAngles = useMemo(() => {
		return Array.from({ length: BAR_COUNT }, (_, i) => {
			const angle = (i * 360) / BAR_COUNT - 90; // Start from top
			return angle;
		});
	}, []);

	// Container size
	const containerSize = spokeLength * 2;

	return (
		<View
			style={[styles.container, { width: containerSize, height: containerSize }]}
			pointerEvents="none"
		>
			{barAngles.map((angleDeg, index) => (
				<WaveformBar
					key={index}
					index={index}
					angleDeg={angleDeg}
					spokeLength={spokeLength}
					barBottomOffset={barBottomOffset}
					containerSize={containerSize}
					isActive={isActive}
					isPaused={isPaused}
					barLevels={barLevels}
					breathAnim={breathAnim}
					idleHeight={IDLE_PATTERN[index]}
					isDark={isDark}
				/>
			))}
		</View>
	);
}

interface WaveformBarProps {
	index: number;
	angleDeg: number;
	spokeLength: number;
	barBottomOffset: number;
	containerSize: number;
	isActive: boolean;
	isPaused: boolean;
	barLevels: SharedValue<number[]>;
	breathAnim: SharedValue<number>;
	idleHeight: number;
	isDark: boolean;
}

/**
 * A single bar in the radial waveform.
 *
 * Rendering strategy:
 * - A spoke View is positioned at the container center, pointing upward
 * - Rotated by angleDeg around its bottom-center (= circle center)
 * - The bar inside the spoke is positioned at barOffset from the top
 * - Bar height animates based on audio level or breathing
 */
const WaveformBar = React.memo(function WaveformBar({
	index,
	angleDeg,
	spokeLength,
	barBottomOffset,
	containerSize,
	isActive,
	isPaused,
	barLevels,
	breathAnim,
	idleHeight,
	isDark,
}: WaveformBarProps) {
	// The bar style — only this animates
	const barStyle = useAnimatedStyle(() => {
		let height: number;
		let backgroundColor: string;
		let opacity: number;

		if (isActive) {
			const level = barLevels.value[index] ?? 0;
			height = MIN_BAR_HEIGHT + level * (MAX_BAR_HEIGHT_ACTIVE - MIN_BAR_HEIGHT);

			// Color based on level
			if (level >= 0.3) {
				backgroundColor = '#10B981'; // green
			} else if (level >= 0.1) {
				backgroundColor = '#F59E0B'; // amber
			} else {
				backgroundColor = '#EF4444'; // red
			}

			opacity = isPaused ? 0.25 : interpolate(level, [0, 1], [0.2, 0.85]);
		} else {
			// Idle: breathing animation
			const breath = breathAnim.value;
			const scale = 1 + breath * 0.3;
			height = MIN_BAR_HEIGHT + idleHeight * (MAX_BAR_HEIGHT_IDLE - MIN_BAR_HEIGHT) * scale;
			backgroundColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)';
			opacity = 1;
		}

		return {
			height,
			backgroundColor,
			opacity,
		};
	});

	// Spoke wrapper — static positioning + rotation
	const spokeStyle = useMemo(
		() => ({
			position: 'absolute' as const,
			left: containerSize / 2 - BAR_WIDTH / 2,
			bottom: containerSize / 2,
			width: BAR_WIDTH,
			height: spokeLength,
			transform: [{ rotate: `${angleDeg}deg` }],
			transformOrigin: 'center bottom' as const,
		}),
		[containerSize, spokeLength, angleDeg]
	);

	return (
		<View style={spokeStyle}>
			{/* Bar grows outward (upward in the spoke, from button edge toward tip) */}
			<Animated.View
				style={[
					{
						position: 'absolute',
						bottom: barBottomOffset,
						width: BAR_WIDTH,
						borderRadius: BAR_WIDTH / 2,
					},
					barStyle,
				]}
			/>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
	},
});

export default React.memo(RadialWaveform);
