import React from 'react';
import { View, StyleSheet, Pressable, Dimensions, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../atoms/Text';
import { useDebugBorders } from '../../hooks/useDebugBorders';
import Icon from '../atoms/Icon';

interface CreateStoryCardProps {
	onPress: () => void;
	width?: number;
	height?: number;
}

const ASPECT_RATIO = 1.5; // 3:2 aspect ratio (height = width * 1.5)
const DEFAULT_WIDTH = 240; // Default width if none provided

const CreateStoryCard: React.FC<CreateStoryCardProps> = ({
	onPress,
	width = DEFAULT_WIDTH,
	height,
}) => {
	const containerDebug = useDebugBorders('#FF0000');
	const gradientDebug = useDebugBorders('#00FF00');
	const contentDebug = useDebugBorders('#0000FF');
	const iconDebug = useDebugBorders('#FF00FF');
	const cardHeight = height || width * ASPECT_RATIO;
	const { width: windowWidth } = useWindowDimensions();
	const isTablet = windowWidth >= 768;

	// Responsive font sizes
	const titleFontSize = isTablet ? 30 : 20;
	const titleLineHeight = isTablet ? 36 : 26;

	const dynamicStyles = StyleSheet.create({
		container: {
			width,
			height: cardHeight,
			backgroundColor: '#2C2C2C',
			borderRadius: 12,
			overflow: 'hidden',
			shadowColor: '#000',
			shadowOffset: {
				width: 4,
				height: 4,
			},
			shadowOpacity: 0.3,
			shadowRadius: 5,
			elevation: 8,
		},
		pressed: {
			opacity: 0.7,
		},
	});

	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [dynamicStyles.container, pressed && dynamicStyles.pressed]}
		>
			<LinearGradient
				colors={['#2C2C2C', '#1C1C1C']}
				style={[styles.gradient, gradientDebug]}
				start={{ x: 0, y: 0 }}
				end={{ x: 0, y: 1 }}
				locations={[0, 1]}
			>
				<View style={[styles.content, contentDebug]}>
					<Icon set="ionicons" name="add-circle-outline" size={width * 0.2} color="#FFD700" />
					<Text
						variant="subheader"
						color="#FFFFFF"
						style={[styles.title, { fontSize: titleFontSize, lineHeight: titleLineHeight }]}
					>
						Neue Geschichte erstellen
					</Text>
				</View>
			</LinearGradient>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	gradient: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	content: {
		alignItems: 'center',
		padding: 16,
	},
	title: {
		marginTop: 16,
		textAlign: 'center',
		fontWeight: 'bold',
		letterSpacing: 0.3,
	},
});

export default CreateStoryCard;
