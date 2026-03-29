import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { useStore } from '~/store/store';
import { useAuth } from '~/hooks/useAuth';
import { useTexts } from '~/hooks/useTexts';
import { useTheme } from '~/hooks/useTheme';
import { Header } from '~/components/Header';
import { Dropdown } from '~/components/dropdown';
import {
	GERMAN_VOICES,
	QUALITY_LABELS,
	PROVIDER_LABELS,
	getVoiceById,
	LEGACY_VOICE_MAP,
} from '~/constants/voices';

export default function SettingsScreen() {
	const { settings, updateSettings } = useStore();
	const { user, signOut } = useAuth();
	const { texts, getAllTags } = useTexts();
	const { colors } = useTheme();

	// Map legacy voice settings to new voice IDs
	const currentVoice = LEGACY_VOICE_MAP[settings.voice] || settings.voice || 'de-DE-Neural2-A';

	const speeds = [
		{ value: 0.5, label: 'Langsam (0.5x)' },
		{ value: 0.75, label: 'Etwas langsam (0.75x)' },
		{ value: 1.0, label: 'Normal (1.0x)' },
		{ value: 1.25, label: 'Etwas schnell (1.25x)' },
		{ value: 1.5, label: 'Schnell (1.5x)' },
		{ value: 2.0, label: 'Sehr schnell (2.0x)' },
	];

	const themes = [
		{ value: 'light', label: 'Hell' },
		{ value: 'dark', label: 'Dunkel' },
	];

	const totalTexts = texts.length;
	const totalTags = getAllTags().length;
	const textsWithAudio = texts.filter((t) => t.data.audio?.hasLocalCache).length;
	const totalAudioSize = texts.reduce((sum, text) => {
		return sum + (text.data.audio?.totalSize || 0);
	}, 0);

	const handleLogout = async () => {
		await signOut();
		router.replace('/(auth)/login');
	};

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<Header title="Einstellungen" showBackButton={false} />

			<ScrollView className={`flex-1 ${colors.background}`}>
				<View className="p-4">
					{/* Statistics */}
					<View className={`mb-4 rounded-lg ${colors.surface} p-4`}>
						<Text className={`mb-3 text-lg font-semibold ${colors.text}`}>Statistiken</Text>

						<View className="space-y-2">
							<View className="flex-row justify-between">
								<Text className={`${colors.textSecondary}`}>Texte gesamt:</Text>
								<Text className={`${colors.text}`}>{totalTexts}</Text>
							</View>

							<View className="flex-row justify-between">
								<Text className={`${colors.textSecondary}`}>Tags:</Text>
								<Text className={`${colors.text}`}>{totalTags}</Text>
							</View>

							<View className="flex-row justify-between">
								<Text className={`${colors.textSecondary}`}>Texte mit Audio:</Text>
								<Text className={`${colors.text}`}>{textsWithAudio}</Text>
							</View>

							<View className="flex-row justify-between">
								<Text className={`${colors.textSecondary}`}>Audio-Speicher:</Text>
								<Text className={`${colors.text}`}>
									{(totalAudioSize / 1024 / 1024).toFixed(2)} MB
								</Text>
							</View>
						</View>
					</View>

					{/* Audio Settings */}
					<View className={`mb-4 rounded-lg ${colors.surface} p-4`}>
						<Text className={`mb-3 text-lg font-semibold ${colors.text}`}>Audio-Einstellungen</Text>

						<View className="mb-4">
							<Text className={`mb-2 text-sm font-medium ${colors.textSecondary}`}>Stimme</Text>
							<Dropdown
								value={currentVoice}
								onValueChange={(newVoice) => updateSettings({ voice: newVoice })}
								placeholder="Stimme wählen"
								title="Stimme auswählen"
								groups={Object.entries(
									GERMAN_VOICES.reduce(
										(groups, voice) => {
											const provider = voice.provider;
											if (!groups[provider]) {
												groups[provider] = {};
											}
											const quality = voice.quality;
											if (!groups[provider][quality]) {
												groups[provider][quality] = [];
											}
											groups[provider][quality].push(voice);
											return groups;
										},
										{} as Record<string, Record<string, typeof GERMAN_VOICES>>
									)
								).map(([provider, qualityGroups]) => ({
									title: PROVIDER_LABELS[provider as keyof typeof PROVIDER_LABELS],
									options: Object.entries(qualityGroups).flatMap(([quality, voices]) =>
										voices.map((voice) => ({
											label: `${QUALITY_LABELS[quality as keyof typeof QUALITY_LABELS]} - ${voice.label}`,
											value: voice.value,
										}))
									),
								}))}
							/>
						</View>

						<View>
							<Text className={`mb-2 text-sm font-medium ${colors.textSecondary}`}>
								Geschwindigkeit
							</Text>
							<View className="space-y-2">
								{speeds.map((speed) => (
									<Pressable
										key={speed.value}
										onPress={() => updateSettings({ speed: speed.value })}
										className={`rounded-lg border p-3 ${
											settings.speed === speed.value
												? `border-blue-500 ${colors.primaryLight}`
												: colors.border
										}`}
									>
										<Text
											className={`${
												settings.speed === speed.value ? 'text-blue-700' : colors.textSecondary
											}`}
										>
											{speed.label}
										</Text>
									</Pressable>
								))}
							</View>
						</View>
					</View>

					{/* App Settings */}
					<View className={`mb-4 rounded-lg ${colors.surface} p-4`}>
						<Text className={`mb-3 text-lg font-semibold ${colors.text}`}>App-Einstellungen</Text>

						<View>
							<Text className={`mb-2 text-sm font-medium ${colors.textSecondary}`}>Design</Text>
							<View className="space-y-2">
								{themes.map((theme) => (
									<Pressable
										key={theme.value}
										onPress={() => updateSettings({ theme: theme.value as 'light' | 'dark' })}
										className={`rounded-lg border p-3 ${
											settings.theme === theme.value
												? `border-blue-500 ${colors.primaryLight}`
												: colors.border
										}`}
									>
										<Text
											className={`${
												settings.theme === theme.value ? 'text-blue-700' : colors.textSecondary
											}`}
										>
											{theme.label}
										</Text>
									</Pressable>
								))}
							</View>
						</View>
					</View>

					{/* App Info */}
					<View className={`mb-4 rounded-lg ${colors.surface} p-4`}>
						<Text className={`mb-3 text-lg font-semibold ${colors.text}`}>App Info</Text>

						<View className="space-y-2">
							<View className="flex-row justify-between">
								<Text className={`${colors.textSecondary}`}>Version:</Text>
								<Text className={`${colors.text}`}>1.0.0</Text>
							</View>

							<View className="flex-row justify-between">
								<Text className={`${colors.textSecondary}`}>Build:</Text>
								<Text className={`${colors.text}`}>1</Text>
							</View>
						</View>
					</View>

					{/* User Info */}
					<View className={`mb-4 rounded-lg ${colors.surface} p-4`}>
						<Text className={`mb-2 text-lg font-semibold ${colors.text}`}>Konto</Text>
						<Text className={`mb-4 ${colors.textSecondary}`}>{user?.email}</Text>
						<Pressable onPress={handleLogout} className={`rounded-lg ${colors.error} px-4 py-2`}>
							<Text className="text-center font-semibold text-white">Abmelden</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>
		</>
	);
}
