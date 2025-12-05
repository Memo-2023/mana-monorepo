import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Breadcrumbs } from '~/components/navigation/Breadcrumbs';
import { DocumentToolbar } from './DocumentToolbar';
import { useTheme } from '~/utils/theme/theme';
import { DocumentType } from './DocumentTypeDropdown';

interface DocumentHeaderProps {
	documentId: string;
	spaceId: string | null;
	title: string;
	spaceName: string;
	showPreview: boolean;
	setShowPreview: (show: boolean) => void;
	isNewDocument: boolean;
	saving: boolean;
	saveDocument: () => void;
	unsavedChanges: boolean;
	documentType: DocumentType | undefined;
	handleTypeChange: (type: DocumentType) => void;
	handleVersionChange: (version: any) => void;
	spaceDocuments: Array<{
		id: string;
		title: string;
	}>;
	showTagsEditor: boolean;
	setShowTagsEditor: (show: boolean) => void;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
	documentId,
	spaceId,
	title,
	spaceName,
	showPreview,
	setShowPreview,
	isNewDocument,
	saving,
	saveDocument,
	unsavedChanges,
	documentType,
	handleTypeChange,
	handleVersionChange,
	spaceDocuments,
	showTagsEditor,
	setShowTagsEditor,
}) => {
	const { width } = useWindowDimensions();
	const { mode } = useTheme();
	const isDark = mode === 'dark';
	const isWideScreen = width >= 640; // Reduzierter Breakpoint, da wir weniger Elemente haben

	return (
		<View style={styles.headerContainer}>
			{isWideScreen ? (
				// Layout für breite Bildschirme: Breadcrumbs und Toolbar nebeneinander
				<View style={styles.wideContainer}>
					{/* Linke Seite - Breadcrumbs */}
					<View style={styles.breadcrumbsWide}>
						<Breadcrumbs
							items={[
								{ label: 'Spaces', href: '/' },
								{ label: spaceName, href: `/spaces/${spaceId}` },
								{
									label: isNewDocument ? 'Neues Dokument' : title || 'Unbenanntes Dokument',
									dropdownItems: spaceDocuments.map((doc) => ({
										id: doc.id,
										label: doc.title || 'Unbenanntes Dokument',
										href: `/spaces/${spaceId}/documents/${doc.id}`,
									})),
								},
							]}
							className="justify-start"
							loading={false}
						/>
					</View>

					{/* Rechte Seite - Toolbar */}
					<View style={styles.toolbarWide}>
						<DocumentToolbar
							documentId={documentId}
							spaceId={spaceId}
							title={title}
							showPreview={showPreview}
							setShowPreview={setShowPreview}
							isNewDocument={isNewDocument}
							saving={saving}
							saveDocument={saveDocument}
							unsavedChanges={unsavedChanges}
							documentType={documentType}
							handleTypeChange={handleTypeChange}
							handleVersionChange={handleVersionChange}
							showTagsEditor={showTagsEditor}
							setShowTagsEditor={setShowTagsEditor}
						/>
					</View>
				</View>
			) : (
				// Layout für schmale Bildschirme: Breadcrumbs und Toolbar untereinander
				<View style={styles.narrowContainer}>
					{/* Breadcrumbs */}
					<View
						style={[
							styles.breadcrumbsNarrow,
							{
								backgroundColor: isDark ? '#111827' : '#f9fafb',
								borderBottomColor: isDark ? '#374151' : '#e5e7eb',
								borderBottomWidth: 1,
							},
						]}
					>
						<Breadcrumbs
							items={[
								{ label: 'Spaces', href: '/' },
								{ label: spaceName, href: `/spaces/${spaceId}` },
								{
									label: isNewDocument ? 'Neues Dokument' : title || 'Unbenanntes Dokument',
									dropdownItems: spaceDocuments.map((doc) => ({
										id: doc.id,
										label: doc.title || 'Unbenanntes Dokument',
										href: `/spaces/${spaceId}/documents/${doc.id}`,
									})),
								},
							]}
							className="justify-start"
							loading={false}
						/>
					</View>

					{/* Toolbar */}
					<DocumentToolbar
						documentId={documentId}
						spaceId={spaceId}
						title={title}
						showPreview={showPreview}
						setShowPreview={setShowPreview}
						isNewDocument={isNewDocument}
						saving={saving}
						saveDocument={saveDocument}
						unsavedChanges={unsavedChanges}
						documentType={documentType}
						handleTypeChange={handleTypeChange}
						handleVersionChange={handleVersionChange}
						showTagsEditor={showTagsEditor}
						setShowTagsEditor={setShowTagsEditor}
					/>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	headerContainer: {
		width: '100%',
		backgroundColor: 'var(--color-background)',
		borderBottomWidth: 1,
		borderBottomColor: 'var(--color-border)',
		zIndex: 1000,
	},
	wideContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		maxWidth: 1200,
		marginHorizontal: 'auto',
	},
	narrowContainer: {
		flexDirection: 'column',
		width: '100%',
	},
	breadcrumbsWide: {
		flex: 1,
		paddingLeft: 16,
	},
	toolbarWide: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	breadcrumbsNarrow: {
		width: '100%',
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
});
