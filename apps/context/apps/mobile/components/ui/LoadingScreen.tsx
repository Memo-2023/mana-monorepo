import React from 'react';
import { View, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '~/utils/theme/theme';

interface LoadingScreenProps {
	visible: boolean;
	title?: string;
	message?: string;
	progress?: {
		current: number;
		total: number;
		label?: string;
	};
	showSpinner?: boolean;
	icon?: {
		name: string;
		color?: string;
		size?: number;
	};
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
	visible,
	title = 'Wird geladen...',
	message,
	progress,
	showSpinner = true,
	icon,
}) => {
	const { mode, colors } = useTheme();
	const isDark = mode === 'dark';

	// Berechne den Fortschritt als Prozentsatz
	const progressPercentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;

	// Generiere ein Label für den Fortschritt, wenn keines angegeben wurde
	const progressLabel =
		progress?.label || (progress ? `${progress.current} von ${progress.total}` : '');

	return (
		<Modal visible={visible} transparent={true} animationType="fade">
			<View
				style={[
					styles.container,
					{ backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' },
				]}
			>
				<View
					style={[
						styles.content,
						{
							backgroundColor: isDark ? colors.gray[800] : colors.gray[50],
							borderColor: isDark ? colors.gray[700] : colors.gray[200],
						},
					]}
				>
					{/* Icon (optional) */}
					{icon && (
						<Ionicons
							name={icon.name as any}
							size={icon.size || 48}
							color={icon.color || (isDark ? colors.primary[400] : colors.primary[500])}
							style={styles.icon}
						/>
					)}

					{/* Titel */}
					<Text style={[styles.title, { color: isDark ? colors.gray[100] : colors.gray[900] }]}>
						{title}
					</Text>

					{/* Nachricht (optional) */}
					{message && (
						<Text style={[styles.message, { color: isDark ? colors.gray[300] : colors.gray[600] }]}>
							{message}
						</Text>
					)}

					{/* Spinner (optional) */}
					{showSpinner && !progress && (
						<ActivityIndicator
							size="large"
							color={isDark ? colors.primary[400] : colors.primary[500]}
							style={styles.spinner}
						/>
					)}

					{/* Fortschrittsanzeige (optional) */}
					{progress && (
						<View style={styles.progressContainer}>
							<View style={styles.progressLabelContainer}>
								<Text
									style={[
										styles.progressLabel,
										{ color: isDark ? colors.gray[300] : colors.gray[600] },
									]}
								>
									{progressLabel}
								</Text>
								<Text
									style={[
										styles.progressPercentage,
										{ color: isDark ? colors.gray[300] : colors.gray[600] },
									]}
								>
									{progressPercentage}%
								</Text>
							</View>

							<View
								style={[
									styles.progressBar,
									{ backgroundColor: isDark ? colors.gray[700] : colors.gray[200] },
								]}
							>
								<View
									style={[
										styles.progressFill,
										{
											backgroundColor: isDark ? colors.primary[500] : colors.primary[600],
											width: `${progressPercentage}%`,
										},
									]}
								/>
							</View>
						</View>
					)}
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	content: {
		width: '90%',
		maxWidth: 400,
		padding: 24,
		borderRadius: 12,
		borderWidth: 1,
		alignItems: 'center',
	},
	icon: {
		marginBottom: 16,
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: 8,
	},
	message: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 16,
		lineHeight: 22,
	},
	spinner: {
		marginTop: 16,
	},
	progressContainer: {
		width: '100%',
		marginTop: 16,
	},
	progressLabelContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	progressLabel: {
		fontSize: 14,
	},
	progressPercentage: {
		fontSize: 14,
		fontWeight: '600',
	},
	progressBar: {
		height: 8,
		borderRadius: 4,
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
	},
});
