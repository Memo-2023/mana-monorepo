import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Share, ScrollView } from 'react-native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '~/features/theme/ThemeProvider';
import Button from '~/components/atoms/Button';
import SelectableItem from '~/components/atoms/SelectableItem';
import BaseModal from '~/components/atoms/BaseModal';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { useToast } from '~/features/toast';

interface MemoryItem {
	id: string;
	title: string;
	content: string;
	isSelected: boolean;
}

interface ShareModalProps {
	visible: boolean;
	onClose: () => void;
	title: string;
	intro?: string;
	memories: Array<{
		id: string;
		title: string;
		content: string;
	}>;
	transcript?: string;
	audioUrl?: string;
}

/**
 * Ein Modal zum Teilen von Memo-Inhalten.
 * Ermöglicht die Auswahl von Memories, Transkript und Audio-URL.
 */
const ShareModal = ({
	visible,
	onClose,
	title: initialTitle,
	intro: initialIntro,
	memories,
	transcript,
	audioUrl,
}: ShareModalProps): React.ReactElement => {
	const { isDark, colors } = useTheme();
	const { t } = useTranslation();
	const { showSuccess } = useToast();

	// State für den editierbaren Titel und Intro
	const [shareTitle, setShareTitle] = useState(initialTitle);
	const [shareIntro, setShareIntro] = useState(initialIntro || '');
	const [isIntroSelected, setIsIntroSelected] = useState(!!initialIntro);

	// State für die auswählbaren Memories
	const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);

	// State für die Auswahl von Transkript und Audio
	const [isTranscriptSelected, setIsTranscriptSelected] = useState(false);
	const [isAudioSelected, setIsAudioSelected] = useState(false);

	// State für das Export-Format
	const [exportFormat, setExportFormat] = useState<'plain' | 'markdown'>('plain');

	// Hilfsfunktion zum Entfernen von Markdown-Formatierungen
	const stripMarkdown = (text: string): string => {
		return (
			text
				// Entferne Bold-Markierungen
				.replace(/\*\*(.*?)\*\*/g, '$1')
				// Entferne Italic-Markierungen
				.replace(/\*(.*?)\*/g, '$1')
				// Entferne Inline-Code
				.replace(/`(.*?)`/g, '$1')
				// Entferne Links, behalte nur den Text
				.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
				// Entferne Überschriften-Markierungen
				.replace(/^#{1,6}\s+/gm, '')
				// Entferne Blockquotes
				.replace(/^>\s+/gm, '')
				// Entferne horizontale Linien
				.replace(/^---+$/gm, '')
				// Entferne mehrfache Leerzeilen
				.replace(/\n{3,}/g, '\n\n')
				.trim()
		);
	};

	// Aktualisiere die Memories, wenn sich die Props ändern
	useEffect(() => {
		setMemoryItems(
			memories.map((memory) => ({
				...memory,
				isSelected: true, // Standardmäßig alle ausgewählt
			}))
		);

		// Setze den Titel und Intro zurück, wenn sich die Props ändern
		setShareTitle(initialTitle);
		setShareIntro(initialIntro || '');
		setIsIntroSelected(!!initialIntro);

		// Setze die Auswahl zurück
		setIsTranscriptSelected(false);
		setIsAudioSelected(false); // Audio ist standardmäßig nicht ausgewählt
	}, [memories, initialTitle, initialIntro]);

	// Toggle die Auswahl eines Memory-Items
	const toggleMemorySelection = (id: string) => {
		setMemoryItems(
			memoryItems.map((item) => (item.id === id ? { ...item, isSelected: !item.isSelected } : item))
		);
	};

	// Erstelle den zu teilenden Text basierend auf der Auswahl
	const createShareText = () => {
		if (exportFormat === 'markdown') {
			// Markdown-Format
			let text = `# ${shareTitle}\n\n`;

			// Füge Intro hinzu, wenn ausgewählt
			if (isIntroSelected && shareIntro) {
				text += `${shareIntro}\n\n`;
			}

			// Füge ausgewählte Memories hinzu
			const selectedMemories = memoryItems.filter((item) => item.isSelected);
			if (selectedMemories.length > 0) {
				selectedMemories.forEach((memory) => {
					text += `## ${memory.title}\n\n${memory.content}\n\n`;
				});
			}

			// Füge Transkript hinzu, wenn ausgewählt
			if (isTranscriptSelected && transcript) {
				text += `## ${t('memo.transcript', 'Transkript')}\n\n${transcript}\n\n`;
			}

			// Füge Audio-URL hinzu, wenn ausgewählt
			if (isAudioSelected && audioUrl) {
				text += `**${t('memo.audio', 'Audio')}:** [${t('memo.audio_link', 'Audio-Link')}](${audioUrl})\n\n`;
			}

			return text.trim();
		} else {
			// Plain-Text-Format (bestehend)
			// Entferne Markdown-Formatierungen aus dem Titel
			let text = `${stripMarkdown(shareTitle)}\n\n`;

			// Füge Intro hinzu, wenn ausgewählt
			if (isIntroSelected && shareIntro) {
				text += `${stripMarkdown(shareIntro)}\n\n`;
			}

			// Füge ausgewählte Memories hinzu
			const selectedMemories = memoryItems.filter((item) => item.isSelected);
			if (selectedMemories.length > 0) {
				selectedMemories.forEach((memory) => {
					// Entferne Markdown-Formatierungen aus dem Inhalt
					const cleanTitle = stripMarkdown(memory.title);
					const cleanContent = stripMarkdown(memory.content);
					text += `${cleanTitle}\n${cleanContent}\n\n`;
				});
			}

			// Füge Transkript hinzu, wenn ausgewählt
			if (isTranscriptSelected && transcript) {
				text += `${t('memo.transcript', 'Transkript')}:\n${transcript}\n\n`;
			}

			// Füge Audio-URL hinzu, wenn ausgewählt
			if (isAudioSelected && audioUrl) {
				text += `${t('memo.audio', 'Audio')}: ${audioUrl}\n\n`;
			}

			return text.trim();
		}
	};

	// Kopiere den Text in die Zwischenablage
	const handleCopy = async () => {
		const text = createShareText();
		await Clipboard.setStringAsync(text);
		showSuccess(
			t('memo.copy_success_title', 'Kopiert!'),
			t('memo.copy_success_message', 'Inhalt wurde in die Zwischenablage kopiert')
		);
		onClose();
	};

	// Teile den Text über das System-Share-Sheet
	const handleShare = async () => {
		const text = createShareText();
		try {
			await Share.share({
				message: text,
			});
		} catch (error) {
			console.debug('Error sharing:', error);
		}
		onClose();
	};

	// Dynamische Styles basierend auf dem Theme
	const styles = StyleSheet.create({
		contentWrapper: {
			flex: 1,
			paddingHorizontal: 20,
			paddingTop: 12,
			paddingBottom: 0,
		},
		titleInput: {
			fontSize: 20,
			fontWeight: 'bold',
			color: isDark ? '#FFFFFF' : '#000000',
			borderBottomWidth: 1,
			borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
			paddingTop: -4,
			paddingBottom: 12,
			marginBottom: 0,
			minHeight: 50,
			textAlignVertical: 'top',
			lineHeight: 28,
		},
		scrollView: {
			flex: 1,
		},
		scrollContent: {
			paddingTop: 16,
			paddingBottom: 20, // Erhöht von 0 auf 20 für mehr Abstand am Ende
			flexGrow: 1,
		},
		itemsContainer: {
			flexDirection: 'column',
		},
		itemContainer: {
			marginBottom: 4,
			width: '100%',
		},
		copyButton: {
			marginTop: 16,
			marginBottom: 8,
		},
		segmentedControl: {
			height: 36,
			borderRadius: 8, // Abgerundete Ecken passend zu den Buttons
		},
	});

	// Render the footer with format selection and action buttons
	const renderFooter = () => (
		<>
			{/* Format-Auswahl */}
			<SegmentedControl
				values={[t('share.plain_text', 'Text'), t('share.markdown', 'Markdown')]}
				selectedIndex={exportFormat === 'plain' ? 0 : 1}
				onChange={(event) => {
					setExportFormat(event.nativeEvent.selectedSegmentIndex === 0 ? 'plain' : 'markdown');
				}}
				style={[styles.segmentedControl, { marginBottom: 16, borderRadius: 18 }]}
				tintColor={colors.primaryButton}
				backgroundColor={colors.secondaryButton}
				fontStyle={{
					color: colors.text,
					fontSize: 14,
				}}
				activeFontStyle={{
					color: colors.primaryButtonText,
					fontSize: 14,
					fontWeight: '600',
				}}
			/>

			{/* Action Buttons */}
			<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
				<Button
					title={t('memo.copy', 'Kopieren')}
					variant="secondary"
					iconName="copy-outline"
					onPress={handleCopy}
					style={{ flex: 1, marginRight: 8 }}
				/>
				<Button
					title={t('common.share', 'Teilen')}
					onPress={handleShare}
					variant="primary"
					iconName="share-outline"
					style={{ flex: 1, marginLeft: 8 }}
				/>
			</View>
		</>
	);

	return (
		<BaseModal
			isVisible={visible}
			onClose={onClose}
			title={t('memo.share_memo', 'Memo teilen')}
			animationType="fade"
			closeOnOverlayPress={true}
			footerContent={renderFooter()}
			noPadding={true}
		>
			<View style={styles.contentWrapper}>
				{/* Editierbarer Titel */}
				<TextInput
					style={styles.titleInput}
					value={shareTitle}
					onChangeText={setShareTitle}
					placeholder={t('memo.title_placeholder', 'Titel eingeben')}
					placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)'}
					multiline
				/>

				<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
					<View style={styles.itemsContainer}>
						{/* Intro-Sektion */}
						{shareIntro && (
							<View style={styles.itemContainer}>
								<SelectableItem
									title={t('memo.intro', 'Einleitung')}
									isSelected={isIntroSelected}
									onToggle={() => setIsIntroSelected(!isIntroSelected)}
								/>
							</View>
						)}

						{/* Memories-Sektion */}
						{memoryItems.length > 0 &&
							memoryItems.map((item, index) => {
								const isLastMemory = index === memoryItems.length - 1;
								const hasMoreSections = transcript || audioUrl;
								const isLastItem = isLastMemory && !hasMoreSections;

								return (
									<View
										key={item.id}
										style={[styles.itemContainer, isLastItem && { marginBottom: 0 }]}
									>
										<SelectableItem
											title={item.title}
											isSelected={item.isSelected}
											onToggle={() => toggleMemorySelection(item.id)}
										/>
									</View>
								);
							})}

						{/* Transkript-Sektion */}
						{transcript && (
							<View style={[styles.itemContainer, !audioUrl && { marginBottom: 0 }]}>
								<SelectableItem
									title={t('memo.transcript', 'Transkript')}
									isSelected={isTranscriptSelected}
									onToggle={() => setIsTranscriptSelected(!isTranscriptSelected)}
								/>
							</View>
						)}

						{/* Audio-Sektion */}
						{audioUrl && (
							<View style={[styles.itemContainer, { marginBottom: 0 }]}>
								<SelectableItem
									title={t('memo.audio_file', 'Audio-Datei')}
									isSelected={isAudioSelected}
									onToggle={() => setIsAudioSelected(!isAudioSelected)}
								/>
							</View>
						)}
					</View>
				</ScrollView>
			</View>
		</BaseModal>
	);
};

export default ShareModal;
