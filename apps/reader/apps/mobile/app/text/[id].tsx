import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, ScrollView, Alert, Pressable } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useTexts } from '~/hooks/useTexts';
import { Text as TextType } from '~/types/database';
import { AudioPlayer } from '~/components/AudioPlayer';
import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import { Header } from '~/components/Header';
import { Icon } from '~/components/Icon';
import { useTheme } from '~/hooks/useTheme';

export default function TextDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { texts, deleteText } = useTexts();
	const [text, setText] = useState<TextType | null>(null);
	const [loading, setLoading] = useState(true);
	const { colors } = useTheme();

	useEffect(() => {
		const foundText = texts.find((t) => t.id === id);
		setText(foundText || null);
		setLoading(false);
	}, [id, texts]);

	const handleDelete = () => {
		Alert.alert(
			'Text löschen',
			'Möchtest du diesen Text wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
			[
				{ text: 'Abbrechen', style: 'cancel' },
				{
					text: 'Löschen',
					style: 'destructive',
					onPress: async () => {
						if (text) {
							const { error } = await deleteText(text.id);
							if (!error) {
								router.back();
							}
						}
					},
				},
			]
		);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	if (loading) {
		return (
			<>
				<Stack.Screen options={{ headerShown: false }} />
				<Header title="Text wird geladen..." />
				<View className={`flex-1 items-center justify-center ${colors.background}`}>
					<ActivityIndicator size="large" color="#3B82F6" />
				</View>
			</>
		);
	}

	if (!text) {
		return (
			<>
				<Stack.Screen options={{ headerShown: false }} />
				<Header title="Text nicht gefunden" />
				<View className={`flex-1 items-center justify-center px-4 ${colors.background}`}>
					<Text variant="body" color="tertiary" align="center" className="mb-4">
						Der angeforderte Text wurde nicht gefunden.
					</Text>
					<Pressable
						onPress={() => router.back()}
						className={`rounded-lg ${colors.primary} px-4 py-2`}
					>
						<Text color="white">Zurück</Text>
					</Pressable>
				</View>
			</>
		);
	}

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<Header
				title={text.title}
				rightComponent={
					<Pressable
						onPress={handleDelete}
						className="-mr-2 rounded-full p-2"
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<Icon name="delete" size={24} color="#6b7280" />
					</Pressable>
				}
			/>

			<ScrollView className={`flex-1 ${colors.background}`}>
				<View className="p-4">
					<View className="mb-4">
						<Text variant="h3" className="mb-2">
							{text.title}
						</Text>

						<View className="mb-2 flex-row items-center">
							<Text variant="bodySmall" color="tertiary">
								Erstellt: {formatDate(text.created_at)}
							</Text>
							{text.updated_at !== text.created_at && (
								<Text variant="bodySmall" color="tertiary" className="ml-4">
									Bearbeitet: {formatDate(text.updated_at)}
								</Text>
							)}
						</View>

						{text.data.tags && text.data.tags.length > 0 ? (
							<View className="mb-4 flex-row flex-wrap">
								{text.data.tags.map((tag, index) => (
									<View
										key={index}
										className={`mb-2 mr-2 rounded-full ${colors.primaryLight} px-3 py-1`}
									>
										<Text variant="bodySmall" color="blue">
											{tag}
										</Text>
									</View>
								))}
							</View>
						) : null}
					</View>

					<View className="mb-6">
						<Text variant="body" className="leading-6">
							{text.content}
						</Text>
					</View>

					<AudioPlayer
						text={text}
						onAudioGenerated={() => {
							// Refresh text data after audio generation
							const updatedText = texts.find((t) => t.id === text.id);
							if (updatedText) {
								setText(updatedText);
							}
						}}
					/>

					{text.data.stats ? (
						<View className={`mt-6 rounded-lg ${colors.surfaceSecondary} p-4`}>
							<Text variant="h5" className="mb-3">
								Statistiken
							</Text>

							<View>
								<View className="flex-row justify-between">
									<Text color="secondary">Wiedergaben:</Text>
									<Text>{text.data.stats?.playCount || 0}</Text>
								</View>

								{text.data.stats?.totalTime ? (
									<View className="flex-row justify-between">
										<Text color="secondary">Gesamtzeit:</Text>
										<Text>
											{Math.floor(text.data.stats.totalTime / 60)}m{' '}
											{Math.round(text.data.stats.totalTime % 60)}s
										</Text>
									</View>
								) : null}

								<View className="flex-row justify-between">
									<Text color="secondary">Status:</Text>
									<Text>{text.data.stats?.completed ? 'Abgeschlossen' : 'In Progress'}</Text>
								</View>
							</View>
						</View>
					) : null}

					{text.data.audio?.hasLocalCache ? (
						<View className={`mt-6 rounded-lg ${colors.successLight} p-4`}>
							<Text variant="h5" className="mb-3">
								Audio Cache
							</Text>

							<View>
								<View className="flex-row justify-between">
									<Text color="secondary">Chunks:</Text>
									<Text>{text.data.audio?.chunks?.length || 0}</Text>
								</View>

								<View className="flex-row justify-between">
									<Text color="secondary">Größe:</Text>
									<Text>{((text.data.audio?.totalSize || 0) / 1024 / 1024).toFixed(2)} MB</Text>
								</View>

								{text.data.audio?.lastGenerated ? (
									<View className="flex-row justify-between">
										<Text color="secondary">Generiert:</Text>
										<Text>{formatDate(text.data.audio.lastGenerated)}</Text>
									</View>
								) : null}
							</View>
						</View>
					) : null}
				</View>
			</ScrollView>
		</>
	);
}
