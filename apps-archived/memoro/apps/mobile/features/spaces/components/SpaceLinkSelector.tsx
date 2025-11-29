import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Button from '~/components/atoms/Button';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import { Space } from '~/features/spaces/services/spaceService';
import { useSpaceContext } from '~/features/spaces/contexts/SpaceContext';

interface SpaceLinkSelectorProps {
	visible: boolean;
	onClose: () => void;
	memoId: string;
	currentSpaceId?: string; // The ID of the space currently being viewed (if applicable)
	onSave?: () => void;
}

const SpaceLinkSelector: React.FC<SpaceLinkSelectorProps> = ({
	visible,
	onClose,
	memoId,
	currentSpaceId,
	onSave,
}) => {
	const { isDark } = useTheme();
	const { spaces, isLoading, fetchSpaces, linkMemoToSpace, unlinkMemoFromSpace, getSpaceMemos } =
		useSpaceContext();

	// Track linked spaces for this memo
	const [linkedSpaceIds, setLinkedSpaceIds] = useState<string[]>([]);
	const [initialLinkedSpaceIds, setInitialLinkedSpaceIds] = useState<string[]>([]);
	const [linkingStatus, setLinkingStatus] = useState<{
		[key: string]: 'linking' | 'unlinking' | 'idle';
	}>({});
	const [error, setError] = useState<string | null>(null);

	// Fetch spaces that contain this memo
	const fetchSpacesForMemo = async () => {
		try {
			setError(null);
			setLinkingStatus({}); // Reset all linking statuses

			console.debug(`Fetching linked spaces for memo: ${memoId}`);

			// Fetch all spaces
			const allSpaces = await fetchSpaces();
			if (!allSpaces || !memoId) {
				console.debug('No spaces found or memo ID missing');
				return;
			}

			const linkedIds: string[] = [];

			// For each space, check if the memo is in its memos list
			console.debug(`Checking ${allSpaces.length} spaces for memo ${memoId}`);

			for (const space of allSpaces) {
				try {
					console.debug(`Checking space ${space.id} (${space.name}) for memo ${memoId}`);
					const spaceMemos = await getSpaceMemos(space.id);

					if (!spaceMemos || spaceMemos.length === 0) {
						console.debug(`Space ${space.id} (${space.name}) has no memos`);
						continue;
					}

					console.debug(
						`Space ${space.id} has ${spaceMemos.length} memos, checking for memo ${memoId}`
					);
					const isMemoInSpace = spaceMemos.some((memo) => memo.id === memoId);

					if (isMemoInSpace) {
						console.debug(`✓ Memo ${memoId} IS linked to space "${space.name}" (${space.id})`);
						linkedIds.push(space.id);
					} else {
						console.debug(`✗ Memo ${memoId} is NOT linked to space "${space.name}" (${space.id})`);
					}
				} catch (error) {
					console.error(`Error checking if memo ${memoId} is in space ${space.id}:`, error);
				}
			}

			console.debug(`Found ${linkedIds.length} linked spaces for memo ${memoId}:`, linkedIds);
			setLinkedSpaceIds(linkedIds);
			setInitialLinkedSpaceIds([...linkedIds]);
		} catch (err) {
			console.error('Error fetching linked spaces:', err);
			setError('Failed to fetch linked spaces');
		}
	};

	// When modal becomes visible, fetch spaces
	useEffect(() => {
		if (visible) {
			// TODO: Temporarily disabled until spaces feature is fully implemented
			// First, ensure all spaces are fetched
			// fetchSpaces();

			// Then fetch which spaces are linked to this memo
			// fetchSpacesForMemo();

			// If we have a currentSpaceId (meaning we opened this modal from a space),
			// make sure it's included in the linked spaces list
			if (currentSpaceId) {
				console.debug(
					`Memo is being viewed from space ${currentSpaceId}, ensuring it's marked as linked`
				);
				setLinkedSpaceIds((prev) => {
					// Only add it if it's not already in the list
					if (!prev.includes(currentSpaceId)) {
						console.debug(`Adding current space ${currentSpaceId} to linked spaces`);
						return [...prev, currentSpaceId];
					}
					return prev;
				});

				setInitialLinkedSpaceIds((prev) => {
					// Also ensure it's in the initial set (so it doesn't appear as a change)
					if (!prev.includes(currentSpaceId)) {
						return [...prev, currentSpaceId];
					}
					return prev;
				});
			}
		}
	}, [visible, fetchSpaces, memoId, currentSpaceId]);

	// Toggle whether a space is marked for linking/unlinking (changes are applied on save)
	const toggleSpaceLink = (spaceId: string) => {
		// Just update the local state for now - no API calls until Save is clicked
		const isCurrentlyLinked = linkedSpaceIds.includes(spaceId);
		console.debug(
			`Marking space ${spaceId} to be ${isCurrentlyLinked ? 'unlinked from' : 'linked to'} memo ${memoId}`
		);

		// Special warning when trying to unlink the current space
		if (isCurrentlyLinked && spaceId === currentSpaceId) {
			setError(
				'Warning: This memo is currently being viewed from this space. Unlinking will remove it from this view.'
			);

			// Remove from linkedSpaceIds
			setLinkedSpaceIds((prev) => prev.filter((id) => id !== spaceId));
		} else if (isCurrentlyLinked) {
			// Regular unlink case - remove from linkedSpaceIds
			setLinkedSpaceIds((prev) => prev.filter((id) => id !== spaceId));
			// Clear any previous error
			setError(null);
		} else {
			// Link case - add to linkedSpaceIds
			setLinkedSpaceIds((prev) => [...prev, spaceId]);
			// Clear any previous error
			setError(null);
		}
	};

	// Save changes and close modal
	const handleSave = async () => {
		try {
			setError(null);

			// Determine which spaces need to be linked and which need to be unlinked
			const spacesToLink = linkedSpaceIds.filter((id) => !initialLinkedSpaceIds.includes(id));
			const spacesToUnlink = initialLinkedSpaceIds.filter((id) => !linkedSpaceIds.includes(id));

			console.debug(
				`Saving changes: linking ${spacesToLink.length} spaces and unlinking ${spacesToUnlink.length} spaces`
			);

			// Only proceed if there are changes to make
			if (spacesToLink.length === 0 && spacesToUnlink.length === 0) {
				console.debug('No changes to save');
				onClose();
				return;
			}

			setLinkingStatus({}); // Reset all statuses

			// Process all unlinks
			for (const spaceId of spacesToUnlink) {
				try {
					console.debug(`Unlinking memo ${memoId} from space ${spaceId}`);
					setLinkingStatus((prev) => ({ ...prev, [spaceId]: 'unlinking' }));
					await unlinkMemoFromSpace(memoId, spaceId);
					setLinkingStatus((prev) => ({ ...prev, [spaceId]: 'idle' }));
				} catch (error) {
					console.error(`Error unlinking space ${spaceId}:`, error);
					setError(`Failed to unlink one or more spaces`);
				}
			}

			// Process all links
			for (const spaceId of spacesToLink) {
				try {
					console.debug(`Linking memo ${memoId} to space ${spaceId}`);
					setLinkingStatus((prev) => ({ ...prev, [spaceId]: 'linking' }));
					await linkMemoToSpace(memoId, spaceId);
					setLinkingStatus((prev) => ({ ...prev, [spaceId]: 'idle' }));
				} catch (error) {
					console.error(`Error linking space ${spaceId}:`, error);
					setError(`Failed to link one or more spaces`);
				}
			}

			// Notify parent component that changes have been made
			onSave?.();

			// Close modal and return
			onClose();
		} catch (error) {
			console.error('Error saving space changes:', error);
			setError('An error occurred while saving changes');
		}
	};

	// Close without saving
	const handleCancel = () => {
		// Reset linked spaces to initial state
		setLinkedSpaceIds([...initialLinkedSpaceIds]);
		onClose();
	};

	// Render each space item
	const renderSpaceItem = ({ item }: { item: Space }) => {
		const isLinked = linkedSpaceIds.includes(item.id);
		const wasInitiallyLinked = initialLinkedSpaceIds.includes(item.id);
		const hasChanged = isLinked !== wasInitiallyLinked;
		const isLoading =
			linkingStatus[item.id] === 'linking' || linkingStatus[item.id] === 'unlinking';
		const spaceColor = item.color || '#4CAF50';

		return (
			<View style={styles.spaceItemContainer}>
				{/* Show appropriate tag based on current status and changes */}
				{wasInitiallyLinked && (
					<View
						style={[
							styles.linkedTag,
							{
								backgroundColor: hasChanged
									? '#FF3B30'
									: currentSpaceId === item.id
										? '#FF9500'
										: spaceColor,
								opacity: hasChanged ? 0.8 : 1,
							},
						]}
					>
						<Text style={styles.linkedTagText}>
							{hasChanged ? 'WILL UNLINK' : currentSpaceId === item.id ? 'CURRENT' : 'LINKED'}
						</Text>
					</View>
				)}

				{/* Show "WILL LINK" tag for spaces that will be newly linked */}
				{!wasInitiallyLinked && isLinked && (
					<View style={[styles.linkedTag, { backgroundColor: '#4CAF50' }]}>
						<Text style={styles.linkedTagText}>WILL LINK</Text>
					</View>
				)}

				<Pressable
					style={[
						styles.spaceItem,
						{
							backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(245, 245, 245, 0.8)',
							borderLeftColor: spaceColor,
							// Special styling for the current space
							...(currentSpaceId === item.id && {
								backgroundColor: isDark ? 'rgba(255, 149, 0, 0.25)' : 'rgba(255, 149, 0, 0.1)',
								borderWidth: 2,
								borderColor: '#FF9500',
								borderLeftWidth: 6,
								borderStyle: 'solid',
								shadowColor: '#FF9500',
								shadowOffset: { width: 0, height: 0 },
								shadowOpacity: 0.3,
								shadowRadius: 4,
								elevation: 4,
							}),
							// If linked but not current, use normal linked styling
							...(isLinked &&
								currentSpaceId !== item.id && {
									backgroundColor: isDark
										? `rgba(${parseInt(spaceColor.slice(1, 3), 16)}, ${parseInt(spaceColor.slice(3, 5), 16)}, ${parseInt(spaceColor.slice(5, 7), 16)}, 0.3)`
										: `rgba(${parseInt(spaceColor.slice(1, 3), 16)}, ${parseInt(spaceColor.slice(3, 5), 16)}, ${parseInt(spaceColor.slice(5, 7), 16)}, 0.15)`,
									borderWidth: 1,
									borderColor: `rgba(${parseInt(spaceColor.slice(1, 3), 16)}, ${parseInt(spaceColor.slice(3, 5), 16)}, ${parseInt(spaceColor.slice(5, 7), 16)}, 0.5)`,
									borderLeftWidth: 4,
								}),
						},
					]}
					onPress={() => !isLoading && toggleSpaceLink(item.id)}
					disabled={isLoading}
				>
					<View style={styles.spaceContent}>
						<Text
							style={[
								styles.spaceName,
								{
									color: isDark ? '#FFFFFF' : '#000000',
									...(isLinked && { fontWeight: '700' }),
								},
							]}
						>
							{item.name}
						</Text>
						{item.description ? (
							<Text
								style={[
									styles.spaceDescription,
									{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' },
								]}
							>
								{item.description}
							</Text>
						) : null}

						{/* Only show action text when the selection has changed */}
						{hasChanged && (
							<Text
								style={[
									styles.linkedLabel,
									{
										color: isLinked ? '#4CAF50' : '#FF3B30',
										fontWeight: '600',
									},
								]}
							>
								{isLinked ? 'Will be linked (tap to undo)' : 'Will be unlinked (tap to undo)'}
							</Text>
						)}
					</View>

					<View style={styles.actionArea}>
						{isLoading ? (
							<ActivityIndicator size="small" color={spaceColor} />
						) : hasChanged ? (
							isLinked ? (
								<Icon name="add-circle" size={28} color="#4CAF50" />
							) : (
								<Icon name="close-circle" size={28} color="#FF3B30" />
							)
						) : isLinked ? (
							<Icon name="checkmark-circle" size={28} color={spaceColor} />
						) : (
							<Icon
								name="ellipse-outline"
								size={28}
								color={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)'}
							/>
						)}
					</View>
				</Pressable>
			</View>
		);
	};

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
		},
		modalContent: {
			width: '90%',
			maxWidth: 500,
			maxHeight: '80%',
			backgroundColor: isDark ? '#121212' : '#FFFFFF',
			borderRadius: 12,
			padding: 20,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.25,
			shadowRadius: 3.84,
			elevation: 5,
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: 12,
		},
		title: {
			fontSize: 20,
			fontWeight: 'bold',
			color: isDark ? '#FFFFFF' : '#000000',
		},
		description: {
			fontSize: 14,
			marginBottom: 16,
		},
		closeButton: {
			padding: 8,
		},
		divider: {
			height: 1,
			backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
			marginBottom: 16,
		},
		spaceItemContainer: {
			position: 'relative',
			marginBottom: 16,
		},
		linkedTag: {
			position: 'absolute',
			top: -8,
			right: 0,
			paddingHorizontal: 8,
			paddingVertical: 2,
			borderRadius: 4,
			zIndex: 1,
		},
		linkedTagText: {
			color: '#FFFFFF',
			fontSize: 10,
			fontWeight: 'bold',
		},
		spaceItem: {
			flexDirection: 'row',
			alignItems: 'center',
			padding: 16,
			borderRadius: 8,
			borderLeftWidth: 4,
		},
		spaceContent: {
			flex: 1,
		},
		spaceName: {
			fontSize: 16,
			fontWeight: 'bold',
		},
		spaceDescription: {
			fontSize: 14,
			marginTop: 4,
		},
		linkedLabel: {
			fontSize: 12,
			marginTop: 6,
			fontWeight: '500',
		},
		actionArea: {
			width: 40,
			height: 40,
			justifyContent: 'center',
			alignItems: 'center',
		},
		buttonContainer: {
			flexDirection: 'row',
			justifyContent: 'flex-end',
			marginTop: 20,
		},
		button: {
			marginLeft: 12,
		},
		errorText: {
			color: '#FF3B30',
			marginBottom: 16,
			textAlign: 'center',
		},
		loadingContainer: {
			padding: 20,
			alignItems: 'center',
		},
		emptyContainer: {
			alignItems: 'center',
			padding: 20,
		},
		emptyText: {
			textAlign: 'center',
			marginTop: 8,
			color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
		},
	});

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
			<View style={styles.container}>
				<View style={styles.modalContent}>
					<View style={styles.header}>
						<Text style={styles.title}>Manage Spaces</Text>
						<Pressable style={styles.closeButton} onPress={handleCancel}>
							<Icon name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
						</Pressable>
					</View>
					<Text
						style={[
							styles.description,
							{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' },
						]}
					>
						Select which spaces this memo should be linked to. Tap a space to select/deselect it,
						then click Save to apply your changes. Linked memos will appear when browsing a space.
					</Text>

					<View style={styles.divider} />

					{error && <Text style={styles.errorText}>{error}</Text>}

					{isLoading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
							<Text style={{ marginTop: 16, color: isDark ? '#FFFFFF' : '#000000' }}>
								Loading spaces...
							</Text>
						</View>
					) : spaces.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Icon
								name="folder-outline"
								size={48}
								color={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
							/>
							<Text style={styles.emptyText}>
								You don't have any spaces yet.{'\n'}
								Create spaces to organize your memos.
							</Text>
						</View>
					) : (
						<FlatList
							data={spaces}
							renderItem={renderSpaceItem}
							keyExtractor={(item) => item.id}
							contentContainerStyle={{ paddingBottom: 16 }}
							showsVerticalScrollIndicator={true}
						/>
					)}

					<View style={styles.buttonContainer}>
						<Button title="Cancel" variant="outline" onPress={handleCancel} style={styles.button} />
						<Button title="Save" onPress={handleSave} style={styles.button} />
					</View>
				</View>
			</View>
		</Modal>
	);
};

export default SpaceLinkSelector;
