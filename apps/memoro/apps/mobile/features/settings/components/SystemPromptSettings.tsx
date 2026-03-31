import React, { useState, useEffect } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import { useUserSettings } from '../hooks/useUserSettings';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useToast } from '~/features/toast';
import colors from '~/tailwind.config.js';

const DEFAULT_SYSTEM_PROMPTS: Record<string, string> = {
	de: 'Du bist ein hilfreicher Assistent, der Texte analysiert und verarbeitet. Deine Aufgabe ist es, Transkripte von Gesprächen gemäß den gegebenen Anweisungen zu bearbeiten. Antworte in Markdown mit einem schönen Format. Nutze keine Tabellen und keinen Code in Markdown. Antworte präzise, strukturiert und hilfreich.',
	en: 'You are a helpful assistant that analyzes and processes texts. Your task is to process conversation transcripts according to the given instructions. Respond in Markdown with a nice format. Do not use tables or code in Markdown. Respond precisely, structured, and helpfully.',
};

export function SystemPromptSettings() {
	const { t, i18n } = useTranslation();
	const { isDark, themeVariant } = useTheme();
	const { settings, loading, updateMemoroSettings } = useUserSettings();
	const [isEditing, setIsEditing] = useState(false);
	const [promptText, setPromptText] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const { showSuccess, showError } = useToast();

	const baseLang = i18n.language?.split('-')[0]?.toLowerCase() || 'de';
	const defaultPrompt = DEFAULT_SYSTEM_PROMPTS[baseLang] || DEFAULT_SYSTEM_PROMPTS['de'];

	const themeColors = (colors as any).theme?.extend?.colors;
	const containerBgColor = isDark
		? themeColors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
		: themeColors?.[themeVariant]?.contentBackground || '#FFFFFF';
	const containerBorderColor = isDark
		? themeColors?.dark?.[themeVariant]?.border || '#424242'
		: themeColors?.[themeVariant]?.border || '#e6e6e6';
	const primaryColor = isDark
		? themeColors?.dark?.[themeVariant]?.primary || '#f8d62b'
		: themeColors?.[themeVariant]?.primary || '#f8d62b';
	const textColor = isDark ? '#FFFFFF' : '#000000';
	const subtextColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';

	const currentPrompt = settings.systemPrompt || defaultPrompt;

	useEffect(() => {
		setPromptText(currentPrompt);
	}, [currentPrompt]);

	const hasChanges = promptText !== currentPrompt;

	const handleSave = async () => {
		setIsSaving(true);
		try {
			// Wenn der Text dem Default entspricht, keinen custom prompt speichern
			const trimmed = promptText.trim();
			const isDefault = trimmed === defaultPrompt || !trimmed;
			await updateMemoroSettings({ systemPrompt: isDefault ? undefined : trimmed });
			setIsEditing(false);
			showSuccess(
				t('settings.system_prompt_saved', 'System-Prompt gespeichert'),
				t(
					'settings.system_prompt_saved_message',
					'Dein persönlicher System-Prompt wurde aktualisiert.'
				)
			);
		} catch (err) {
			showError(
				t('settings.error', 'Fehler'),
				t('settings.system_prompt_error', 'System-Prompt konnte nicht gespeichert werden.')
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleReset = async () => {
		setIsSaving(true);
		try {
			await updateMemoroSettings({ systemPrompt: undefined });
			setPromptText(defaultPrompt);
			setIsEditing(false);
			showSuccess(
				t('settings.system_prompt_reset', 'System-Prompt zurückgesetzt'),
				t(
					'settings.system_prompt_reset_message',
					'Der Standard-System-Prompt wird wieder verwendet.'
				)
			);
		} catch (err) {
			showError(
				t('settings.error', 'Fehler'),
				t('settings.system_prompt_error', 'System-Prompt konnte nicht gespeichert werden.')
			);
		} finally {
			setIsSaving(false);
		}
	};

	const styles = StyleSheet.create({
		container: {
			backgroundColor: containerBgColor,
			borderColor: containerBorderColor,
			borderWidth: 1,
			borderRadius: 16,
			overflow: 'hidden',
		},
		content: {
			paddingHorizontal: 16,
			paddingVertical: 20,
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: 8,
		},
		title: {
			fontSize: 16,
			fontWeight: '600',
			color: textColor,
			flex: 1,
			marginRight: 8,
		},
		description: {
			fontSize: 14,
			color: subtextColor,
			lineHeight: 22,
			marginBottom: isEditing ? 12 : 0,
		},
		textInput: {
			backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
			borderColor: containerBorderColor,
			borderWidth: 1,
			borderRadius: 12,
			padding: 12,
			fontSize: 14,
			color: textColor,
			minHeight: 120,
			textAlignVertical: 'top',
		},
		previewText: {
			fontSize: 14,
			color: subtextColor,
			fontStyle: 'italic',
			marginTop: 8,
		},
		buttonRow: {
			flexDirection: 'row',
			justifyContent: 'flex-end',
			gap: 8,
			marginTop: 12,
		},
		button: {
			paddingHorizontal: 16,
			paddingVertical: 8,
			borderRadius: 8,
			flexDirection: 'row',
			alignItems: 'center',
			gap: 4,
		},
		saveButton: {
			backgroundColor: primaryColor,
		},
		resetButton: {
			backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
		},
		cancelButton: {
			backgroundColor: 'transparent',
		},
		buttonText: {
			fontSize: 14,
			fontWeight: '600',
		},
	});

	if (!isEditing) {
		return (
			<Pressable style={styles.container} onPress={() => setIsEditing(true)}>
				<View style={styles.content}>
					<View style={styles.header}>
						<Text style={styles.title}>{t('settings.system_prompt', 'System-Prompt')}</Text>
						<Icon name="create-outline" size={18} color={subtextColor} />
					</View>
					<Text style={styles.description}>
						{t(
							'settings.system_prompt_description',
							'Definiere einen persönlichen System-Prompt, der allen KI-Antworten vorangestellt wird.'
						)}
					</Text>
					<Text style={styles.previewText} numberOfLines={3}>
						{currentPrompt}
					</Text>
					{!settings.systemPrompt && (
						<Text style={[styles.previewText, { fontStyle: 'normal', opacity: 0.5, marginTop: 4 }]}>
							{t('settings.system_prompt_default_label', '(Standard)')}
						</Text>
					)}
				</View>
			</Pressable>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>{t('settings.system_prompt', 'System-Prompt')}</Text>
				</View>
				<Text style={styles.description}>
					{t(
						'settings.system_prompt_edit_hint',
						'Dieser Text wird allen KI-Antworten vorangestellt. Leer lassen für den Standard-Prompt.'
					)}
				</Text>
				<TextInput
					style={styles.textInput}
					value={promptText}
					onChangeText={setPromptText}
					placeholder={t(
						'settings.system_prompt_placeholder',
						'z.B. "Antworte immer auf Deutsch und in informellem Ton."'
					)}
					placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
					multiline
					autoFocus
					editable={!isSaving}
				/>
				<View style={styles.buttonRow}>
					{settings.systemPrompt ? (
						<Pressable
							style={[styles.button, styles.resetButton]}
							onPress={handleReset}
							disabled={isSaving}
						>
							<Text style={[styles.buttonText, { color: isDark ? '#FF6B6B' : '#DC3545' }]}>
								{t('settings.reset', 'Zurücksetzen')}
							</Text>
						</Pressable>
					) : null}
					<Pressable
						style={[styles.button, styles.cancelButton]}
						onPress={() => {
							setPromptText(currentPrompt);
							setIsEditing(false);
						}}
						disabled={isSaving}
					>
						<Text style={[styles.buttonText, { color: subtextColor }]}>
							{t('common.cancel', 'Abbrechen')}
						</Text>
					</Pressable>
					<Pressable
						style={[
							styles.button,
							styles.saveButton,
							(!hasChanges || isSaving) && { opacity: 0.5 },
						]}
						onPress={handleSave}
						disabled={!hasChanges || isSaving}
					>
						<Text style={[styles.buttonText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
							{isSaving ? t('common.saving', 'Speichern...') : t('common.save', 'Speichern')}
						</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);
}
