import React, { useState, useMemo } from 'react';
import { View, ScrollView, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import BaseModal from '~/components/atoms/BaseModal';
import Pill from '~/components/atoms/Pill';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import Icon from '~/components/atoms/Icon';
import { useTheme } from '~/features/theme/ThemeProvider';
import TagModal from '~/features/tags/TagModal';
import { useTranslation } from 'react-i18next';

interface TagItem {
	id: string;
	text: string;
	color: string;
}

interface TagSelectorModalProps {
	isVisible: boolean;
	onClose: () => void;
	onTagSelect: (tagId: string) => void;
	selectedTagIds: string[];
	tagItems: TagItem[];
	isLoading: boolean;
	title?: string;
	onCreateTag?: (name: string, color: string) => Promise<void>;
}

/**
 * Modal component for selecting tags to apply to memos
 * Uses BaseModal for consistent styling and behavior
 */
const TagSelectorModal: React.FC<TagSelectorModalProps> = ({
	isVisible,
	onClose,
	onTagSelect,
	selectedTagIds,
	tagItems,
	isLoading,
	title,
	onCreateTag,
}) => {
	const { isDark, tw, themeVariant } = useTheme();
	const { t } = useTranslation();
	const [isCreatingTag, setIsCreatingTag] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	// Filter tags based on search query
	const filteredTags = useMemo(() => {
		if (!searchQuery.trim()) return tagItems;

		const query = searchQuery.toLowerCase();
		return tagItems.filter((tag) => tag.text.toLowerCase().includes(query));
	}, [tagItems, searchQuery]);

	// Empty state message when no tags are available or found
	const renderEmptyState = () => (
		<View className="items-center justify-center py-8">
			<Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>
				{searchQuery.trim()
					? t('tags.no_tags_matching_search', 'No tags found matching your search.')
					: t('tags.no_tags_found', 'No tags found.')}
			</Text>
		</View>
	);

	// Loading indicator
	const renderLoading = () => (
		<View className="items-center justify-center py-8">
			<ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
		</View>
	);

	// Custom styled tag component using Pill to match TagList styling
	const StyledTag = ({ tagItem, isSelected }: { tagItem: TagItem; isSelected: boolean }) => {
		return (
			<View className="relative" style={{ padding: 1 }}>
				<Pill
					label={tagItem.text}
					color={tagItem.color}
					isSelected={isSelected}
					onPress={() => onTagSelect(tagItem.id)}
					size="large"
					maxLength={20}
					style={{
						borderWidth: 1, // Konstante Rahmenbreite
						// Wenn ausgewählt, machen wir den Hintergrund kräftiger und den Rand dunkler
						backgroundColor: isSelected ? `${tagItem.color}55` : `${tagItem.color}33`,
						borderColor: isSelected ? tagItem.color : `${tagItem.color}77`, // Dunklerer Rand bei Auswahl, hellerer bei nicht ausgewählt
					}}
				/>
				{isSelected && (
					<View
						className="absolute -right-1 -top-1 rounded-full p-1"
						style={{ backgroundColor: tagItem.color }}
					>
						<Icon name="checkmark" size={10} color="#fff" />
					</View>
				)}
			</View>
		);
	};

	// Tags grid
	const renderTags = () => (
		<ScrollView className="max-h-[300px]">
			<View className="flex-row flex-wrap py-2" style={{ gap: 8 }}>
				{filteredTags.map((tagItem) => (
					<View key={tagItem.id} className="mb-1 mr-1">
						<StyledTag tagItem={tagItem} isSelected={selectedTagIds.includes(tagItem.id)} />
					</View>
				))}
			</View>
		</ScrollView>
	);

	// Handle tag creation through the separate modal
	const handleCreateTag = async (name: string, color: string) => {
		if (onCreateTag) {
			await onCreateTag(name, color);
			setIsCreatingTag(false);
		}
	};

	// Handle opening the tag creation modal
	const handleOpenTagCreation = () => {
		console.debug('Opening tag creation modal');
		setIsCreatingTag(true);
	};

	// Handle canceling tag creation
	const handleCancelTagCreation = () => {
		console.debug('Canceling tag creation');
		setIsCreatingTag(false);
	};

	// Render the create tag button
	const renderCreateTagButton = () => (
		<View className="w-full">
			<Button
				title={t('tags.create_new_tag', 'Create New Tag')}
				onPress={handleOpenTagCreation}
				variant="secondary"
				iconName="add-outline"
			/>
		</View>
	);

	// Render footer content with Create New Tag button
	const renderFooterContent = () => {
		return onCreateTag ? renderCreateTagButton() : null;
	};

	return (
		<>
			<BaseModal
				isVisible={isVisible && !isCreatingTag}
				onClose={onClose}
				title={title || t('tags.select_tag', 'Select Tag')}
				animationType="fade"
				closeOnOverlayPress={true}
				hideFooter={!onCreateTag}
				footerContent={renderFooterContent()}
			>
				<View>
					{/* Search Input */}
					<View
						className="mb-3 flex-row items-center rounded-lg px-3 py-2"
						style={{
							backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
							borderWidth: 1,
							borderColor: isDark ? '#3a3a3a' : '#e0e0e0',
						}}
					>
						<Icon
							name="search-outline"
							size={20}
							color={isDark ? '#888' : '#666'}
							style={{ marginRight: 8 }}
						/>
						<TextInput
							value={searchQuery}
							onChangeText={setSearchQuery}
							placeholder={t('tags.search_tags', 'Search tags...')}
							placeholderTextColor={isDark ? '#666' : '#999'}
							style={{
								flex: 1,
								fontSize: 16,
								color: isDark ? '#fff' : '#000',
								padding: 0,
							}}
							autoCapitalize="none"
							autoCorrect={false}
							returnKeyType="search"
						/>
						{searchQuery.length > 0 && (
							<TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
								<Icon name="close-circle" size={20} color={isDark ? '#888' : '#666'} />
							</TouchableOpacity>
						)}
					</View>

					{/* Tag Content */}
					{isLoading
						? renderLoading()
						: filteredTags.length === 0
							? renderEmptyState()
							: renderTags()}
				</View>
			</BaseModal>

			{/* Separate TagModal for creating new tags */}
			<TagModal
				isVisible={isCreatingTag}
				onClose={handleCancelTagCreation}
				onCancel={handleCancelTagCreation}
				onSave={handleCreateTag}
				editingTag={null}
				isDark={isDark}
			/>
		</>
	);
};

export default TagSelectorModal;
