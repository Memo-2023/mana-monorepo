import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Modal, FlatList, Platform, Dimensions } from 'react-native';
import Icon from '~/components/atoms/Icon';
import Text from '~/components/atoms/Text';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useSpaceContext, Space } from '~/features/spaces';
import colors from '~/tailwind.config.js';

interface SpaceSelectorProps {
	selectedSpaceId: string | null;
	onSelectSpace: (spaceId: string | null) => void;
	size?: number;
}

/**
 * SpaceSelector component
 *
 * A dropdown component that allows users to select a space.
 *
 * Example:
 * ```tsx
 * <SpaceSelector
 *   selectedSpaceId={selectedSpaceId}
 *   onSelectSpace={handleSpaceSelect}
 *   size={40}
 * />
 * ```
 */
function SpaceSelector({ selectedSpaceId, onSelectSpace, size = 40 }: SpaceSelectorProps) {
	const { isDark, themeVariant } = useTheme();
	const { spaces, isLoading, fetchSpaces } = useSpaceContext();
	const [isModalVisible, setModalVisible] = useState(false);
	const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

	// Fetch spaces when component mounts
	// TODO: Temporarily disabled until spaces feature is fully implemented
	// useEffect(() => {
	//   fetchSpaces();
	// }, [fetchSpaces]);

	// Update selected space when selectedSpaceId changes
	useEffect(() => {
		if (selectedSpaceId && spaces.length > 0) {
			const space = spaces.find((space) => space.id === selectedSpaceId);
			setSelectedSpace(space || null);
		} else {
			setSelectedSpace(null);
		}
	}, [selectedSpaceId, spaces]);

	const handleOpenModal = () => {
		setModalVisible(true);
	};

	const handleCloseModal = () => {
		setModalVisible(false);
	};

	const handleSelectSpace = (space: Space | null) => {
		onSelectSpace(space?.id || null);
		setSelectedSpace(space);
		handleCloseModal();
	};

	// Textfarbe für das Icon direkt aus der Tailwind-Konfiguration
	const iconColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.text || '#FFFFFF'
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.text || '#000000';

	// Primärfarbe für Auswahlindikator
	const primaryColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.primary || '#f8d62b'
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.primary || '#f8d62b';

	const renderSpaceItem = ({ item }: { item: Space }) => {
		const isSelected = item.id === selectedSpaceId;
		return (
			<Pressable
				style={[styles.spaceItem, isSelected && styles.selectedSpaceItem]}
				onPress={() => handleSelectSpace(item)}
			>
				<View style={[styles.spaceColorIndicator, { backgroundColor: item.color }]} />
				<Text style={styles.spaceName}>{item.name}</Text>
				{isSelected && <Icon name="checkmark" size={20} color={primaryColor} />}
			</Pressable>
		);
	};

	return (
		<View style={[styles.container, { width: size, height: size }]}>
			<Pressable
				style={[styles.selectorButton, { width: size, height: size }]}
				onPress={handleOpenModal}
			>
				{selectedSpace ? (
					<View style={[styles.selectedSpaceDot, { backgroundColor: selectedSpace.color }]} />
				) : (
					<View style={{ opacity: 0.5 }}>
						<Icon name="folder-outline" size={size * 0.6} color={iconColor} />
					</View>
				)}
			</Pressable>

			<Modal
				visible={isModalVisible}
				transparent
				animationType="fade"
				onRequestClose={handleCloseModal}
			>
				<Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
					<View
						style={[
							styles.modalContent,
							{
								backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
							},
						]}
						onStartShouldSetResponder={() => true}
					>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Select Space</Text>
							<Pressable onPress={handleCloseModal}>
								<Icon name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
							</Pressable>
						</View>

						<FlatList
							data={spaces}
							renderItem={renderSpaceItem}
							keyExtractor={(item) => item.id}
							contentContainerStyle={styles.spacesList}
							ListHeaderComponent={
								<Pressable
									style={[styles.spaceItem, !selectedSpaceId && styles.selectedSpaceItem]}
									onPress={() => handleSelectSpace(null)}
								>
									<Icon name="home-outline" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
									<Text style={styles.spaceName}>No Space (Default)</Text>
									{!selectedSpaceId && <Icon name="checkmark" size={20} color={primaryColor} />}
								</Pressable>
							}
						/>
					</View>
				</Pressable>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	selectorButton: {
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	selectedSpaceDot: {
		width: '70%',
		height: '70%',
		borderRadius: 100,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'transparent',
		justifyContent: 'flex-start',
		alignItems: 'center',
		paddingTop: Dimensions.get('window')?.height ? Dimensions.get('window').height * 0.515 : 300,
		paddingHorizontal: 20,
	},
	modalContent: {
		width: '90%',
		borderRadius: 12,
		padding: 16,
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.25,
				shadowRadius: 3.84,
			},
			android: {
				elevation: 5,
			},
		}),
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	spacesList: {
		paddingBottom: 16,
	},
	spaceItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 8,
		borderRadius: 8,
	},
	selectedSpaceItem: {
		backgroundColor: 'rgba(128, 128, 128, 0.1)',
	},
	spaceColorIndicator: {
		width: 16,
		height: 16,
		borderRadius: 8,
		marginRight: 12,
	},
	spaceName: {
		flex: 1,
		fontSize: 16,
	},
});

export default SpaceSelector;
