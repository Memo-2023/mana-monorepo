import React from 'react';
import { View, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface LottieAnimationProps {
	source: any; // Lottie JSON file
	style?: ViewStyle;
	autoPlay?: boolean;
	loop?: boolean;
	speed?: number;
	onAnimationFinish?: () => void;
}

export function LottieAnimation({
	source,
	style,
	autoPlay = true,
	loop = true,
	speed = 1,
	onAnimationFinish,
}: LottieAnimationProps) {
	return (
		<View style={[{ width: 200, height: 200 }, style]}>
			<LottieView
				source={source}
				autoPlay={autoPlay}
				loop={loop}
				speed={speed}
				style={{ flex: 1 }}
				onAnimationFinish={onAnimationFinish}
			/>
		</View>
	);
}
