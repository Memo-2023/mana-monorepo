import Slider from '@react-native-community/slider';
import * as Brightness from 'expo-brightness';
import { useKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
import { Pressable, View, Text } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	Easing,
} from 'react-native-reanimated';

import { AnimatedMoodBackground } from '@/components/AnimatedMoodBackground';
import { Icon } from '@/components/Icon';
import { useFlashlight } from '@/hooks/useFlashlight';
import { useStore } from '@/store/store';

export default function SequencePlayer() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const sequences = useStore((state) => state.sequences);
	const moods = useStore((state) => state.moods);
	const settings = useStore((state) => state.settings);
	const updateSettings = useStore((state) => state.updateSettings);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [remainingTime, setRemainingTime] = useState<number>(0);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [localBrightness, setLocalBrightness] = useState(settings.brightness);

	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const transitionOpacity = useSharedValue(1);

	useKeepAwake();

	const sequence = sequences.find((s) => s.id === id);
	const currentItem = sequence?.items[currentIndex];
	const currentMood = currentItem ? moods.find((m) => m.id === currentItem.moodId) : null;
	const nextItem = sequence?.items[currentIndex + 1];
	const nextMood = nextItem ? moods.find((m) => m.id === nextItem.moodId) : null;

	// Flashlight Hook mit Helligkeitssteuerung
	useFlashlight({
		enabled: settings.flashlightEnabled && !!currentMood && !isTransitioning,
		animationType: currentMood?.animationType || 'gradient',
		animationSpeed: settings.animationSpeed,
		brightness: settings.flashlightBrightness,
	});

	// Helligkeit setzen
	useEffect(() => {
		const setBrightness = async () => {
			try {
				const { status } = await Brightness.requestPermissionsAsync();
				if (status === 'granted') {
					await Brightness.setBrightnessAsync(settings.brightness);
				}
			} catch (error) {
				console.log('Brightness error:', error);
			}
		};

		setBrightness();

		return () => {
			Brightness.setBrightnessAsync(0.5).catch(() => {});
		};
	}, [settings.brightness]);

	// Sequenz Timer
	useEffect(() => {
		if (!sequence || !currentItem) return;

		setRemainingTime(currentItem.duration); // duration ist bereits in Sekunden

		timerRef.current = setInterval(() => {
			setRemainingTime((prev) => {
				if (prev <= 1) {
					// Zeit abgelaufen, zum nächsten Mood oder Ende
					if (currentIndex < sequence.items.length - 1) {
						startTransition();
					} else {
						// Sequenz beendet
						router.back();
					}
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [currentIndex, sequence]);

	const startTransition = () => {
		if (!sequence) return;

		setIsTransitioning(true);
		transitionOpacity.value = 1;

		// Fade out
		transitionOpacity.value = withTiming(
			0,
			{
				duration: sequence.transitionDuration * 1000,
				easing: Easing.inOut(Easing.ease),
			},
			() => {
				// Nach dem Fade, wechsle zum nächsten Mood
				setCurrentIndex((prev) => prev + 1);
				setIsTransitioning(false);
				transitionOpacity.value = 1;
			}
		);
	};

	const animatedTransitionStyle = useAnimatedStyle(() => {
		return {
			opacity: transitionOpacity.value,
		};
	});

	const handleBrightnessChange = async (value: number) => {
		setLocalBrightness(value);
		try {
			await Brightness.setBrightnessAsync(value);
			updateSettings({ brightness: value });
		} catch (error) {
			console.log('Brightness change error:', error);
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	if (!sequence || !currentMood) {
		return (
			<View className="flex-1 items-center justify-center bg-gray-900">
				<Text className="text-xl text-white">Sequenz nicht gefunden</Text>
			</View>
		);
	}

	return (
		<View className="flex-1">
			<Stack.Screen options={{ headerShown: false }} />
			<StatusBar hidden />

			{/* Current Mood Background */}
			{settings.screenEnabled ? (
				<>
					{/* Next Mood (darunter, für Crossfade) */}
					{isTransitioning && nextMood && (
						<View className="absolute inset-0">
							<AnimatedMoodBackground mood={nextMood} animationSpeed={settings.animationSpeed} />
						</View>
					)}

					{/* Current Mood (darüber, wird ausgeblendet) */}
					<Animated.View
						className="absolute inset-0"
						style={isTransitioning ? animatedTransitionStyle : undefined}
					>
						<AnimatedMoodBackground mood={currentMood} animationSpeed={settings.animationSpeed} />
					</Animated.View>
				</>
			) : (
				<View className="absolute inset-0 bg-black" />
			)}

			{/* Header */}
			<View className="absolute left-4 right-4 top-12 flex-row items-center justify-between">
				<Pressable
					onPress={() => router.back()}
					className="flex-row items-center gap-3 rounded-full bg-black/30 px-4 py-2 opacity-60"
				>
					<Icon name="close" size={16} color="#FFFFFF" weight="bold" />
					<Text className="text-xl font-bold text-white">{sequence.name}</Text>
				</Pressable>
			</View>

			{/* Center Progress */}
			<View className="flex-1 items-center justify-center">
				<View className="items-center rounded-2xl bg-black/40 px-6 py-4 opacity-60">
					<Text className="mb-2 text-2xl font-bold text-white">{currentMood.name}</Text>
					<View className="mb-3 flex-row gap-1">
						{sequence.items.map((_, index) => (
							<View
								key={index}
								className={`h-2 w-2 rounded-full ${
									index === currentIndex ? 'bg-white' : 'bg-white/30'
								}`}
							/>
						))}
					</View>
					<Text className="mb-1 text-lg text-white">{formatTime(remainingTime)}</Text>
					<Text className="text-sm text-white/70">
						Mood {currentIndex + 1} von {sequence.items.length}
					</Text>
					{nextMood && (
						<Text className="mt-2 text-xs text-white/70">Nächster: {nextMood.name}</Text>
					)}
				</View>
			</View>

			{/* Brightness Slider */}
			<View className="absolute bottom-12 left-4 right-4 flex-row items-center gap-3 rounded-2xl bg-black/30 px-4 py-3 opacity-60">
				<Icon name="sun" size={24} color="#FFFFFF" />
				<View className="flex-1">
					<Slider
						minimumValue={0.1}
						maximumValue={1}
						step={0.05}
						value={localBrightness}
						onValueChange={handleBrightnessChange}
						minimumTrackTintColor="#FFFFFF"
						maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
						thumbTintColor="#FFFFFF"
					/>
				</View>
			</View>
		</View>
	);
}
