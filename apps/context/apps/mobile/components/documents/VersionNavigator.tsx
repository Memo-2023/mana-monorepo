import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/Text';
import { useTheme } from '~/utils/theme';
import { getDocumentVersions, getAdjacentDocumentVersion } from '~/services/supabaseService';

type VersionNavigatorProps = {
	documentId: string;
	onVersionChange: (newDocumentId: string) => void;
};

export const VersionNavigator: React.FC<VersionNavigatorProps> = ({
	documentId,
	onVersionChange,
}) => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [versionInfo, setVersionInfo] = useState<{
		currentVersion: number;
		totalVersions: number;
		isOriginal: boolean;
	} | null>(null);
	const { mode, colors } = useTheme();
	const isDark = mode === 'dark';

	useEffect(() => {
		loadVersionInfo();
	}, [documentId]);

	const loadVersionInfo = async () => {
		setLoading(true);
		setError(null);

		try {
			const { data: versions, error } = await getDocumentVersions(documentId);

			if (error) {
				setError(error);
				setLoading(false);
				return;
			}

			if (!versions || versions.length === 0) {
				setVersionInfo(null);
				setLoading(false);
				return;
			}

			// Finde den Index des aktuellen Dokuments
			const currentIndex = versions.findIndex((doc) => doc.id === documentId);

			if (currentIndex === -1) {
				setError('Aktuelles Dokument nicht in Versionen gefunden');
				setLoading(false);
				return;
			}

			// Bestimme, ob es sich um das Original handelt
			const isOriginal = currentIndex === 0;

			setVersionInfo({
				currentVersion: currentIndex,
				totalVersions: versions.length,
				isOriginal,
			});
		} catch (error) {
			console.error('Fehler beim Laden der Versionsinformationen:', error);
			setError('Fehler beim Laden der Versionsinformationen');
		} finally {
			setLoading(false);
		}
	};

	const handleNavigateVersion = async (direction: 'next' | 'previous') => {
		setLoading(true);

		try {
			const { data: newVersionId, error } = await getAdjacentDocumentVersion(documentId, direction);

			if (error || !newVersionId) {
				console.log(`Keine ${direction === 'next' ? 'neuere' : 'ältere'} Version verfügbar`);
				return;
			}

			// Navigiere zur neuen Version
			onVersionChange(newVersionId);
		} catch (error) {
			console.error(
				`Fehler beim Navigieren zur ${direction === 'next' ? 'nächsten' : 'vorherigen'} Version:`,
				error
			);
		} finally {
			setLoading(false);
		}
	};

	// Wenn keine Versionen vorhanden sind oder nur eine Version existiert, zeige nichts an
	if (!versionInfo || (versionInfo.totalVersions <= 1 && versionInfo.isOriginal)) {
		return null;
	}

	return (
		<View style={styles.container}>
			<TouchableOpacity
				style={[
					styles.navButton,
					{ backgroundColor: isDark ? colors.gray[700] : colors.gray[200] },
					versionInfo.currentVersion === 0 && styles.disabledButton,
				]}
				onPress={() => handleNavigateVersion('previous')}
				disabled={versionInfo.currentVersion === 0 || loading}
			>
				<Ionicons
					name="chevron-back-outline"
					size={18}
					color={
						versionInfo.currentVersion === 0
							? isDark
								? colors.gray[500]
								: colors.gray[400]
							: isDark
								? colors.gray[300]
								: colors.gray[700]
					}
				/>
			</TouchableOpacity>

			<View style={styles.versionInfo}>
				{loading ? (
					<ActivityIndicator size="small" color={isDark ? colors.gray[300] : colors.gray[700]} />
				) : (
					<Text
						style={{
							color: isDark ? colors.gray[300] : colors.gray[700],
							fontSize: 14,
							fontWeight: '500',
						}}
					>
						{versionInfo.isOriginal
							? 'Original'
							: `Version ${versionInfo.currentVersion}/${versionInfo.totalVersions - 1}`}
					</Text>
				)}
			</View>

			<TouchableOpacity
				style={[
					styles.navButton,
					{ backgroundColor: isDark ? colors.gray[700] : colors.gray[200] },
					versionInfo.currentVersion === versionInfo.totalVersions - 1 && styles.disabledButton,
				]}
				onPress={() => handleNavigateVersion('next')}
				disabled={versionInfo.currentVersion === versionInfo.totalVersions - 1 || loading}
			>
				<Ionicons
					name="chevron-forward-outline"
					size={18}
					color={
						versionInfo.currentVersion === versionInfo.totalVersions - 1
							? isDark
								? colors.gray[500]
								: colors.gray[400]
							: isDark
								? colors.gray[300]
								: colors.gray[700]
					}
				/>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 8,
	},
	navButton: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	disabledButton: {
		opacity: 0.5,
	},
	versionInfo: {
		marginHorizontal: 8,
		minWidth: 80,
		alignItems: 'center',
	},
});
