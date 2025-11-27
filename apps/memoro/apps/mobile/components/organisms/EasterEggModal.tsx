import React, { useEffect, useRef } from 'react';
import {
	Modal,
	View,
	StyleSheet,
	TouchableOpacity,
	Animated,
	Dimensions,
	Pressable,
} from 'react-native';
import Text from '~/components/atoms/Text';
import MemoroLogo from '~/components/atoms/MemoroLogo';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '~/tailwind.config.js';

interface EasterEggModalProps {
	isVisible: boolean;
	onClose: () => void;
	onLongPress: () => void;
}

const { width, height } = Dimensions.get('window');

export default function EasterEggModal({ isVisible, onClose, onLongPress }: EasterEggModalProps) {
	const { isDark, themeVariant } = useTheme();
	const { t } = useTranslation();
	const rotateAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (isVisible) {
			Animated.loop(
				Animated.timing(rotateAnim, {
					toValue: 1,
					duration: 3000,
					useNativeDriver: true,
				})
			).start();
		} else {
			rotateAnim.setValue(0);
		}
	}, [isVisible]);

	const themeColors = (colors as any).theme?.extend?.colors;
	const contentBgColor = isDark
		? themeColors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
		: themeColors?.[themeVariant]?.contentBackground || '#FFFFFF';
	const textColor = isDark ? '#FFFFFF' : '#000000';
	const subtextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';

	const spin = rotateAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '360deg'],
	});

	const styles = StyleSheet.create({
		modalOverlay: {
			flex: 1,
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			justifyContent: 'center',
			alignItems: 'center',
		},
		modalContent: {
			backgroundColor: contentBgColor,
			borderRadius: 20,
			padding: 32,
			alignItems: 'center',
			width: width * 0.85,
			maxWidth: 400,
			shadowColor: '#000',
			shadowOffset: {
				width: 0,
				height: 2,
			},
			shadowOpacity: 0.25,
			shadowRadius: 3.84,
			elevation: 5,
		},
		closeButton: {
			position: 'absolute',
			top: 16,
			right: 16,
			padding: 8,
		},
		logoContainer: {
			width: 120,
			height: 120,
			marginBottom: 24,
			justifyContent: 'center',
			alignItems: 'center',
		},
		title: {
			fontSize: 24,
			fontWeight: 'bold',
			color: textColor,
			marginBottom: 16,
			textAlign: 'center',
		},
		message: {
			fontSize: 16,
			color: subtextColor,
			textAlign: 'center',
			lineHeight: 24,
			marginBottom: 8,
		},
	});

	return (
		<Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={onClose}>
			<TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
				<Pressable
					style={styles.modalContent}
					onPress={(e) => e.stopPropagation()}
					onLongPress={onLongPress}
					delayLongPress={1000}
				>
					<TouchableOpacity onPress={onClose} style={styles.closeButton}>
						<MaterialIcons name="close" size={24} color={subtextColor} />
					</TouchableOpacity>

					<View style={styles.logoContainer}>
						<Animated.View
							style={{
								transform: [{ rotate: spin }],
							}}
						>
							<MemoroLogo size={100} color={isDark ? '#F7D44C' : '#F7D44C'} />
						</Animated.View>
					</View>

					<Text style={styles.title}>Memoro</Text>

					<Text style={styles.message}>
						{t('settings.easter_egg_message', 'Du hast das geheime Memoro Easter Egg gefunden!')}
					</Text>

					<Text style={styles.message}>
						{t(
							'settings.easter_egg_submessage',
							'Wir arbeiten hart daran, deine Gedanken und Ideen zu bewahren.'
						)}
					</Text>
				</Pressable>
			</TouchableOpacity>
		</Modal>
	);
}
