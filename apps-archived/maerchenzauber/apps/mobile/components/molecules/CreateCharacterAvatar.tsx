import React from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Text from '../atoms/Text';
import { Ionicons } from '@expo/vector-icons';

interface CreateCharacterAvatarProps {
	onPress: () => void;
	size?: number;
}

const CreateCharacterAvatar: React.FC<CreateCharacterAvatarProps> = ({ onPress, size = 100 }) => {
	const { width: windowWidth } = useWindowDimensions();
	const isTablet = windowWidth >= 768;

	// Responsive font sizes
	const nameFontSize = isTablet ? 28 : 18;
	const nameLineHeight = isTablet ? 34 : 24;

	const styles = StyleSheet.create({
		buttonText: {
			fontSize: 12,
			color: '#FFFFFF',
			marginTop: 4,
		},
		container: {
			alignItems: 'center',
		},
		avatarContainer: {
			width: size,
			height: size,
			borderRadius: size / 2,
			backgroundColor: '#2C2C2C',
			alignItems: 'center',
			justifyContent: 'center',
			marginBottom: 8,
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
		name: {
			fontWeight: 'bold',
			color: '#FFFFFF',
			textAlign: 'center',
			letterSpacing: 0.3,
		},
		pressed: {
			opacity: 0.7,
		},
	});

	return (
		<View style={styles.container}>
			<Pressable
				onPress={onPress}
				style={({ pressed }) => [styles.avatarContainer, pressed && styles.pressed]}
			>
				<Ionicons name="add" size={size * 0.4} color="#FFD700" />
			</Pressable>
			<Text style={[styles.name, { fontSize: nameFontSize, lineHeight: nameLineHeight }]}>Neu</Text>
		</View>
	);
};

export default CreateCharacterAvatar;
