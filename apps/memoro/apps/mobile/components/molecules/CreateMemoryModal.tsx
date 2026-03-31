import React, { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { getTheme } from '~/features/theme/constants';
import { useTranslation } from 'react-i18next';
import BaseModal from '~/components/atoms/BaseModal';
import Text from '~/components/atoms/Text';
import PromptPreview from '~/components/molecules/PromptPreview';
import LoadingOverlay from '~/components/atoms/LoadingOverlay';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { creditService } from '~/features/credits/creditService';
import ManaIcon from '~/features/subscription/ManaIcon';

interface Prompt {
	id: string;
	memory_title: Record<string, string>;
	description: Record<string, string>;
	prompt_text: Record<string, string>;
	created_at: string;
	updated_at: string;
	is_public?: boolean;
}

interface CreateMemoryModalProps {
	visible: boolean;
	onClose: () => void;
	memoId: string;
	onMemoryCreated: () => void;
}

/**
 * Modal zum Erstellen einer neuen Memory durch Auswahl eines Prompts
 */
const CreateMemoryModal: React.FC<CreateMemoryModalProps> = ({
	visible,
	onClose,
	memoId,
	onMemoryCreated,
}) => {
	const { isDark, themeVariant, colorScheme } = useTheme();
	const theme = getTheme(colorScheme, themeVariant);
	const { t } = useTranslation();

	const [prompts, setPrompts] = useState<Prompt[]>([]);
	const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isCreating, setIsCreating] = useState(false);

	// Prompts laden wenn Modal geöffnet wird
	useEffect(() => {
		if (visible) {
			loadPrompts();
		}
	}, [visible]);

	const loadPrompts = async () => {
		try {
			setIsLoading(true);
			const supabase = await getAuthenticatedClient();

			const { data, error } = await supabase
				.from('prompts')
				.select('*')
				.eq('is_public', true)
				.order('memory_title->de', { ascending: true });

			if (error) {
				console.error('Fehler beim Laden der Prompts:', error);
				Alert.alert(
					t('memo.error', 'Fehler'),
					t('memo.prompts_load_error', 'Prompts konnten nicht geladen werden.')
				);
				return;
			}

			setPrompts(data || []);
		} catch (error) {
			console.error('Fehler beim Laden der Prompts:', error);
			Alert.alert(
				t('memo.error', 'Fehler'),
				t('memo.unexpected_error', 'Ein unerwarteter Fehler ist aufgetreten.')
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreateMemory = async () => {
		if (!selectedPromptId) {
			Alert.alert(
				t('memo.note', 'Hinweis'),
				t('memo.please_select_prompt', 'Bitte wählen Sie einen Prompt aus.')
			);
			return;
		}

		try {
			setIsCreating(true);

			// Call the Supabase Edge Function directly
			const supabase = await getAuthenticatedClient();
			const { data, error } = await supabase.functions.invoke('create-memory', {
				body: {
					memo_id: memoId,
					prompt_id: selectedPromptId,
				},
			});

			if (error) {
				console.error('Edge Function error:', error);
				throw new Error(
					error.message ||
						t('memo.memory_creation_error', 'Unbekannter Fehler bei der Memory-Erstellung')
				);
			}

			if (data?.success && data?.memory_id) {
				// Notify credit system about consumption if provided
				if (data.creditsConsumed) {
					creditService.triggerCreditUpdate(data.creditsConsumed);
				}

				// Close modal and notify parent
				onClose();
				onMemoryCreated();
			} else {
				throw new Error(
					data?.error ||
						t('memo.memory_creation_error', 'Unbekannter Fehler bei der Memory-Erstellung')
				);
			}
		} catch (error) {
			console.error('Fehler bei der Memory-Erstellung:', error);

			// Don't check for insufficient credits - let the global interceptor handle 402 errors
			Alert.alert(
				t('memo.error', 'Fehler'),
				t('memo.memory_creation_error', 'Bei der Erstellung der Memory ist ein Fehler aufgetreten.')
			);
		} finally {
			setIsCreating(false);
		}
	};

	// Zeige alle Prompts in einer Liste (keine Kategorien)
	const allPrompts = prompts;

	return (
		<BaseModal
			isVisible={visible}
			onClose={onClose}
			title={t('memo.create_new_memory', 'Neue Memory erstellen')}
			primaryButtonText={
				isCreating ? t('memo.creating_memory', 'Erstelle...') : t('common.create', 'Erstellen')
			}
			primaryButtonDisabled={!selectedPromptId || isLoading || isCreating}
			primaryButtonLoading={isCreating}
			onPrimaryButtonPress={handleCreateMemory}
			secondaryButtonText={t('common.cancel', 'Abbrechen')}
			onSecondaryButtonPress={onClose}
		>
			{isLoading ? (
				<View style={{ padding: 40, alignItems: 'center' }}>
					<ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
					<Text
						style={{
							marginTop: 16,
							color: isDark ? '#FFFFFF' : '#000000',
						}}
					>
						{t('memo.prompts_loading', 'Prompts werden geladen...')}
					</Text>
				</View>
			) : (
				<>
					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 6 }}
						showsVerticalScrollIndicator={false}
					>
						{allPrompts.map((prompt) => (
							<View
								key={prompt.id}
								style={{
									borderWidth: 2,
									borderColor:
										selectedPromptId === prompt.id ? theme.colors.primary : 'transparent',
									borderRadius: 12,
									overflow: 'visible',
									marginBottom: 12,
									backgroundColor: 'transparent',
								}}
							>
								<PromptPreview
									prompt={prompt}
									onPress={() => setSelectedPromptId(prompt.id)}
									isSelected={selectedPromptId === prompt.id}
									disableContextMenu={true}
								/>
							</View>
						))}

						{prompts.length === 0 && !isLoading && (
							<View style={{ padding: 20, alignItems: 'center' }}>
								<Text
									style={{
										color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
										textAlign: 'center',
									}}
								>
									{t('memo.no_prompts_available', 'Keine Prompts verfügbar')}
								</Text>
							</View>
						)}
					</ScrollView>

					{/* Mana Cost Display */}
					{selectedPromptId && (
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'center',
								marginTop: 16,
								paddingVertical: 8,
							}}
						>
							<ManaIcon size={16} color={theme.colors.primary} />
							<Text
								style={{
									marginLeft: 6,
									fontSize: 14,
									fontWeight: '600',
									color: theme.colors.primary,
								}}
							>
								{creditService.getOperationCostSync('CREATE_MEMORY')}
							</Text>
							<Text
								style={{
									marginLeft: 4,
									fontSize: 12,
									color: isDark ? '#888' : '#666',
								}}
							>
								Mana
							</Text>
						</View>
					)}
				</>
			)}

			{/* Central Loading Overlay */}
			<LoadingOverlay
				visible={isCreating}
				message={t('memory.creating', 'Memory wird erstellt...')}
			/>
		</BaseModal>
	);
};

export default CreateMemoryModal;
