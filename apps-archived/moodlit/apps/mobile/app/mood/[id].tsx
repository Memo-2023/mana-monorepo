import * as Brightness from 'expo-brightness';
import { useKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
import { Pressable, View, Text } from 'react-native';

import { AnimatedMoodBackground } from '@/components/AnimatedMoodBackground';
import { useStore } from '@/store/store';
import { useFlashlight } from '@/hooks/useFlashlight';

export default function MoodDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const moods = useStore((state) => state.moods);
	const settings = useStore((state) => state.settings);

	const [remainingTime, setRemainingTime] = useState<number | null>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const autoSwitchRef = useRef<NodeJS.Timeout | null>(null);

	// Verhindert, dass der Bildschirm ausgeht
	useKeepAwake();

	const mood = moods.find((m) => m.id === id);

	// Flashlight-Hook mit Helligkeitssteuerung
	useFlashlight({
		enabled: settings.flashlightEnabled && !!mood,
		animationType: mood?.animationType || 'gradient',
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

		// Helligkeit beim Verlassen zurücksetzen
		return () => {
			Brightness.setBrightnessAsync(0.5).catch(() => {});
		};
	}, [settings.brightness]);

	// Auto-Timer
	useEffect(() => {
		if (settings.autoTimer > 0) {
			setRemainingTime(settings.autoTimer * 60); // In Sekunden

			timerRef.current = setInterval(() => {
				setRemainingTime((prev) => {
					if (prev === null || prev <= 1) {
						router.back();
						return null;
					}
					return prev - 1;
				});
			}, 1000);
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [settings.autoTimer]);

	// Automatischer Mood-Wechsel
	useEffect(() => {
		if (settings.autoMoodSwitch && mood) {
			const interval = settings.autoMoodSwitchInterval * 60 * 1000; // In Millisekunden

			autoSwitchRef.current = setTimeout(() => {
				const currentIndex = moods.findIndex((m) => m.id === mood.id);
				const nextIndex = (currentIndex + 1) % moods.length;
				const nextMood = moods[nextIndex];

				router.replace(`/mood/${nextMood.id}`);
			}, interval);
		}

		return () => {
			if (autoSwitchRef.current) {
				clearTimeout(autoSwitchRef.current);
			}
		};
	}, [settings.autoMoodSwitch, settings.autoMoodSwitchInterval, mood, moods]);

	if (!mood) {
		return (
			<View className="flex-1 items-center justify-center bg-gray-900">
				<Text className="text-xl text-white">Mood nicht gefunden</Text>
			</View>
		);
	}

	return (
		<Pressable className="flex-1" onPress={() => router.back()}>
			<Stack.Screen options={{ headerShown: false }} />
			<StatusBar hidden />

			{/* Bildschirm-Animation (nur wenn aktiviert) */}
			{settings.screenEnabled ? (
				<AnimatedMoodBackground mood={mood} animationSpeed={settings.animationSpeed} />
			) : (
				<View className="absolute inset-0 bg-black" />
			)}
		</Pressable>
	);
}
