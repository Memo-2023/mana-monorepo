import React, { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
	View,
	ScrollView,
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import colors from '~/tailwind.config.js';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import Input from '~/components/atoms/Input';
import Icon from '~/components/atoms/Icon';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { authService } from '~/features/auth/services/authService';
import { useHeader } from '~/features/menus/HeaderContext';
import { LANGUAGES } from '~/features/i18n';

// Mehrsprachiges Textfeld
type LocalizedText = Record<string, string>;

// Typdefinition für einen Abschnitt (Tipp + Prompt zusammen)
interface Section {
	id: string;
	tip: LocalizedText;
	prompt_title: LocalizedText;
	prompt_text: LocalizedText;
}

/**
 * Seite zum Erstellen eines neuen Blueprints mit Prompts
 *
 * Ermöglicht die Erstellung eines neuen Blueprints mit mehrsprachigen Inhalten
 * und zugehörigen Prompts.
 */
export default function CreateBlueprintPage() {
	const router = useRouter();
	const { blueprintId } = useLocalSearchParams<{ blueprintId?: string }>();
	const isEditMode = !!blueprintId;
	const { t, i18n } = useTranslation();
	const { isDark, themeVariant } = useTheme();
	const { updateConfig } = useHeader();

	// Theme-Farben aus der Tailwind-Konfiguration
	const themeColors = (colors as any).theme?.extend?.colors;
	const pageBackgroundColor = isDark
		? themeColors?.dark?.[themeVariant]?.pageBackground || '#121212'
		: themeColors?.[themeVariant]?.pageBackground || '#F5F5F5';
	const contentBackgroundColor = isDark
		? themeColors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
		: themeColors?.[themeVariant]?.contentBackground || '#FFFFFF';
	const borderColor = isDark
		? themeColors?.dark?.[themeVariant]?.border || '#424242'
		: themeColors?.[themeVariant]?.border || '#e6e6e6';
	const primaryButtonColor = isDark
		? themeColors?.dark?.[themeVariant]?.primaryButton || '#7C6B16'
		: themeColors?.[themeVariant]?.primaryButton || '#f8d62b';
	const primaryButtonTextColor = isDark
		? themeColors?.dark?.[themeVariant]?.primaryButtonText || '#ffffff'
		: themeColors?.[themeVariant]?.primaryButtonText || '#000000';
	const textColor = isDark ? '#FFFFFF' : '#000000';
	const textSecondaryColor = isDark ? '#CCCCCC' : '#666666';

	// Konfiguriere den Header beim Laden der Komponente
	useEffect(() => {
		// Verwende eine lokale Funktion, um die Header-Konfiguration zu aktualisieren
		// und vermeide so, updateConfig als Abhängigkeit hinzuzufügen
		const configureHeader = () => {
			updateConfig({
				title: isEditMode ? 'blueprints.edit_blueprint' : 'blueprints.create_new',
				showBackButton: true,
			});
		};

		configureHeader();

		// Cleanup-Funktion, die beim Verlassen der Seite aufgerufen wird
		return () => {
			// ENTFERNT: updateConfig überschreibt andere Seiten-Titel
			// Die nächste Seite wird ihre eigene Header-Konfiguration setzen
		};
	}, [isEditMode]); // Abhängig vom Modus
	const [supabaseClient, setSupabaseClient] = useState<any>(null);

	// Initialisiere den Supabase-Client und hole den aktuellen Benutzer
	useEffect(() => {
		const initSupabase = async () => {
			try {
				// Authentifizierten Client verwenden statt direktem Zugriff
				const authenticatedClient = await getAuthenticatedClient();

				console.debug('Authentifizierter Supabase-Client erstellt');
				setSupabaseClient(authenticatedClient);

				// Hole den Benutzer aus dem Token für spätere Verwendung
				const userData = await authService.getUserFromToken();
				if (userData) {
					console.debug('Benutzer aus Token gefunden:', userData.id);
				} else {
					console.debug('Kein Benutzer im Token gefunden');
				}
			} catch (err) {
				console.debug('Fehler beim Initialisieren des Supabase-Clients:', err);
				setError(
					t('common.error_connection', 'Verbindungsfehler. Bitte versuche es später erneut.')
				);
			}
		};

		initSupabase();
	}, [t]);

	// Aktuelle Systemsprache als Standardsprache (vor Edit-Modus-Effekt benötigt)
	const currentLang = i18n.language?.split('-')[0] || 'en';
	const defaultLang = currentLang in LANGUAGES ? currentLang : 'en';

	const [isLoadingBlueprint, setIsLoadingBlueprint] = useState(false);

	// Lade Blueprint-Daten im Edit-Modus
	useEffect(() => {
		if (!isEditMode || !supabaseClient || !blueprintId) return;

		const loadBlueprint = async () => {
			try {
				setIsLoadingBlueprint(true);
				setError(null);

				// Hole den aktuellen Benutzer
				const userData = await authService.getUserFromToken();
				if (!userData) {
					setError(t('auth.not_authenticated', 'Du bist nicht angemeldet.'));
					return;
				}

				// Blueprint laden
				const { data: bp, error: bpError } = await supabaseClient
					.from('blueprints')
					.select('*')
					.eq('id', blueprintId)
					.single();

				if (bpError || !bp) {
					setError(t('blueprints.error_loading', 'Blueprint konnte nicht geladen werden.'));
					return;
				}

				// Ownership prüfen
				if (bp.user_id !== userData.id) {
					setError(t('blueprints.error_not_owner', 'Du kannst nur eigene Blueprints bearbeiten.'));
					return;
				}

				// Sprachen erkennen aus den name-Keys
				const detectedLanguages = Object.keys(bp.name || {}).filter((k: string) =>
					bp.name[k]?.trim()
				);
				const langs = detectedLanguages.length > 0 ? detectedLanguages : [defaultLang];
				setActiveLanguages(langs);

				// Name und Beschreibung setzen
				setName(bp.name || { [defaultLang]: '' });
				setDescription(bp.description || { [defaultLang]: '' });
				setIsPublic(bp.is_public ?? true);

				// Tipps aus advice.sections extrahieren
				const tips = bp.advice?.sections || [];

				// Verknüpfte Prompts laden
				const { data: promptLinks } = await supabaseClient
					.from('prompt_blueprints')
					.select('prompt_id')
					.eq('blueprint_id', blueprintId);

				const promptIds = (promptLinks || []).map((l: { prompt_id: string }) => l.prompt_id);

				let loadedPrompts: any[] = [];
				if (promptIds.length > 0) {
					const { data: promptsData } = await supabaseClient
						.from('prompts')
						.select('*')
						.in('id', promptIds);

					loadedPrompts = (promptsData || []).sort((a: any, b: any) => {
						if (a.sort_order !== undefined && b.sort_order !== undefined) {
							return a.sort_order - b.sort_order;
						}
						return 0;
					});
				}

				// Sections zusammenbauen: Tipps und Prompts zusammenführen
				const maxCount = Math.max(tips.length, loadedPrompts.length);
				const loadedSections: Section[] = [];

				for (let i = 0; i < maxCount; i++) {
					const tip = tips[i];
					const prompt = loadedPrompts[i];

					loadedSections.push({
						id: `section_edit_${i}`,
						tip: tip?.content || Object.fromEntries(langs.map((l) => [l, ''])),
						prompt_title: prompt?.memory_title || Object.fromEntries(langs.map((l) => [l, ''])),
						prompt_text: prompt?.prompt_text || Object.fromEntries(langs.map((l) => [l, ''])),
					});
				}

				if (loadedSections.length > 0) {
					setSections(loadedSections);
				}
			} catch (err) {
				console.debug('Fehler beim Laden des Blueprints:', err);
				setError(t('common.error_unexpected', 'Ein unerwarteter Fehler ist aufgetreten.'));
			} finally {
				setIsLoadingBlueprint(false);
			}
		};

		loadBlueprint();
	}, [isEditMode, supabaseClient, blueprintId]);

	// Aktive Sprachen für die Blueprint-Inhalte (Standard: nur Systemsprache)
	const [activeLanguages, setActiveLanguages] = useState<string[]>([defaultLang]);
	const [showLanguagePicker, setShowLanguagePicker] = useState(false);

	// Verfügbare Sprachen (alle aus LANGUAGES, sortiert)
	const availableLanguages = useMemo(() => {
		return Object.entries(LANGUAGES)
			.map(([code, info]) => ({ code, ...info }))
			.sort((a, b) => a.nativeName.localeCompare(b.nativeName));
	}, []);

	const toggleLanguage = (langCode: string) => {
		if (activeLanguages.includes(langCode)) {
			// Mindestens eine Sprache muss aktiv bleiben
			if (activeLanguages.length > 1) {
				setActiveLanguages(activeLanguages.filter((l) => l !== langCode));
			}
		} else {
			setActiveLanguages([...activeLanguages, langCode]);
		}
	};

	// Blueprint-Daten (dynamisch pro Sprache)
	const [name, setName] = useState<LocalizedText>({ [defaultLang]: '' });
	const [description, setDescription] = useState<LocalizedText>({ [defaultLang]: '' });
	const [isPublic, setIsPublic] = useState(true);

	// Abschnitte (jeweils Tipp + Prompt zusammen)
	const [sections, setSections] = useState<Section[]>([
		{
			id: 'section1',
			tip: { [defaultLang]: '' },
			prompt_title: { [defaultLang]: '' },
			prompt_text: { [defaultLang]: '' },
		},
	]);

	// Status
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Styles
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: pageBackgroundColor,
		},
		card: {
			backgroundColor: contentBackgroundColor,
			borderRadius: 16,
			padding: 16,
			marginBottom: 16,
			borderWidth: 1,
			borderColor: borderColor,
		},
		sectionTitle: {
			fontSize: 22,
			fontWeight: 'bold',
			color: textColor,
			marginTop: 24,
			marginBottom: 16,
			paddingLeft: 4,
		},
		firstSectionTitle: {
			marginTop: 8,
		},
		label: {
			fontSize: 14,
			color: textSecondaryColor,
			marginBottom: 8,
		},
		fieldGroup: {
			marginBottom: 16,
		},
		cardHeader: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: 16,
		},
		cardTitle: {
			fontSize: 16,
			fontWeight: '600',
			color: textColor,
		},
		subsectionTitle: {
			fontSize: 14,
			fontWeight: '600',
			color: textSecondaryColor,
			textTransform: 'uppercase',
			letterSpacing: 0.5,
			marginBottom: 12,
		},
		errorCard: {
			backgroundColor: isDark ? 'rgba(231, 76, 60, 0.15)' : 'rgba(231, 76, 60, 0.1)',
			borderRadius: 12,
			padding: 16,
			marginBottom: 16,
			borderWidth: 1,
			borderColor: isDark ? 'rgba(231, 76, 60, 0.3)' : 'rgba(231, 76, 60, 0.2)',
		},
		languageChip: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 12,
			paddingVertical: 8,
			borderRadius: 20,
			marginRight: 8,
			marginBottom: 8,
			borderWidth: 1,
		},
		languageChipActive: {
			backgroundColor: primaryButtonColor,
			borderColor: primaryButtonColor,
		},
		languageChipInactive: {
			backgroundColor: 'transparent',
			borderColor: borderColor,
		},
	});

	// Füge einen neuen Abschnitt hinzu
	const addSection = () => {
		const newId = `section${Date.now()}`;
		const emptyLocalized: LocalizedText = {};
		activeLanguages.forEach((lang) => {
			emptyLocalized[lang] = '';
		});
		setSections([
			...sections,
			{
				id: newId,
				tip: { ...emptyLocalized },
				prompt_title: { ...emptyLocalized },
				prompt_text: { ...emptyLocalized },
			},
		]);
	};

	// Aktualisiere ein Feld eines Abschnitts
	const updateSection = (
		id: string,
		field: 'tip' | 'prompt_title' | 'prompt_text',
		language: string,
		value: string
	) => {
		setSections(
			sections.map((section) => {
				if (section.id === id) {
					return {
						...section,
						[field]: {
							...section[field],
							[language]: value,
						},
					};
				}
				return section;
			})
		);
	};

	// Entferne einen Abschnitt
	const removeSection = (id: string) => {
		setSections(sections.filter((section) => section.id !== id));
	};

	// Prüft ob ein LocalizedText mindestens in einer Sprache ausgefüllt ist
	const hasContent = (text: LocalizedText) => Object.values(text).some((v) => v.trim() !== '');

	// Validiere die Eingaben
	const validateForm = () => {
		if (!hasContent(name)) {
			setError(t('blueprints.error_name_required', 'Bitte gib einen Namen für den Blueprint ein.'));
			return false;
		}

		const hasValidSection = sections.some(
			(section) =>
				hasContent(section.tip) &&
				hasContent(section.prompt_title) &&
				hasContent(section.prompt_text)
		);

		if (!hasValidSection) {
			setError(
				t(
					'blueprints.error_section_required',
					'Bitte fülle mindestens einen Abschnitt vollständig aus (Tipp + Prompt).'
				)
			);
			return false;
		}

		return true;
	};

	// Speichere den Blueprint über eine API-Route
	const saveBlueprint = async () => {
		console.debug('🔍 saveBlueprint: Funktion gestartet');

		console.debug('🔍 saveBlueprint: Validiere Formular');

		if (!validateForm()) {
			console.debug('❌ saveBlueprint: Formularvalidierung fehlgeschlagen');
			return;
		}

		console.debug('✅ saveBlueprint: Formularvalidierung erfolgreich');

		console.debug('🔍 saveBlueprint: Prüfe Supabase-Client', { clientExists: !!supabaseClient });

		if (!supabaseClient) {
			console.debug('❌ saveBlueprint: Kein Supabase-Client vorhanden');
			setError(t('common.error_connection', 'Verbindungsfehler. Bitte versuche es später erneut.'));
			return;
		}

		try {
			console.debug('🔍 saveBlueprint: Starte Speichervorgang');
			setIsSubmitting(true);
			setError(null);

			// Hole den aktuellen Benutzer aus dem Token

			console.debug('🔍 saveBlueprint: Hole Benutzer aus Token');
			const userData = await authService.getUserFromToken();

			if (!userData) {
				console.debug('❌ saveBlueprint: Kein Benutzer im Token gefunden');
				setError(t('auth.not_authenticated', 'Du bist nicht angemeldet.'));
				return;
			}

			console.debug('✅ saveBlueprint: Benutzer gefunden', { userId: userData.id });

			// Verwende die Benutzer-ID aus dem Token
			const userId = userData.id;

			// Extrahiere Tipps und Prompts aus den Abschnitten
			const validSections = sections.filter(
				(section) => hasContent(section.tip) || hasContent(section.prompt_title)
			);

			// Erstelle ein Array für die Tipps im Format der bestehenden Einträge
			const tipsArray = validSections
				.filter((s) => hasContent(s.tip))
				.map((section, index) => ({
					id: `tip${index + 1}`,
					order: index + 1,
					content: section.tip,
				}));

			// Advice-Struktur
			const adviceData = {
				metadata: {
					version: '1.0',
					lastUpdated: new Date().toISOString(),
					supportedLanguages: activeLanguages,
				},
				sections: tipsArray,
			};

			let blueprintRecordId: string;

			if (isEditMode && blueprintId) {
				// UPDATE bestehenden Blueprint
				console.debug('🔍 saveBlueprint: Aktualisiere Blueprint', { blueprintId });

				const { error: updateError } = await supabaseClient
					.from('blueprints')
					.update({
						name,
						description,
						is_public: isPublic,
						advice: adviceData,
					})
					.eq('id', blueprintId);

				if (updateError) {
					console.debug('❌ saveBlueprint: Fehler beim Aktualisieren des Blueprints:', updateError);
					setError(t('blueprints.error_update', 'Der Blueprint konnte nicht aktualisiert werden.'));
					return;
				}

				blueprintRecordId = blueprintId;

				// Bestehende Prompt-Links und Prompts löschen
				const { data: oldLinks } = await supabaseClient
					.from('prompt_blueprints')
					.select('prompt_id')
					.eq('blueprint_id', blueprintId);

				if (oldLinks && oldLinks.length > 0) {
					// Links löschen
					await supabaseClient.from('prompt_blueprints').delete().eq('blueprint_id', blueprintId);

					// Alte Prompts löschen
					const oldPromptIds = oldLinks.map((l: { prompt_id: string }) => l.prompt_id);
					await supabaseClient.from('prompts').delete().in('id', oldPromptIds);
				}

				console.debug('✅ saveBlueprint: Blueprint erfolgreich aktualisiert');
			} else {
				// INSERT neuen Blueprint
				console.debug('🔍 saveBlueprint: Erstelle Blueprint in der Datenbank', {
					userId,
					name,
					isPublic,
					tipsCount: tipsArray.length,
				});

				const { data: blueprint, error: blueprintError } = await supabaseClient
					.from('blueprints')
					.insert({
						user_id: userId,
						name,
						description,
						is_public: isPublic,
						advice: adviceData,
					})
					.select('id')
					.single();

				if (blueprintError) {
					console.debug('❌ saveBlueprint: Fehler beim Erstellen des Blueprints:', blueprintError);
					setError(t('blueprints.error_create', 'Der Blueprint konnte nicht erstellt werden.'));
					return;
				}

				blueprintRecordId = blueprint.id;
				console.debug('✅ saveBlueprint: Blueprint erfolgreich erstellt', {
					blueprintId: blueprint?.id,
				});
			}

			// Die Advice-Tipps wurden bereits im Blueprint gespeichert

			// Speichere die Prompts (aus den Abschnitten extrahiert)
			const validPrompts = validSections.filter(
				(s) => hasContent(s.prompt_title) && hasContent(s.prompt_text)
			);

			console.debug('🔍 saveBlueprint: Gültige Prompts gefunden', { count: validPrompts.length });

			const createdPrompts = [];
			for (const section of validPrompts) {
				try {
					const { data: promptData, error: promptError } = await supabaseClient
						.from('prompts')
						.insert({
							prompt_text: section.prompt_text,
							memory_title: section.prompt_title,
							is_public: isPublic,
							user_id: userId,
						})
						.select('id')
						.single();

					if (promptError) {
						console.debug('❌ saveBlueprint: Fehler beim Erstellen eines Prompts:', promptError);
						continue;
					}

					console.debug('✅ saveBlueprint: Prompt erfolgreich erstellt', {
						promptId: promptData?.id,
					});

					if (promptData) {
						createdPrompts.push(promptData.id);
					}
				} catch (err) {
					console.debug('Unerwarteter Fehler beim Erstellen eines Prompts:', err);
				}
			}

			// Erstelle dann alle Verknüpfungen in einer einzigen Operation
			if (createdPrompts.length > 0) {
				try {
					console.debug('🔍 saveBlueprint: Erstelle Verknüpfungen zwischen Blueprint und Prompts', {
						blueprintId: blueprintRecordId,
						promptIds: createdPrompts,
					});

					// Erstelle ein Array von Verknüpfungsobjekten
					const promptLinks = createdPrompts.map((promptId) => {
						console.debug('🔍 saveBlueprint: Erstelle Verknüpfung für Prompt ID:', promptId);
						return {
							blueprint_id: blueprintRecordId,
							prompt_id: promptId,
						};
					});

					console.debug('🔍 saveBlueprint: Verknüpfungsobjekte:', JSON.stringify(promptLinks));

					// Füge alle Verknüpfungen in einer einzigen Operation ein

					console.debug('🔍 saveBlueprint: Füge Verknüpfungen in die Datenbank ein');
					const { data: linkData, error: linkError } = await supabaseClient
						.from('prompt_blueprints')
						.insert(promptLinks)
						.select();

					if (linkError) {
						console.debug('❌ saveBlueprint: Fehler beim Verknüpfen der Prompts:', linkError);
					} else {
						console.debug('✅ saveBlueprint: Verknüpfungen erfolgreich erstellt', {
							count: linkData?.length,
						});
					}
				} catch (err) {
					console.debug('❌ saveBlueprint: Unerwarteter Fehler beim Verknüpfen der Prompts:', err);
				}
			} else {
				console.debug('ℹ️ saveBlueprint: Keine Prompts zum Verknüpfen vorhanden.');
			}

			if (isEditMode) {
				// Im Edit-Modus: zurück navigieren
				Alert.alert(
					t('blueprints.success_updated_title', 'Blueprint aktualisiert'),
					t('blueprints.success_updated_message', 'Dein Blueprint wurde erfolgreich aktualisiert.')
				);
				router.back();
			} else {
				// Im Create-Modus: zur Homepage navigieren und Blueprint auswählen
				try {
					console.debug('🔍 saveBlueprint: Speichere Blueprint-ID im AsyncStorage', {
						blueprintId: blueprintRecordId,
					});
					await AsyncStorage.setItem('selectedBlueprintId', blueprintRecordId);

					router.push('/');

					Alert.alert(
						t('blueprints.success_title', 'Blueprint erstellt'),
						t(
							'blueprints.success_message',
							'Dein Blueprint wurde erfolgreich erstellt und ausgewählt.'
						)
					);
				} catch (error) {
					console.debug('❌ saveBlueprint: Fehler beim Speichern der Blueprint-ID:', error);
					router.push('/');
				}
			}
		} catch (err) {
			console.debug('❌ saveBlueprint: Unerwarteter Fehler:', err);
			setError(t('common.error_unexpected', 'Ein unerwarteter Fehler ist aufgetreten.'));
		} finally {
			console.debug('🔍 saveBlueprint: Funktion abgeschlossen, setze isSubmitting auf false');
			setIsSubmitting(false);
		}
	};

	// Zeige Ladeindikator, wenn der Supabase-Client noch nicht initialisiert ist
	if ((!supabaseClient && !error) || isLoadingBlueprint) {
		return (
			<View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
				<ActivityIndicator size="large" color={primaryButtonColor} />
				<Text style={{ marginTop: 16, fontSize: 16, color: textSecondaryColor }}>
					{t('common.loading', 'Wird geladen...')}
				</Text>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={{ flex: 1, width: '100%' }}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
		>
			<View style={styles.container}>
				<ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
					<View style={{ alignItems: 'center', paddingBottom: 0, marginBottom: 24 }}>
						<Text
							style={{
								fontSize: 40,
								lineHeight: 40,
								fontWeight: '700',
								color: textColor,
								alignSelf: 'center',
							}}
							numberOfLines={1}
						>
							{isEditMode
								? t('blueprints.edit_blueprint', 'Vorlage bearbeiten')
								: t('blueprints.create_new', 'Neue Vorlage')}
						</Text>
					</View>
					{error && (
						<View style={styles.errorCard}>
							<Text style={{ color: '#e74c3c', textAlign: 'center', fontSize: 14 }}>{error}</Text>
						</View>
					)}

					{/* Sprachen */}
					<Text style={[styles.sectionTitle, styles.firstSectionTitle]}>
						{t('blueprints.languages', 'Sprachen')}
					</Text>
					<View style={styles.card}>
						<View
							style={{
								flexDirection: 'row',
								flexWrap: 'wrap',
								marginBottom: showLanguagePicker ? 16 : 0,
							}}
						>
							{activeLanguages.map((langCode) => {
								const lang = LANGUAGES[langCode as keyof typeof LANGUAGES];
								return (
									<View key={langCode} style={[styles.languageChip, styles.languageChipActive]}>
										<Text
											style={{ color: primaryButtonTextColor, fontSize: 14, fontWeight: '500' }}
										>
											{lang?.emoji} {lang?.nativeName || langCode}
										</Text>
										{activeLanguages.length > 1 && (
											<Pressable onPress={() => toggleLanguage(langCode)} style={{ marginLeft: 8 }}>
												<Icon name="close" size={14} color={primaryButtonTextColor} />
											</Pressable>
										)}
									</View>
								);
							})}
							<Pressable
								onPress={() => setShowLanguagePicker(!showLanguagePicker)}
								style={[styles.languageChip, styles.languageChipInactive]}
							>
								<Icon
									name={showLanguagePicker ? 'chevron-up' : 'add'}
									size={16}
									color={textSecondaryColor}
								/>
								<Text style={{ color: textSecondaryColor, fontSize: 14, marginLeft: 4 }}>
									{t('blueprints.add_language', 'Sprache')}
								</Text>
							</Pressable>
						</View>

						{showLanguagePicker && (
							<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
								{availableLanguages
									.filter((lang) => !activeLanguages.includes(lang.code))
									.map((lang) => (
										<Pressable
											key={lang.code}
											onPress={() => toggleLanguage(lang.code)}
											style={[styles.languageChip, styles.languageChipInactive]}
										>
											<Text style={{ color: textColor, fontSize: 13 }}>
												{lang.emoji} {lang.nativeName}
											</Text>
										</Pressable>
									))}
							</View>
						)}
					</View>

					{/* Blueprint-Grunddaten */}
					<Text style={styles.sectionTitle}>
						{t('blueprints.basic_info', 'Grundinformationen')}
					</Text>
					<View style={styles.card}>
						{activeLanguages.map((langCode, langIdx) => {
							const lang = LANGUAGES[langCode as keyof typeof LANGUAGES];
							const langLabel = lang?.nativeName || langCode;
							const isLast = langIdx === activeLanguages.length - 1;
							return (
								<React.Fragment key={langCode}>
									{activeLanguages.length > 1 && (
										<Text style={[styles.subsectionTitle, langIdx > 0 && { marginTop: 8 }]}>
											{lang?.emoji} {langLabel}
										</Text>
									)}
									<View style={styles.fieldGroup}>
										<Text style={styles.label}>
											{t('blueprints.name', 'Name')}
											{activeLanguages.length === 1 ? '' : ` (${langLabel})`}
										</Text>
										<Input
											value={name[langCode] || ''}
											onChangeText={(text) => setName((prev) => ({ ...prev, [langCode]: text }))}
											placeholder={t('blueprints.name_placeholder', 'z.B. Textanalyse')}
										/>
									</View>
									<View style={isLast ? { marginBottom: 0 } : styles.fieldGroup}>
										<Text style={styles.label}>
											{t('blueprints.description', 'Beschreibung')}
											{activeLanguages.length === 1 ? '' : ` (${langLabel})`}
										</Text>
										<Input
											value={description[langCode] || ''}
											onChangeText={(text) =>
												setDescription((prev) => ({ ...prev, [langCode]: text }))
											}
											placeholder={t(
												'blueprints.description_placeholder',
												'Beschreibe den Zweck dieses Blueprints...'
											)}
											textArea
											numberOfLines={4}
										/>
									</View>
								</React.Fragment>
							);
						})}
					</View>

					{/* Abschnitte (Tipp + Prompt pro Karte) */}
					<View
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginTop: 24,
							marginBottom: 16,
						}}
					>
						<Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
							{t('blueprints.sections', 'Abschnitte')}
						</Text>
						<Button
							onPress={addSection}
							title={t('common.add', 'Hinzufügen')}
							variant="secondary"
							iconName="add"
						/>
					</View>

					{sections.map((section, index) => (
						<View key={section.id} style={styles.card}>
							<View style={styles.cardHeader}>
								<Text style={styles.cardTitle}>
									{t('blueprints.section_number', 'Abschnitt {{number}}', { number: index + 1 })}
								</Text>
								{sections.length > 1 && (
									<Button
										onPress={() => removeSection(section.id)}
										iconName="trash-outline"
										variant="danger"
										iconSize={18}
									/>
								)}
							</View>

							{/* Tipp */}
							<Text style={styles.subsectionTitle}>{t('blueprints.advice_tip', 'Tipp')}</Text>
							{activeLanguages.map((langCode) => {
								const lang = LANGUAGES[langCode as keyof typeof LANGUAGES];
								const langLabel = lang?.nativeName || langCode;
								return (
									<View key={langCode} style={styles.fieldGroup}>
										<Text style={styles.label}>
											{activeLanguages.length > 1
												? `${lang?.emoji} ${langLabel}`
												: t('blueprints.tip_content', 'Inhalt')}
										</Text>
										<Input
											value={section.tip[langCode] || ''}
											onChangeText={(text) => updateSection(section.id, 'tip', langCode, text)}
											placeholder={t(
												'blueprints.tip_placeholder',
												'Gib einen hilfreichen Tipp ein...'
											)}
											textArea
											numberOfLines={3}
										/>
									</View>
								);
							})}

							{/* Divider */}
							<View style={{ height: 1, backgroundColor: borderColor, marginVertical: 16 }} />

							{/* Prompt */}
							<Text style={styles.subsectionTitle}>{t('blueprints.prompt', 'Prompt')}</Text>
							{activeLanguages.map((langCode) => {
								const lang = LANGUAGES[langCode as keyof typeof LANGUAGES];
								const langLabel = lang?.nativeName || langCode;
								return (
									<React.Fragment key={langCode}>
										{activeLanguages.length > 1 && (
											<Text style={[styles.subsectionTitle, { fontSize: 13, marginTop: 4 }]}>
												{lang?.emoji} {langLabel}
											</Text>
										)}
										<View style={styles.fieldGroup}>
											<Text style={styles.label}>
												{t('blueprints.prompt_title', 'Titel')}
												{activeLanguages.length === 1 ? '' : ` (${langLabel})`}
											</Text>
											<Input
												value={section.prompt_title[langCode] || ''}
												onChangeText={(text) =>
													updateSection(section.id, 'prompt_title', langCode, text)
												}
												placeholder={t(
													'blueprints.prompt_title_placeholder',
													'z.B. Zusammenfassung'
												)}
											/>
										</View>
										<View style={styles.fieldGroup}>
											<Text style={styles.label}>
												{t('blueprints.prompt_text', 'Prompt-Text')}
												{activeLanguages.length === 1 ? '' : ` (${langLabel})`}
											</Text>
											<Input
												value={section.prompt_text[langCode] || ''}
												onChangeText={(text) =>
													updateSection(section.id, 'prompt_text', langCode, text)
												}
												placeholder={t(
													'blueprints.prompt_text_placeholder',
													'z.B. Fasse den folgenden Text ausführlich zusammen'
												)}
												textArea
												numberOfLines={3}
											/>
										</View>
									</React.Fragment>
								);
							})}
						</View>
					))}

					{/* Speichern-Button */}
					<View style={{ marginTop: 8, marginBottom: 40 }}>
						<Button
							onPress={() => {
								console.debug('BUTTON CLICK: Speichern-Button wurde geklickt');
								saveBlueprint();
							}}
							title={
								isEditMode ? t('common.update', 'Aktualisieren') : t('common.save', 'Speichern')
							}
							variant="primary"
							loading={isSubmitting}
							disabled={isSubmitting}
						/>
					</View>
				</ScrollView>
			</View>
		</KeyboardAvoidingView>
	);
}
