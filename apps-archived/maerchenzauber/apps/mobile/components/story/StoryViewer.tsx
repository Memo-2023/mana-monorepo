import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import PagerView, { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import { Image } from 'expo-image';
import StartScreen from './StartScreen';
import StoryPage from './StoryPage';
import EndScreen from './EndScreen';

interface StoryPageData {
	image: string;
	story: string;
	blur_hash?: string;
}

interface StoryViewerProps {
	title: string;
	characterName?: string;
	pages: StoryPageData[];
	onPageChange: (pageIndex: number) => void;
	onTap: () => void;
	onEnd: () => void;
	onRestart: () => void;
	onArchive: () => void;
	isEditMode?: boolean;
	onPageTextChange?: (pageIndex: number, newText: string) => void;
	onTitleChange?: (newTitle: string) => void;
	onCancelEdit?: () => void;
	onSaveEdit?: () => void;
	editedPages?: Map<number, string>;
	editedTitle?: string;
}

export default function StoryViewer({
	title,
	characterName,
	pages,
	onPageChange,
	onTap,
	onEnd,
	onRestart,
	onArchive,
	isEditMode = false,
	onPageTextChange,
	onTitleChange,
	onCancelEdit,
	onSaveEdit,
	editedPages,
	editedTitle,
}: StoryViewerProps) {
	const pagerRef = useRef<PagerView>(null);

	// Preload first 3 images when component mounts
	useEffect(() => {
		const preloadImages = async () => {
			const imagesToPreload = pages.slice(0, 3).map((page) => page.image);
			await Image.prefetch(imagesToPreload);
			console.log('[StoryViewer] Preloaded first 3 images');
		};

		if (pages.length > 0) {
			preloadImages();
		}
	}, [pages]);

	const handlePageSelected = (e: PagerViewOnPageSelectedEvent) => {
		const pageIndex = e.nativeEvent.position;
		onPageChange(pageIndex);
	};

	const handleRestart = () => {
		pagerRef.current?.setPage(0);
		onRestart();
	};

	return (
		<PagerView
			ref={pagerRef}
			style={styles.pager}
			initialPage={0}
			onPageSelected={handlePageSelected}
		>
			{/* Start Screen */}
			<Pressable
				key="start"
				style={styles.page}
				onPress={onTap}
				disabled={isEditMode}
				pointerEvents={isEditMode ? 'box-none' : 'auto'}
			>
				<StartScreen
					title={editedTitle !== undefined ? editedTitle : title}
					characterName={characterName}
					isEditMode={isEditMode}
					onTitleChange={onTitleChange}
					onCancelEdit={onCancelEdit}
					onSaveEdit={onSaveEdit}
				/>
			</Pressable>

			{/* Story Pages */}
			{pages.map((page, index) => {
				const editedText = editedPages?.get(index);
				const displayText = editedText !== undefined ? editedText : page.story;

				return (
					<View key={`page-${index}`} style={styles.page}>
						<StoryPage
							imageUri={page.image}
							text={displayText}
							blurhash={page.blur_hash}
							pageNumber={index}
							isEditMode={isEditMode}
							onTextChange={(newText) => onPageTextChange?.(index, newText)}
							onCancelEdit={onCancelEdit}
							onSaveEdit={onSaveEdit}
							onImagePress={onTap}
						/>
					</View>
				);
			})}

			{/* End Screen */}
			<Pressable key="end" style={styles.endPage} onPress={onTap}>
				<EndScreen onEnd={onEnd} onRestart={handleRestart} onArchive={onArchive} />
			</Pressable>
		</PagerView>
	);
}

const styles = StyleSheet.create({
	pager: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	page: {
		flex: 1,
		width: '100%',
		height: '100%',
		backgroundColor: '#121212',
	},
	endPage: {
		flex: 1,
		width: '100%',
		height: '100%',
		backgroundColor: 'transparent',
	},
});
