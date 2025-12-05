import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View, Text, Switch, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { useStore } from '@/store/store';
import { getThemeColors } from '@/utils/theme';
import { useResponsive } from '@/hooks/useResponsive';

export default function Settings() {
	const router = useRouter();
	const settings = useStore((state) => state.settings);
	const updateSettings = useStore((state) => state.updateSettings);

	const handleHaptic = () => {
		if (settings.hapticFeedback) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}
	};

	const handleSettingChange = (key: string, value: any) => {
		handleHaptic();
		updateSettings({ [key]: value });
	};

	const timerOptions = [
		{ label: 'Aus', value: 0 },
		{ label: '5 Min', value: 5 },
		{ label: '10 Min', value: 10 },
		{ label: '15 Min', value: 15 },
		{ label: '30 Min', value: 30 },
		{ label: '60 Min', value: 60 },
	];

	const theme = getThemeColors();
	const responsive = useResponsive();

	return (
		<View className={`flex-1 ${theme.bg}`}>
			<Stack.Screen
				options={{
					title: 'Einstellungen',
					headerBackTitle: 'Zurück',
				}}
			/>
			<ScrollView className="flex-1" contentContainerClassName="items-center">
				<View
					style={{ width: '100%', maxWidth: responsive.maxContentWidth }}
					className="px-6 pb-4 pt-4"
				>
					{/* Animationsgeschwindigkeit */}
					<View className={`${theme.cardBg} mx-2 mb-4 rounded-2xl p-4`}>
						<Text className={`mb-2 text-lg font-semibold ${theme.text}`}>
							Animationsgeschwindigkeit
						</Text>
						<Text className={`${theme.textSecondary} mb-3`}>
							{settings.animationSpeed === 0.5
								? 'Langsam'
								: settings.animationSpeed === 1
									? 'Normal'
									: 'Schnell'}
						</Text>
						<Slider
							minimumValue={0.5}
							maximumValue={2}
							step={0.5}
							value={settings.animationSpeed}
							onValueChange={(value) => handleSettingChange('animationSpeed', value)}
							minimumTrackTintColor="#6B8DD6"
							maximumTrackTintColor="#E5E7EB"
						/>
					</View>

					{/* Haptisches Feedback */}
					<View
						className={`${theme.cardBg} mx-2 mb-4 flex-row items-center justify-between rounded-2xl p-4`}
					>
						<View className="flex-1">
							<Text className={`text-lg font-semibold ${theme.text}`}>Haptisches Feedback</Text>
							<Text className={`${theme.textSecondary} text-sm`}>Vibration beim Tippen</Text>
						</View>
						<Switch
							value={settings.hapticFeedback}
							onValueChange={(value) => handleSettingChange('hapticFeedback', value)}
							trackColor={{ false: '#E5E7EB', true: '#6B8DD6' }}
						/>
					</View>

					{/* Helligkeit */}
					<View className={`${theme.cardBg} mx-2 mb-4 rounded-2xl p-4`}>
						<Text className={`mb-2 text-lg font-semibold ${theme.text}`}>
							Bildschirm-Helligkeit
						</Text>
						<Text className={`${theme.textSecondary} mb-3`}>
							{Math.round(settings.brightness * 100)}%
						</Text>
						<Slider
							minimumValue={0.1}
							maximumValue={1}
							step={0.1}
							value={settings.brightness}
							onValueChange={(value) => handleSettingChange('brightness', value)}
							minimumTrackTintColor="#6B8DD6"
							maximumTrackTintColor="#E5E7EB"
						/>
					</View>

					{/* Taschenlampen-Helligkeit */}
					<View className={`${theme.cardBg} mx-2 mb-4 rounded-2xl p-4`}>
						<Text className={`mb-2 text-lg font-semibold ${theme.text}`}>
							Taschenlampen-Helligkeit
						</Text>
						<Text className={`${theme.textSecondary} mb-3`}>
							Stufe {settings.flashlightBrightness} von 10
						</Text>
						<Slider
							minimumValue={1}
							maximumValue={10}
							step={1}
							value={settings.flashlightBrightness}
							onValueChange={(value) => handleSettingChange('flashlightBrightness', value)}
							minimumTrackTintColor="#6B8DD6"
							maximumTrackTintColor="#E5E7EB"
						/>
					</View>

					{/* Auto-Timer */}
					<View className={`${theme.cardBg} mx-2 mb-4 rounded-2xl p-4`}>
						<Text className={`mb-3 text-lg font-semibold ${theme.text}`}>Auto-Timer</Text>
						<View className="flex-row flex-wrap gap-2">
							{timerOptions.map((option) => (
								<Pressable
									key={option.value}
									onPress={() => handleSettingChange('autoTimer', option.value)}
									className={`rounded-full px-4 py-2 ${
										settings.autoTimer === option.value ? 'bg-blue-500' : 'bg-gray-200'
									}`}
								>
									<Text
										className={`font-medium ${
											settings.autoTimer === option.value ? 'text-white' : 'text-gray-700'
										}`}
									>
										{option.label}
									</Text>
								</Pressable>
							))}
						</View>
					</View>

					{/* Auto Mood Switch */}
					<View className={`${theme.cardBg} mx-2 mb-4 rounded-2xl p-4`}>
						<View className="mb-3 flex-row items-center justify-between">
							<View className="flex-1">
								<Text className={`text-lg font-semibold ${theme.text}`}>
									Automatischer Mood-Wechsel
								</Text>
								<Text className={`${theme.textSecondary} text-sm`}>Wechselt zwischen Moods</Text>
							</View>
							<Switch
								value={settings.autoMoodSwitch}
								onValueChange={(value) => handleSettingChange('autoMoodSwitch', value)}
								trackColor={{ false: '#E5E7EB', true: '#6B8DD6' }}
							/>
						</View>
						{settings.autoMoodSwitch && (
							<>
								<Text className={`${theme.textSecondary} mb-2`}>
									Intervall: {settings.autoMoodSwitchInterval} Min
								</Text>
								<Slider
									minimumValue={1}
									maximumValue={30}
									step={1}
									value={settings.autoMoodSwitchInterval}
									onValueChange={(value) => handleSettingChange('autoMoodSwitchInterval', value)}
									minimumTrackTintColor="#6B8DD6"
									maximumTrackTintColor="#E5E7EB"
								/>
							</>
						)}
					</View>

					{/* Credits */}
					<View className="mx-2 mb-4 mt-8 items-center">
						<View className={`${theme.cardBg} w-full items-center rounded-2xl p-5 shadow-sm`}>
							<Icon name="heart-fill" size={18} color="#EF4444" weight="fill" />
							<View className="mt-2 flex-row items-center">
								<Text className={`${theme.text} text-center text-sm font-medium`}>
									Made by Till Schneider for the{' '}
								</Text>
								<Pressable
									onPress={() => {
										handleHaptic();
										Linking.openURL('https://manacore.ai');
									}}
								>
									<Text className="text-sm font-semibold text-blue-500 underline">Manacore</Text>
								</Pressable>
							</View>
							<Text className={`${theme.textSecondary} mt-1 text-xs`}>Free Forever</Text>
							<Text className={`${theme.textSecondary} mt-1 text-xs`}>Version 1.0</Text>
						</View>
					</View>
				</View>
			</ScrollView>
		</View>
	);
}
