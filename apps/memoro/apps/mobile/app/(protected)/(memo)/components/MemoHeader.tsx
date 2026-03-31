import React from 'react';
import { View, StyleSheet } from 'react-native';
import MemoTitle from '~/components/molecules/MemoTitle';
import TagList from '~/components/molecules/TagList';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import type { MemoMetadata } from '~/features/memos/types/memo.types';
import type { SearchResult } from '~/features/memos/hooks/useMemoSearch';

interface MemoHeaderProps {
	// Memo data
	memoId: string;
	title: string;
	intro?: string;
	timestamp?: Date;
	duration?: number;
	viewCount?: number;
	wordCount?: number;
	location?: MemoMetadata['location'];
	language?: string;
	speakerCount?: number;
	isPinned: boolean;

	// Edit mode
	isEditMode: boolean;
	editTitle?: string;
	editIntro?: string;
	onTitleChange?: (text: string) => void;
	onIntroChange?: (text: string) => void;
	onSave?: () => void;
	onCancel?: () => void;

	// Tags
	tags: Array<{ id: string; text: string; color: string }>;
	selectedTagIds: string[];
	onTagPress: (tagId: string) => void;
	onAddTagPress: () => void;

	// Search
	isSearchMode?: boolean;
	searchQuery?: string;
	currentSearchIndex?: number;
	searchResults?: SearchResult[];

	// Actions
	onPinPress: () => void;
}

export default function MemoHeader({
	memoId,
	title,
	intro,
	timestamp,
	duration,
	viewCount = 0,
	wordCount,
	location,
	language,
	speakerCount = 0,
	isPinned,
	isEditMode,
	editTitle,
	editIntro,
	onTitleChange,
	onIntroChange,
	onSave,
	onCancel,
	tags,
	selectedTagIds,
	onTagPress,
	onAddTagPress,
	isSearchMode = false,
	searchQuery = '',
	currentSearchIndex = 0,
	searchResults = [],
	onPinPress,
}: MemoHeaderProps) {
	const { isDark } = useTheme();
	const { t } = useTranslation();

	const styles = StyleSheet.create({
		container: {
			marginBottom: 20,
			maxWidth: 760, // 720px content + 40px margins
			alignSelf: 'center',
			width: '100%',
		},
		tagListContainer: {
			marginTop: 4,
		},
	});

	// Filter tags to only show selected ones
	const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));

	return (
		<View style={styles.container}>
			<MemoTitle
				title={isEditMode && editTitle !== undefined ? editTitle : title}
				intro={isEditMode && editIntro !== undefined ? editIntro : intro}
				timestamp={timestamp}
				duration={duration}
				viewCount={viewCount}
				wordCount={wordCount}
				location={location}
				language={language}
				speakerCount={speakerCount}
				isEditMode={isEditMode}
				onTitleChange={onTitleChange}
				onIntroChange={onIntroChange}
				onSave={onSave}
				onCancel={onCancel}
				memoId={memoId}
				tags={tags}
				selectedTagIds={selectedTagIds}
				onTagPress={onTagPress}
				onAddTagPress={onAddTagPress}
				isSearchMode={isSearchMode}
				searchQuery={searchQuery}
				currentSearchIndex={currentSearchIndex}
				searchResults={searchResults}
				isPinned={isPinned}
				onPinPress={onPinPress}
			/>

			{/* Tags display - only show selected tags when not in edit mode */}
			{!isEditMode && (
				<View style={styles.tagListContainer}>
					<TagList
						tags={selectedTags}
						horizontal
						showAddButton={true}
						onTagPress={onTagPress}
						onAddPress={onAddTagPress}
					/>
				</View>
			)}
		</View>
	);
}
