import React, { forwardRef } from 'react';
import { View, Pressable, Image, Animated, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedView';
import { useTheme } from '~/utils/ThemeContext';

interface HeaderProps {
	title?: string;
	scrollY?: Animated.Value;
	onPress?: () => void;
	standalone?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, scrollY, onPress, standalone = false }) => {
	const { theme } = useTheme();

	// Animation für die Header-Elemente
	const headerOpacity = scrollY
		? scrollY.interpolate({
				inputRange: [0, 50],
				outputRange: [1, 0],
				extrapolate: 'clamp',
			})
		: new Animated.Value(1);

	const headerTranslateY = scrollY
		? scrollY.interpolate({
				inputRange: [0, 50],
				outputRange: [0, -50],
				extrapolate: 'clamp',
			})
		: new Animated.Value(0);

	// If standalone is true, return just the settings button (for use in tab headers)
	if (standalone) {
		return (
			<Pressable onPress={onPress}>
				{({ pressed }) => (
					<FontAwesome
						name="cog"
						size={25}
						color={theme.colors.text}
						style={{
							marginRight: 15,
							opacity: pressed ? 0.5 : 1,
						}}
					/>
				)}
			</Pressable>
		);
	}

	// Otherwise return the full header with title and app icon
	return (
		<Animated.View
			style={[
				styles.headerContainer,
				{
					opacity: headerOpacity,
					transform: [{ translateY: headerTranslateY }],
				},
			]}
		>
			<View style={styles.leftSection}>
				<Image source={require('../assets/icon.png')} style={styles.appIcon} resizeMode="contain" />
				<ThemedText style={styles.title}>{title}</ThemedText>
			</View>

			<View style={styles.rightSection}>
				<Pressable
					style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
					onPress={() => router.push('/subscription')}
				>
					{({ pressed }) => (
						<Ionicons
							name="diamond"
							size={24}
							color={theme.colors.primary}
							style={{ opacity: pressed ? 0.7 : 1 }}
						/>
					)}
				</Pressable>

				<Pressable
					style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}
					onPress={onPress || (() => router.push('/settings'))}
				>
					{({ pressed }) => (
						<FontAwesome
							name="gear"
							size={24}
							color={theme.colors.text}
							style={{ opacity: pressed ? 0.3 : 0.5 }}
						/>
					)}
				</Pressable>
			</View>
		</Animated.View>
	);
};

// Definiere Styles außerhalb der Komponente für bessere Performance
const styles = StyleSheet.create({
	headerContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 18,
		paddingVertical: 10,
		width: '100%',
		position: 'absolute',
		top: 10,
		zIndex: 100,
		height: 52,
	},
	leftSection: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	rightSection: {
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 10,
	},
	appIcon: {
		width: 24,
		height: 24,
		marginRight: 10,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	iconButton: {
		width: 38,
		height: 38,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 10,
	},
});
