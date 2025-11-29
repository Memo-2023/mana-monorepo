import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	interpolate,
} from 'react-native-reanimated';

interface PhotoButtonProps {
	onPress: () => void;
	disabled?: boolean;
	isCapturing?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const PhotoButton: React.FC<PhotoButtonProps> = ({
	onPress,
	disabled = false,
	isCapturing = false,
}) => {
	const pressed = useSharedValue(false);

	const animatedStyle = useAnimatedStyle(() => {
		const scale = interpolate(pressed.value ? 1 : 0, [0, 1], [1, 0.9]);

		return {
			transform: [{ scale: withSpring(scale) }],
		};
	});

	const handlePressIn = () => {
		if (!disabled) {
			pressed.value = true;
		}
	};

	const handlePressOut = () => {
		pressed.value = false;
	};

	return (
		<AnimatedTouchableOpacity
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			disabled={disabled || isCapturing}
			activeOpacity={0.8}
			style={animatedStyle}
			className="items-center justify-center"
		>
			{/* Outer Ring */}
			<View
				className={`
        h-20 w-20 items-center justify-center rounded-full border-4
        ${disabled || isCapturing ? 'border-gray-400' : 'border-white'}
      `}
			>
				{/* Inner Circle */}
				<View
					className={`
          h-16 w-16 rounded-full
          ${disabled || isCapturing ? 'bg-gray-400' : 'bg-white'}
        `}
				>
					{isCapturing && (
						<View className="h-full w-full items-center justify-center rounded-full bg-red-500">
							<View className="h-8 w-8 rounded bg-white" />
						</View>
					)}
				</View>
			</View>

			{isCapturing && <Text className="mt-2 text-sm font-medium text-white">Capturing...</Text>}
		</AnimatedTouchableOpacity>
	);
};
