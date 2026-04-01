import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	Switch,
	Alert,
} from 'react-native';

import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDeckStore } from '../../../store/deckStore';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { useThemeColors } from '~/utils/themeUtils';
import { spacing } from '~/utils/spacing';

export default function EditDeckScreen() {
	const colors = useThemeColors();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { currentDeck, fetchDeck, updateDeck, isLoading } = useDeckStore();

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [isPublic, setIsPublic] = useState(false);
	const [tags, setTags] = useState('');
	const [errors, setErrors] = useState<{ title?: string }>({});
	const [isUpdating, setIsUpdating] = useState(false);

	useEffect(() => {
		if (id && !currentDeck) {
			fetchDeck(id);
		}
	}, [id]);

	useEffect(() => {
		if (currentDeck) {
			setTitle(currentDeck.title);
			setDescription(currentDeck.description || '');
			setIsPublic(currentDeck.is_public);
			setTags(currentDeck.tags?.join(', ') || '');
		}
	}, [currentDeck]);

	const validateForm = () => {
		const newErrors: { title?: string } = {};

		if (!title.trim()) {
			newErrors.title = 'Titel ist erforderlich';
		} else if (title.length < 3) {
			newErrors.title = 'Titel muss mindestens 3 Zeichen lang sein';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleUpdate = async () => {
		if (!validateForm() || !currentDeck) return;

		try {
			setIsUpdating(true);

			await updateDeck(currentDeck.id, {
				title: title.trim(),
				description: description.trim() || undefined,
				is_public: isPublic,
				tags: tags
					.split(',')
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0),
			});

			Alert.alert('Erfolg', 'Deck wurde aktualisiert', [
				{
					text: 'OK',
					onPress: () => router.back(),
				},
			]);
		} catch (error: any) {
			Alert.alert('Fehler', error.message || 'Deck konnte nicht aktualisiert werden');
		} finally {
			setIsUpdating(false);
		}
	};

	if (!currentDeck) {
		return (
			<View style={{ flex: 1, backgroundColor: colors.background }}>
				<Stack.Screen
					options={{
						headerShown: true,
						title: 'Deck bearbeiten',
						headerStyle: { backgroundColor: colors.surface },
						headerTintColor: colors.foreground,
						headerLeft: () => (
							<Ionicons
								name="close"
								size={24}
								color={colors.foreground}
								onPress={() => router.back()}
							/>
						),
					}}
				/>
				<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
					<Text style={{ color: colors.mutedForeground }}>Lädt...</Text>
				</View>
			</View>
		);
	}

	return (
		<>
			<Stack.Screen
				options={{
					headerShown: true,
					title: 'Deck bearbeiten',
					headerStyle: { backgroundColor: colors.surface },
					headerTintColor: colors.foreground,
					headerLeft: () => (
						<Ionicons
							name="close"
							size={24}
							color={colors.foreground}
							onPress={() => router.back()}
							style={{ marginLeft: 10 }}
						/>
					),
					headerRight: () => (
						<Button
							onPress={handleUpdate}
							loading={isUpdating}
							variant="primary"
							size="sm"
							style={{ marginRight: 10 }}
						>
							Speichern
						</Button>
					),
				}}
			/>
			<View style={{ flex: 1, backgroundColor: colors.background }}>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={{ flex: 1 }}
				>
					<ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
						<View
							style={{
								paddingHorizontal: spacing.container.horizontal,
								paddingVertical: spacing.container.vertical,
							}}
						>
							<Card padding="lg" variant="elevated" style={{ marginBottom: spacing.lg }}>
								<Input
									label="Titel"
									placeholder="z.B. Spanisch Grundlagen"
									value={title}
									onChangeText={setTitle}
									error={errors.title}
									leftIcon="text-outline"
								/>

								<Input
									label="Beschreibung (optional)"
									placeholder="Worum geht es in diesem Deck?"
									value={description}
									onChangeText={setDescription}
									leftIcon="document-text-outline"
									multiline
									numberOfLines={3}
									textAlignVertical="top"
								/>

								<Input
									label="Tags (optional)"
									placeholder="spanisch, grundlagen, vokabeln"
									value={tags}
									onChangeText={setTags}
									leftIcon="pricetags-outline"
									autoCapitalize="none"
								/>
							</Card>

							<Card padding="lg" variant="elevated" style={{ marginBottom: spacing.lg }}>
								<View
									style={{
										marginBottom: spacing.sm,
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'space-between',
									}}
								>
									<View style={{ marginRight: spacing.content.small, flex: 1 }}>
										<Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground }}>
											Öffentliches Deck
										</Text>
										<Text
											style={{
												marginTop: spacing.xs,
												fontSize: 14,
												color: colors.mutedForeground,
											}}
										>
											Andere Nutzer können dein Deck sehen und lernen
										</Text>
									</View>
									<Switch
										value={isPublic}
										onValueChange={setIsPublic}
										trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
										thumbColor={isPublic ? '#3B82F6' : '#F3F4F6'}
									/>
								</View>
							</Card>

							<Card padding="lg" variant="elevated" style={{ marginBottom: spacing.lg }}>
								<Text
									style={{
										marginBottom: spacing.content.small,
										fontSize: 16,
										fontWeight: '500',
										color: colors.foreground,
									}}
								>
									Statistiken
								</Text>
								<View style={{ gap: spacing.sm }}>
									<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
										<Text style={{ fontSize: 14, color: colors.mutedForeground }}>Karten:</Text>
										<Text style={{ fontSize: 14, color: colors.foreground }}>
											{currentDeck.card_count || 0}
										</Text>
									</View>
									<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
										<Text style={{ fontSize: 14, color: colors.mutedForeground }}>Erstellt:</Text>
										<Text style={{ fontSize: 14, color: colors.foreground }}>
											{new Date(currentDeck.created_at).toLocaleDateString('de-DE')}
										</Text>
									</View>
									<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
										<Text style={{ fontSize: 14, color: colors.mutedForeground }}>
											Zuletzt bearbeitet:
										</Text>
										<Text style={{ fontSize: 14, color: colors.foreground }}>
											{new Date(currentDeck.updated_at).toLocaleDateString('de-DE')}
										</Text>
									</View>
								</View>
							</Card>

							<Button
								onPress={handleUpdate}
								loading={isUpdating}
								fullWidth
								size="lg"
								leftIcon={<Ionicons name="save-outline" size={20} color="white" />}
							>
								Änderungen speichern
							</Button>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</View>
		</>
	);
}
