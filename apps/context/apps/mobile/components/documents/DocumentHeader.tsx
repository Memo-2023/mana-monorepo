import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Breadcrumbs } from '~/components/navigation/Breadcrumbs';
import { DocumentToolbar } from './DocumentToolbar';
import { useTheme } from '~/utils/theme/theme';
import { DocumentType } from './DocumentTypeDropdown';

interface DocumentHeaderProps {
	// Required props
	title: string;
	spaceName: string;
	isNewDocument: boolean;

	// Optional props for simple usage (DocumentEditor.tsx)
	onTitleChange?: (title: string) => void;
	onNavigateToSpace?: () => void;
	onNavigateToNext?: () => void;
	nextDocumentTitle?: string;
	className?: string;

	// Optional props for complex usage (old implementation)
	documentId?: string;
	spaceId?: string | null;
	showPreview?: boolean;
	setShowPreview?: (show: boolean) => void;
	saving?: boolean;
	saveDocument?: () => void;
	unsavedChanges?: boolean;
	documentType?: DocumentType | undefined;
	handleTypeChange?: (type: DocumentType) => void;
	handleVersionChange?: (version: any) => void;
	spaceDocuments?: Array<{
		id: string;
		title: string;
	}>;
	showTagsEditor?: boolean;
	setShowTagsEditor?: (show: boolean) => void;
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
	spaceDocuments = [],
	showTagsEditor,
	setShowTagsEditor,
	// Simple usage props
	onTitleChange,
	onNavigateToSpace,
	onNavigateToNext,
	nextDocumentTitle,
	className,
}) => {
	const { width } = useWindowDimensions();
	const { mode } = useTheme();
	const isDark = mode === 'dark';
	const isWideScreen = width >= 640; // Reduzierter Breakpoint, da wir weniger Elemente haben

	// Simple usage (from DocumentEditor.tsx) - just show breadcrumbs
	if (onTitleChange !== undefined || onNavigateToSpace !== undefined) {
		return (
			<View style={styles.headerContainer}>
				<Breadcrumbs
					items={[
						{ label: 'Spaces', href: '/' },
						{ label: spaceName, href: onNavigateToSpace ? '#' : undefined },
						{ label: isNewDocument ? 'Neues Dokument' : title || 'Unbenanntes Dokument' },
					]}
					className="justify-start"
					loading={false}
				/>
			</View>
		);
	}

	// Complex usage (old implementation) - just show breadcrumbs for now
	// The old DocumentToolbar interface doesn't match the simple one we're using
	return (
		<View style={styles.headerContainer}>
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
