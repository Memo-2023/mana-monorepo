import React, { useState } from 'react';
import {
	View,
	Text,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	Switch,
	Alert,
} from 'react-native';

import { router, Stack } from 'expo-router';
import { Icon } from '~/components/ui/Icon';
import { useDeckStore } from '../../store/deckStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useThemeColors } from '~/utils/themeUtils';
import { spacing } from '~/utils/spacing';

export default function CreateDeckScreen() {
	const colors = useThemeColors();
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [isPublic, setIsPublic] = useState(false);
	const [tags, setTags] = useState('');
	const [errors, setErrors] = useState<{ title?: string }>({});

	const { createDeck, isLoading } = useDeckStore();

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

	const handleCreate = async () => {
		if (!validateForm()) return;

		try {
			const deck = await createDeck({
				title: title.trim(),
				description: description.trim() || undefined,
				is_public: isPublic,
				tags: tags
					.split(',')
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0),
			});

			Alert.alert('Deck erstellt!', 'Dein Deck wurde erfolgreich erstellt.', [
				{
					text: 'OK',
					onPress: () => router.replace(`/deck/${deck.id}`),
				},
			]);
		} catch (error: any) {
			Alert.alert('Fehler', error.message || 'Deck konnte nicht erstellt werden');
		}
	};

	return (
		<>
			<Stack.Screen
				options={{
					headerShown: true,
					title: 'Neues Deck',
					headerStyle: { backgroundColor: colors.surface },
					headerTintColor: colors.foreground,
					headerLeft: () => (
						<Icon
							name="close"
							size={24}
							color={colors.foreground}
							onPress={() => router.back()}
							style={{ marginLeft: 10 }}
							library="Ionicons"
						/>
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

							<Button
								onPress={handleCreate}
								loading={isLoading}
								fullWidth
								size="lg"
								leftIcon={
									<Icon name="add-circle-outline" size={20} color="white" library="Ionicons" />
								}
							>
								Deck erstellen
							</Button>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</View>
		</>
	);
}
