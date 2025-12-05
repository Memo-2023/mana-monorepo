import React, { useCallback, useEffect } from 'react';
import { View, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTheme } from '~/utils/theme/theme';
import { useDocumentEditor } from '~/hooks/useDocumentEditor';
import { DocumentContent } from './DocumentContent';
import { DocumentToolbar, KeyboardShortcutsInfo } from './DocumentToolbar';
import { DocumentTagsEditor } from './DocumentTagsEditor';
import { DocumentHeader } from './DocumentHeader';
import { VariantCreator } from './VariantCreator';
import { BottomLLMToolbar } from './BottomLLMToolbar';
import { Text } from '~/components/ui/Text';
import { Skeleton } from '~/components/ui/Skeleton';
import { EDITOR_CONFIG } from '~/config/editorConfig';

export interface DocumentEditorProps {
	spaceId: string;
	documentId: string;
}

/**
 * Optimierter Dokumenten-Editor mit separaten Komponenten und Custom Hooks
 * Ersetzt die ursprüngliche 1.322-Zeilen-Komponente
 */
export const DocumentEditor: React.FC<DocumentEditorProps> = ({ spaceId, documentId }) => {
	const { isDark } = useTheme();
	const params = useLocalSearchParams();
	const initialMode = (params.mode as 'edit' | 'preview') || 'edit';

	const {
		state,
		dispatch,
		saveDocument,
		toggleMode,
		updateContent,
		updateTitle,
		updateTags,
		autoSave,
		navigateToNextDocument,
		navigateToSpace,
		isNewDocument,
		canSave,
	} = useDocumentEditor({
		spaceId,
		documentId,
		initialMode,
	});

	// Keyboard Shortcuts (nur für Web)
	useEffect(() => {
		if (Platform.OS !== 'web') return;

		const handleKeyPress = (e: KeyboardEvent) => {
			if (e.ctrlKey || e.metaKey) {
				switch (e.key) {
					case 's':
						e.preventDefault();
						if (canSave) {
							saveDocument();
						}
						break;
					case 'p':
						e.preventDefault();
						toggleMode();
						break;
					case 'k':
						e.preventDefault();
						// Focus auf Content-Eingabe setzen
						dispatch({ type: 'SET_MODE', payload: 'edit' });
						break;
					case 'n':
						e.preventDefault();
						navigateToSpace();
						break;
				}
			}
		};

		document.addEventListener('keydown', handleKeyPress);
		return () => document.removeEventListener('keydown', handleKeyPress);
	}, [canSave, saveDocument, toggleMode, dispatch, navigateToSpace]);

	// Handlers
	const handleToggleMode = useCallback(() => {
		toggleMode();
	}, [toggleMode]);

	const handleSave = useCallback(() => {
		saveDocument();
	}, [saveDocument]);

	const handleShowTags = useCallback(() => {
		dispatch({ type: 'SET_SHOW_TAGS_EDITOR', payload: !state.showTagsEditor });
	}, [dispatch, state.showTagsEditor]);

	const handleShowVariantCreator = useCallback(() => {
		dispatch({ type: 'SET_SHOW_VARIANT_CREATOR', payload: !state.showVariantCreator });
	}, [dispatch, state.showVariantCreator]);

	const handleTagsUpdate = useCallback(
		(tags: string[]) => {
			updateTags(tags);
		},
		[updateTags]
	);

	const handleContentChange = useCallback(
		(content: string) => {
			updateContent(content);
		},
		[updateContent]
	);

	const handleTitleChange = useCallback(
		(title: string) => {
			updateTitle(title);
		},
		[updateTitle]
	);

	const handleGenerateText = useCallback(
		(text: string) => {
			// Füge generierten Text am Ende des aktuellen Inhalts hinzu
			const newContent = state.content + '\\n\\n---\\n\\n' + text;
			updateContent(newContent);
		},
		[state.content, updateContent]
	);

	const handleCreateVariant = useCallback(
		(variant: any) => {
			// Hier würde die Varianten-Erstellung implementiert
			console.log('Create variant:', variant);
			dispatch({ type: 'SET_SHOW_VARIANT_CREATOR', payload: false });
		},
		[dispatch]
	);

	// Loading Screen
	if (state.loading) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
				<Stack.Screen
					options={{
						title: 'Lädt...',
						headerStyle: { backgroundColor: isDark ? '#1f2937' : '#ffffff' },
						headerTintColor: isDark ? '#f9fafb' : '#1f2937',
					}}
				/>
				<View style={{ flex: 1, padding: 16 }}>
					<Skeleton width="100%" height={32} style={{ marginBottom: 16 }} />
					<Skeleton width="80%" height={20} style={{ marginBottom: 24 }} />
					<Skeleton width="100%" height={200} style={{ marginBottom: 16 }} />
					<Skeleton width="60%" height={20} style={{ marginBottom: 16 }} />
					<Skeleton width="90%" height={20} style={{ marginBottom: 16 }} />
					<Skeleton width="75%" height={20} />
				</View>
			</SafeAreaView>
		);
	}

	// Error Screen
	if (state.error) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
				<Stack.Screen
					options={{
						title: 'Fehler',
						headerStyle: { backgroundColor: isDark ? '#1f2937' : '#ffffff' },
						headerTintColor: isDark ? '#f9fafb' : '#1f2937',
					}}
				/>
				<View
					style={{
						flex: 1,
						justifyContent: 'center',
						alignItems: 'center',
						padding: 16,
					}}
				>
					<Text
						style={{
							fontSize: 18,
							color: isDark ? '#ef4444' : '#dc2626',
							textAlign: 'center',
							marginBottom: 16,
						}}
					>
						{state.error}
					</Text>
					<Text
						style={{
							fontSize: 14,
							color: isDark ? '#9ca3af' : '#6b7280',
							textAlign: 'center',
						}}
					>
						Bitte versuche es später erneut oder kontaktiere den Support.
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
			<Stack.Screen
				options={{
					title: state.document?.title || 'Neues Dokument',
					headerStyle: { backgroundColor: isDark ? '#1f2937' : '#ffffff' },
					headerTintColor: isDark ? '#f9fafb' : '#1f2937',
					headerBackVisible: true,
				}}
			/>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<View style={{ flex: 1 }}>
					{/* Keyboard Shortcuts Info (nur Web) */}
					<KeyboardShortcutsInfo />

					{/* Document Header */}
					<DocumentHeader
						title={state.title}
						onTitleChange={handleTitleChange}
						spaceName={state.spaceName}
						isNewDocument={isNewDocument}
						onNavigateToSpace={navigateToSpace}
						onNavigateToNext={state.nextDocument ? navigateToNextDocument : undefined}
						nextDocumentTitle={state.nextDocument?.title}
						className="mb-4"
					/>

					{/* Tags Editor (wenn sichtbar) */}
					{state.showTagsEditor && (
						<DocumentTagsEditor
							documentId={documentId}
							tags={state.tags}
							onTagsUpdate={handleTagsUpdate}
							className="mb-4"
						/>
					)}

					{/* Main Content Area */}
					<View style={{ flex: 1 }}>
						<ScrollView
							style={{ flex: 1 }}
							contentContainerStyle={{ flexGrow: 1 }}
							keyboardShouldPersistTaps="handled"
						>
							<DocumentContent
								mode={state.mode}
								content={state.content}
								onContentChange={handleContentChange}
								isNewDocument={isNewDocument}
								autoFocus={isNewDocument && state.mode === 'edit'}
								className="flex-1"
							/>
						</ScrollView>
					</View>

					{/* Bottom Toolbar */}
					<DocumentToolbar
						mode={state.mode}
						onToggleMode={handleToggleMode}
						onSave={handleSave}
						onShowTags={handleShowTags}
						onShowVariantCreator={handleShowVariantCreator}
						saveStatus={autoSave.saveState}
						lastSaved={autoSave.lastSaved}
						saveError={autoSave.error?.message}
						canSave={canSave}
						isGeneratingText={state.isGeneratingText}
						showTagsEditor={state.showTagsEditor}
					/>

					{/* AI Toolbar (nur im Edit-Modus) */}
					{state.mode === 'edit' && (
						<BottomLLMToolbar
							documentContent={state.content}
							onGenerateText={handleGenerateText}
							onGeneratingStateChange={(isGenerating) => {
								dispatch({ type: 'SET_IS_GENERATING_TEXT', payload: isGenerating });
							}}
							disabled={state.isGeneratingText}
							className="border-t border-gray-200 dark:border-gray-700"
						/>
					)}
				</View>

				{/* Variant Creator Modal */}
				{state.showVariantCreator && (
					<VariantCreator
						visible={state.showVariantCreator}
						onClose={() => dispatch({ type: 'SET_SHOW_VARIANT_CREATOR', payload: false })}
						onCreateVariant={handleCreateVariant}
						originalContent={state.content}
						documentTitle={state.title}
					/>
				)}
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
};

export default DocumentEditor;
