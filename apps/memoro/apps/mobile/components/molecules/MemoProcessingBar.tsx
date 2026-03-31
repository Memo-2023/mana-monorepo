import React from 'react';
import { Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { MemoProcessingStatus } from '~/features/memos/hooks/useMemoProcessing';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';

interface MemoProcessingBarProps {
	processingStatus: MemoProcessingStatus;
	displayTitle: string;
	onPress: () => void;
}

function MemoProcessingBar({ processingStatus, displayTitle, onPress }: MemoProcessingBarProps) {
	const { isDark } = useTheme();

	const isLoading =
		processingStatus === MemoProcessingStatus.UPLOADING ||
		processingStatus === MemoProcessingStatus.TRANSCRIBING ||
		processingStatus === MemoProcessingStatus.GENERATING_HEADLINE;

	const isCompleted = processingStatus === MemoProcessingStatus.COMPLETED;
	const isError =
		processingStatus === MemoProcessingStatus.ERROR ||
		processingStatus === MemoProcessingStatus.NO_TRANSCRIPT;

	const backgroundColor = (() => {
		if (isCompleted) {
			return isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)';
		}
		if (isError) {
			return isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)';
		}
		return isDark ? '#1E1E1E' : '#FFFFFF';
	})();

	const styles = StyleSheet.create({
		container: {
			width: '100%',
			height: 44,
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 16,
			borderTopWidth: 1,
			borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
			backgroundColor,
		},
		text: {
			flex: 1,
			fontSize: 14,
			fontWeight: '500',
			marginHorizontal: 10,
			color: isDark ? '#FFFFFF' : '#000000',
		},
	});

	return (
		<Pressable
			style={({ pressed }) => [styles.container, { opacity: pressed ? 0.7 : 1 }]}
			onPress={onPress}
		>
			{isLoading && <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#666666'} />}
			{isCompleted && <Icon name="checkmark-circle" size={20} color="#22C55E" />}
			{isError && <Icon name="alert-circle" size={20} color="#EF4444" />}
			<Text style={styles.text} numberOfLines={1}>
				{displayTitle}
			</Text>
			<Icon
				name="chevron-forward"
				size={18}
				color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}
			/>
		</Pressable>
	);
}

export default MemoProcessingBar;
