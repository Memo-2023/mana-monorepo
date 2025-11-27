import React, { useMemo, useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	Pressable,
	ActivityIndicator,
	Alert,
	Share,
	AppState,
	ScrollView,
} from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useTexts } from '~/hooks/useTexts';
import { useAuth } from '~/hooks/useAuth';
import { useStore } from '~/store/store';
import { Text as TextType, AudioVersion } from '~/types/database';
import { TagFilter } from '~/components/TagFilter';
import { useTheme } from '~/hooks/useTheme';
import { Header } from '~/components/Header';
import { FloatingActionButton } from '~/components/FloatingActionButton';
import { TextListItem } from '~/components/TextListItem';
import * as Clipboard from 'expo-clipboard';
import { urlExtractorService } from '~/services/urlExtractorService';

export default function Home() {
	const { texts, loading, error, refetch, deleteText, createText } = useTexts();
	const { signOut } = useAuth();
	const { selectedTags, settings } = useStore();
	const { colors } = useTheme();
	const [extracting, setExtracting] = useState(false);
	const [clipboardHasUrl, setClipboardHasUrl] = useState(false);

	// Check clipboard content on mount and when app becomes active
	useEffect(() => {
		const checkClipboard = async () => {
			try {
				const content = await Clipboard.getStringAsync();
				const hasUrl = content ? urlExtractorService.validateUrl(content) : false;
				setClipboardHasUrl(hasUrl);
			} catch (error) {
				console.error('Error checking clipboard:', error);
				setClipboardHasUrl(false);
			}
		};

		// Check on mount
		checkClipboard();

		// Check when app becomes active
		const subscription = AppState.addEventListener('change', (nextAppState) => {
			if (nextAppState === 'active') {
				checkClipboard();
			}
		});

		return () => {
			subscription.remove();
		};
	}, []);

	// Refresh texts when screen comes into focus
	useFocusEffect(
		React.useCallback(() => {
			refetch();
		}, [])
	);

	// Filter texts based on selected tags
	const filteredTexts = useMemo(() => {
		if (selectedTags.length === 0) {
			return texts;
		}

		return texts.filter((text) => {
			const textTags = text.data.tags || [];
			return selectedTags.every((tag) => textTags.includes(tag));
		});
	}, [texts, selectedTags]);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const formatDuration = (totalTime: number) => {
		const hours = Math.floor(totalTime / 3600);
		const minutes = Math.floor((totalTime % 3600) / 60);
		const seconds = Math.floor(totalTime % 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		if (minutes > 0) {
			return `${minutes}m`;
		}
		return `${seconds} Sek`;
	};

	const getAudioDuration = (item: TextType) => {
		// Try to get duration from current audio version
		if (item.data.audioVersions && item.data.audioVersions.length > 0) {
			const currentVersionId = item.data.currentAudioVersion;
			const currentVersion = currentVersionId
				? item.data.audioVersions.find((v) => v.id === currentVersionId)
				: item.data.audioVersions[item.data.audioVersions.length - 1];

			if (currentVersion && currentVersion.chunks) {
				const totalSeconds = currentVersion.chunks.reduce((sum, chunk) => sum + chunk.duration, 0);
				return formatDuration(totalSeconds);
			}
		}

		// Fallback to legacy audio data
		if (item.data.audio && item.data.audio.chunks) {
			const totalSeconds = item.data.audio.chunks.reduce((sum, chunk) => sum + chunk.duration, 0);
			return formatDuration(totalSeconds);
		}

		return null;
	};

	const handleDelete = async (textId: string, title: string) => {
		Alert.alert('Text löschen', `Möchten Sie "${title}" wirklich löschen?`, [
			{
				text: 'Abbrechen',
				style: 'cancel',
			},
			{
				text: 'Löschen',
				style: 'destructive',
				onPress: async () => {
					const { error } = await deleteText(textId);
					if (error) {
						Alert.alert('Fehler', error);
					} else {
						// Manually refresh the list after successful deletion
						refetch();
					}
				},
			},
		]);
	};

	const handleShare = async (text: TextType) => {
		try {
			const message = `${text.title}\n\n${text.content}`;
			await Share.share({
				title: text.title,
				message: message,
			});
		} catch (error) {
			console.error('Error sharing:', error);
		}
	};

	const handleClipboardUrl = async () => {
		try {
			setExtracting(true);
			const clipboardContent = await Clipboard.getStringAsync();

			if (!clipboardContent) {
				Alert.alert(
					'Zwischenablage leer',
					'Bitte kopieren Sie zuerst eine URL in die Zwischenablage.'
				);
				setExtracting(false);
				return;
			}

			// Check if it's a valid URL
			if (!urlExtractorService.validateUrl(clipboardContent)) {
				Alert.alert(
					'Keine gültige URL',
					'Die Zwischenablage enthält keine gültige URL. Bitte kopieren Sie eine Webadresse und versuchen Sie es erneut.'
				);
				setExtracting(false);
				return;
			}

			// Extract content from URL
			const { data, error: extractError } =
				await urlExtractorService.extractFromUrl(clipboardContent);

			if (extractError) {
				Alert.alert(
					'Fehler beim Abrufen',
					`Die Webseite konnte nicht geladen werden: ${extractError.message}`
				);
				setExtracting(false);
				return;
			}

			if (data) {
				// Create the text with extracted content
				const { data: createdText, error: createError } = await createText(
					data.title,
					urlExtractorService.formatExtractedContent(data),
					{
						tags: data.tags,
						source: data.source,
						tts: { speed: settings.speed || 1.0, voice: settings.voice || 'de-DE-Neural2-A' },
					}
				);

				if (createError) {
					Alert.alert(
						'Fehler beim Speichern',
						`Der Text konnte nicht gespeichert werden: ${createError}`
					);
				} else if (createdText) {
					// Refresh the list before navigating
					await refetch();
					// Navigate to the newly created text
					router.push(`/text/${createdText.id}`);
				}
			}
		} catch (error) {
			console.error('Error processing clipboard URL:', error);
			Alert.alert(
				'Unerwarteter Fehler',
				'Beim Verarbeiten der URL ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.'
			);
		} finally {
			setExtracting(false);
		}
	};

	const renderTextItem = ({ item }: { item: TextType }) => (
		<TextListItem
			item={item}
			onShare={handleShare}
			onDelete={handleDelete}
			formatDate={formatDate}
			getAudioDuration={getAudioDuration}
		/>
	);

	if (loading) {
		return (
			<>
				<Stack.Screen options={{ headerShown: false }} />
				<Header title="Meine Texte" showBackButton={false} />
				<View className={`flex-1 items-center justify-center ${colors.background}`}>
					<ActivityIndicator size="large" color="#3B82F6" />
					<Text className={`mt-2 ${colors.textSecondary}`}>Texte werden geladen...</Text>
				</View>
			</>
		);
	}

	if (error) {
		return (
			<>
				<Stack.Screen options={{ headerShown: false }} />
				<Header title="Meine Texte" showBackButton={false} />
				<View className={`flex-1 items-center justify-center px-4 ${colors.background}`}>
					<Text className="mb-4 text-center text-red-600">{error}</Text>
					<Pressable onPress={() => refetch()} className={`rounded-lg ${colors.primary} px-4 py-2`}>
						<Text className="text-white">Erneut versuchen</Text>
					</Pressable>
				</View>
			</>
		);
	}

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<Header title="Meine Texte" showBackButton={false} />

			<View className={`flex-1 ${colors.background}`}>
				<TagFilter />

				{texts.length === 0 ? (
					<View className="flex-1 items-center justify-center px-4">
						<Text className={`mb-4 text-center ${colors.textTertiary}`}>
							Noch keine Texte vorhanden
						</Text>
						<Pressable
							onPress={() => router.push('/add-text')}
							className={`rounded-lg ${colors.primary} px-6 py-3`}
						>
							<Text className="font-semibold text-white">Ersten Text hinzufügen</Text>
						</Pressable>
					</View>
				) : filteredTexts.length === 0 ? (
					<View className="flex-1 items-center justify-center px-4">
						<Text className={`mb-4 text-center ${colors.textTertiary}`}>
							Keine Texte mit den gewählten Tags gefunden
						</Text>
						<Pressable
							onPress={() => router.push('/add-text')}
							className={`rounded-lg ${colors.primary} px-6 py-3`}
						>
							<Text className="font-semibold text-white">Neuen Text hinzufügen</Text>
						</Pressable>
					</View>
				) : (
					<FlatList
						data={filteredTexts}
						renderItem={renderTextItem}
						keyExtractor={(item) => item.id}
						contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
						showsVerticalScrollIndicator={false}
					/>
				)}

				<View
					className={`absolute bottom-0 left-0 right-0 ${colors.surface} border-t ${colors.border} shadow-lg`}
				>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
						className="flex-row"
					>
						<FloatingActionButton
							onPress={() => router.push('/add-text')}
							icon="+"
							label="Neuer Text"
							style={{ marginRight: 12 }}
						/>

						<FloatingActionButton
							onPress={handleClipboardUrl}
							icon="📋"
							label={clipboardHasUrl ? 'URL einfügen' : 'Keine URL'}
							disabled={!clipboardHasUrl}
							loading={extracting}
							style={{ marginRight: 12 }}
						/>
					</ScrollView>
				</View>
			</View>
		</>
	);
}
