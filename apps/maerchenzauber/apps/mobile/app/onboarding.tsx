import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	StyleSheet,
	Dimensions,
	Image,
	ScrollView,
	TouchableOpacity,
	Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Text from '../components/atoms/Text';
import Button from '../components/atoms/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePostHog } from '../src/hooks/usePostHog';

const { width, height } = Dimensions.get('window');

const features = [
	{
		id: 1,
		title: 'Zauberhafte Charaktere',
		description:
			'Erwecke deine Fantasie zum Leben! Lade ein Foto hoch oder beschreibe deinen Wunschcharakter und sieh zu, wie er magisch zum Leben erwacht.',
		icon: 'pets',
		color: '#6D5B00',
	},
	{
		id: 2,
		title: 'Magische Geschichten',
		description:
			'Erschaffe wundervolle Abenteuer mit deinen Charakteren! Jede Geschichte wird zu einem einzigartigen Erlebnis voller Magie und Fantasie.',
		icon: 'book',
		color: '#6D5B00',
	},
	{
		id: 3,
		title: 'Deine Ideen zählen',
		description:
			'Teile deine Gedanken und Wünsche mit uns! Dein Feedback hilft uns, Märchenzauber noch magischer zu gestalten.',
		icon: 'star',
		color: '#6D5B00',
	},
];

export default function OnboardingScreen() {
	const insets = useSafeAreaInsets();
	const posthog = usePostHog();
	const startTime = useRef(new Date());
	const fadeAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		posthog?.capture('onboarding_started');

		// Fade in animation
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 800,
			useNativeDriver: true,
		}).start();

		return () => {
			const duration = (new Date().getTime() - startTime.current.getTime()) / 1000;
			posthog?.capture('onboarding_ended', {
				total_time: duration,
				completed: true,
			});
		};
	}, []);

	const handleFinish = async () => {
		try {
			posthog?.capture('onboarding_completed', {
				total_time: (new Date().getTime() - startTime.current.getTime()) / 1000,
			});
			await AsyncStorage.setItem('hasSeenOnboarding', 'true');
			router.replace('/');
		} catch (error) {
			console.error('Error saving onboarding state:', error);
			router.replace('/');
		}
	};

	return (
		<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
			<Animated.View style={[styles.content, { opacity: fadeAnim }]}>
				<View style={styles.header}>
					<Image
						source={require('../assets/images/icon.png')}
						style={styles.logo}
						resizeMode="contain"
					/>
					<Text style={styles.welcomeTitle}>Willkommen bei Märchenzauber</Text>
				</View>

				<ScrollView
					style={styles.featuresScrollView}
					contentContainerStyle={styles.featuresScrollContent}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.featuresContainer}>
						{features.map((feature) => (
							<View key={feature.id} style={styles.featureWrapper}>
								<View style={styles.featureButton}>
									<View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
										<MaterialIcons name={feature.icon as any} size={24} color="white" />
									</View>
									<View style={styles.featureTextContainer}>
										<Text style={styles.featureTitle}>{feature.title}</Text>
										<Text style={styles.featureDescription}>{feature.description}</Text>
									</View>
								</View>
							</View>
						))}
					</View>
				</ScrollView>

				<View style={styles.buttonContainer}>
					<Button
						title="Los geht's!"
						onPress={handleFinish}
						color="#6D5B00"
						iconName="arrow-forward"
						iconPosition="right"
						variant="primary"
						size="lg"
						style={styles.button}
					/>
				</View>
			</Animated.View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#181818',
	},
	featuresScrollView: {
		flex: 1,
		marginBottom: 16,
	},
	featuresScrollContent: {
		flexGrow: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	header: {
		alignItems: 'center',
		marginBottom: 24,
	},
	logo: {
		width: 60,
		height: 60,
		marginBottom: 16,
		alignSelf: 'center',
	},
	welcomeTitle: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#FFFFFF',
		textAlign: 'center',
		marginBottom: 8,
	},
	welcomeSubtitle: {
		fontSize: 16,
		color: '#CCCCCC',
		textAlign: 'center',
		paddingHorizontal: 20,
	},
	featuresContainer: {
		marginBottom: 24,
		width: '100%',
		maxWidth: 600,
		alignSelf: 'center',
	},
	featuresTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: '#FFFFFF',
		marginBottom: 16,
		textAlign: 'left',
	},
	featureWrapper: {
		marginBottom: 16,
		borderRadius: 12,
		overflow: 'hidden',
	},
	featureButton: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		padding: 14,
		borderRadius: 12,
		backgroundColor: '#2a2a2a',
	},
	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 14,
	},
	featureTextContainer: {
		flex: 1,
	},
	featureTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFFFFF',
		marginBottom: 4,
		textAlign: 'left',
	},
	featureDescription: {
		fontSize: 14,
		color: '#CCCCCC',
		lineHeight: 20,
		textAlign: 'left',
	},
	buttonContainer: {
		alignItems: 'center',
		marginTop: 'auto',
		paddingVertical: 16,
	},
	button: {
		width: '100%',
	},
});
