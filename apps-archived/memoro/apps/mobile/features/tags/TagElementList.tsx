import React from 'react';
import { FlatList, StyleSheet, ViewStyle, View } from 'react-native';
import { TagElement } from '@/components/features/tags/TagElement';
import { ProjectModel } from '@/placeholders/projectData';
import useSettingsStore from '@/stores/settingsStore';
import EmptyTagElementList from '@/components/features/tags/EmptyTagElementList';

interface TagElementListProps {
	tags: ProjectModel[];
	onTagPress?: (tag: ProjectModel) => void;
	onTagEdit?: (tag: ProjectModel) => void;
	onTagView?: (tag: ProjectModel) => void;
	viewingTagId?: string | null;
	style?: ViewStyle;
}

export const TagElementList: React.FC<TagElementListProps> = ({
	tags,
	onTagPress,
	onTagEdit,
	onTagView,
	viewingTagId,
	style,
}) => {
	console.debug('TagElementList Props:', {
		tagsCount: tags.length,
		hasTagPress: !!onTagPress,
		hasTagEdit: !!onTagEdit,
		hasTagView: !!onTagView,
		viewingTagId,
	});

	const { showDebugBorders } = useSettingsStore();

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			...(showDebugBorders && {
				borderWidth: 1,
				borderColor: 'red',
			}),
		},
		list: {
			flex: 1,
			...(showDebugBorders && {
				borderWidth: 1,
				borderColor: 'blue',
			}),
		},
		contentContainer: {
			paddingHorizontal: 16,
			paddingTop: 16,
			paddingBottom: 80,
		},
	});

	const renderItem = ({ item }: { item: ProjectModel }) => {
		console.debug('Rendering tag:', {
			id: item.id,
			name: item.projectName,
			hasEdit: !!onTagEdit,
			hasView: !!onTagView,
		});

		return (
			<TagElement
				text={item.projectName || ''}
				color={item.color || '#000000'}
				onPress={() => {
					console.debug('Tag pressed:', item.id);
					onTagPress?.(item);
				}}
				onIconPress1={
					onTagEdit
						? () => {
								console.debug('Edit pressed:', item.id);
								onTagEdit(item);
							}
						: undefined
				}
				onIconPress2={
					onTagView
						? () => {
								console.debug('View pressed:', item.id);
								onTagView(item);
							}
						: undefined
				}
				isViewing={viewingTagId === item.id}
				isVisible={item.isVisible ?? true}
			/>
		);
	};

	return (
		<View style={[styles.container, style]}>
			{tags.length === 0 ? (
				<EmptyTagElementList />
			) : (
				<FlatList
					style={styles.list}
					data={tags}
					keyExtractor={(item) => item.id || Math.random().toString()}
					renderItem={renderItem}
					contentContainerStyle={styles.contentContainer}
				/>
			)}
		</View>
	);
};
