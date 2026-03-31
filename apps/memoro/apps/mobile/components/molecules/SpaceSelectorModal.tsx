import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from '~/components/atoms/Icon';
import BaseModal from '~/components/atoms/BaseModal';
import Text from '~/components/atoms/Text';
import { Space } from '~/features/spaces';

interface SpaceSelectorModalProps {
	visible: boolean;
	onClose: () => void;
	spaces: Space[];
	onSelectSpace: (spaceId: string) => void;
	selectedSpaceId: string | null;
}

/**
 * Eine Komponente, die einen Modal für die Auswahl eines Spaces anzeigt.
 *
 * Beispiel:
 * ```tsx
 * <SpaceSelectorModal
 *   visible={isSpaceSelectorVisible}
 *   onClose={() => setIsSpaceSelectorVisible(false)}
 *   spaces={spaces}
 *   onSelectSpace={handleSelectSpace}
 *   selectedSpaceId={selectedSpaceId}
 * />
 * ```
 */
const SpaceSelectorModal = ({
	visible,
	onClose,
	spaces,
	onSelectSpace,
	selectedSpaceId,
}: SpaceSelectorModalProps) => {
	const { isDark } = useTheme();

	// Dynamische Klassen basierend auf dem Theme
	const headerTextClass = isDark ? 'text-white' : 'text-black';
	const emptyTextClass = isDark ? 'text-gray-400' : 'text-gray-500';

	return (
		<BaseModal
			isVisible={visible}
			onClose={onClose}
			title="Space auswählen"
			animationType="fade"
			closeOnOverlayPress={true}
		>
			{/* Space Liste */}
			{spaces.length === 0 ? (
				<View className="items-center justify-center py-8">
					<Text className={emptyTextClass}>Keine Spaces gefunden.</Text>
				</View>
			) : (
				<ScrollView>
					<View className="gap-2">
						{spaces.map((space) => (
							<Pressable
								key={space.id}
								className="flex-row items-center p-3 rounded-lg border-l-4"
								style={{ borderLeftColor: space.color || '#4CAF50' }}
								onPress={() => onSelectSpace(space.id)}
							>
								<View className="flex-1">
									<Text className={`font-medium ${headerTextClass}`}>{space.name}</Text>
									{space.description && (
										<Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
											{space.description}
										</Text>
									)}
								</View>
								{selectedSpaceId === space.id && (
									<Icon name="checkmark-circle" size={24} color="#4CAF50" />
								)}
							</Pressable>
						))}
					</View>
				</ScrollView>
			)}
		</BaseModal>
	);
};

export default SpaceSelectorModal;
