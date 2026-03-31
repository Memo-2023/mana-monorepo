import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { MemoTitleSkeleton } from './sections/MemoTitleSkeleton';
import { ActionButtonsSkeleton } from './sections/ActionButtonsSkeleton';
import { MemoryCardSkeleton } from './sections/MemoryCardSkeleton';
import { AudioPlayerSkeleton } from './sections/AudioPlayerSkeleton';
import { TranscriptSkeleton } from './sections/TranscriptSkeleton';

interface MemoDetailSkeletonProps {
	showMemories?: boolean;
	showAudioPlayer?: boolean;
	showTranscript?: boolean;
}

export const MemoDetailSkeleton: React.FC<MemoDetailSkeletonProps> = ({
	showMemories = true,
	showAudioPlayer = true,
	showTranscript = true,
}) => {
	const { colors } = useTheme();

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: colors.background }]}
			contentContainerStyle={styles.contentContainer}
			showsVerticalScrollIndicator={false}
		>
			<View style={styles.headerWrapper}>
				<MemoTitleSkeleton />
			</View>

			<View style={styles.actionButtonsWrapper}>
				<ActionButtonsSkeleton />
			</View>

			<View style={styles.content}>
				{showMemories && <MemoryCardSkeleton showMultiple />}

				{showAudioPlayer && <AudioPlayerSkeleton />}

				{showTranscript && <TranscriptSkeleton />}
			</View>

			<View style={styles.bottomPadding} />
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {
		paddingBottom: 32,
	},
	headerWrapper: {
		maxWidth: 760,
		alignSelf: 'center' as const,
		width: '100%',
		marginBottom: 20,
	},
	actionButtonsWrapper: {
		maxWidth: 760,
		alignSelf: 'center' as const,
		width: '100%',
		marginBottom: 16,
	},
	content: {
		paddingTop: 8,
		paddingBottom: 20,
		paddingHorizontal: 20,
		maxWidth: 760,
		alignSelf: 'center' as const,
		width: '100%',
	},
	bottomPadding: {
		height: 120,
	},
});
