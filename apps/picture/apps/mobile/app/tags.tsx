import React, { useState, useEffect } from 'react';
import {
	View,
	Pressable,
	FlatList,
	Alert,
	ActivityIndicator,
	Modal,
	TextInput,
	RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTagStore, Tag } from '~/store/tagStore';
import { useTheme } from '~/contexts/ThemeContext';
import { Header } from '~/components/Header';
import { Button } from '~/components/Button';
import { Text } from '~/components/Text';

export default function TagsScreen() {
	const { theme } = useTheme();
	const [refreshing, setRefreshing] = useState(false);
	const [editingTag, setEditingTag] = useState<Tag | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newTagName, setNewTagName] = useState('');
	const [newTagColor, setNewTagColor] = useState('#3B82F6');
	const [editTagName, setEditTagName] = useState('');
	const [editTagColor, setEditTagColor] = useState('');

	const { tags, fetchTags, createTag, updateTag, deleteTag, isLoading, error } = useTagStore();

	const predefinedColors = [
		'#EF4444',
		'#F97316',
		'#F59E0B',
		'#EAB308',
		'#84CC16',
		'#22C55E',
		'#10B981',
		'#14B8A6',
		'#06B6D4',
		'#0EA5E9',
		'#3B82F6',
		'#6366F1',
		'#8B5CF6',
		'#A855F7',
		'#D946EF',
		'#EC4899',
		'#F43F5E',
		'#64748B',
		'#71717A',
		'#000000',
	];

	useEffect(() => {
		fetchTags();
	}, []);

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchTags();
		setRefreshing(false);
	};

	const handleCreateTag = async () => {
		if (!newTagName.trim()) return;

		const result = await createTag(newTagName.trim(), newTagColor);
		if (result) {
			setShowCreateModal(false);
			setNewTagName('');
			setNewTagColor('#3B82F6');
		}
	};

	const handleEditTag = (tag: Tag) => {
		setEditingTag(tag);
		setEditTagName(tag.name);
		setEditTagColor(tag.color || '#3B82F6');
	};

	const handleSaveEdit = async () => {
		if (!editingTag || !editTagName.trim()) return;

		const success = await updateTag(editingTag.id, {
			name: editTagName.trim().toLowerCase(),
			color: editTagColor,
		});

		if (success) {
			setEditingTag(null);
			setEditTagName('');
			setEditTagColor('');
		}
	};

	const handleDeleteTag = (tag: Tag) => {
		Alert.alert(
			'Tag löschen',
			`Möchtest du den Tag "${tag.name}" wirklich löschen? Dies entfernt ihn von allen Bildern.`,
			[
				{ text: 'Abbrechen', style: 'cancel' },
				{
					text: 'Löschen',
					style: 'destructive',
					onPress: () => deleteTag(tag.id),
				},
			]
		);
	};

	const renderTag = ({ item }: { item: Tag }) => (
		<View
			style={{
				backgroundColor: theme.colors.surface,
				borderRadius: 8,
				padding: 16,
				marginBottom: 12,
				marginHorizontal: 16,
			}}
		>
			<View className="flex-row items-center justify-between">
				<View className="flex-1 flex-row items-center">
					<View
						className="mr-3 h-6 w-6 rounded-full"
						style={{ backgroundColor: item.color || '#9CA3AF' }}
					/>
					<View className="flex-1">
						<Text variant="body" color="inverse" weight="medium">
							#{item.name}
						</Text>
						<Text variant="caption" color="secondary">
							{new Date(item.created_at).toLocaleDateString('de-DE')}
						</Text>
					</View>
				</View>

				<View className="flex-row">
					<Button
						icon="pencil"
						iconSize={20}
						variant="ghost"
						onPress={() => handleEditTag(item)}
						className="mr-2"
					/>
					<Button
						icon="trash"
						iconSize={20}
						iconColor="#ef4444"
						variant="ghost"
						onPress={() => handleDeleteTag(item)}
					/>
				</View>
			</View>
		</View>
	);

	const ColorPicker = ({
		selectedColor,
		onColorChange,
	}: {
		selectedColor: string;
		onColorChange: (color: string) => void;
	}) => (
		<View className="mb-4 flex-row flex-wrap">
			{predefinedColors.map((color) => (
				<Pressable
					key={color}
					onPress={() => onColorChange(color)}
					className="m-1 h-10 w-10 items-center justify-center rounded-full"
					style={{ backgroundColor: color }}
				>
					{selectedColor === color && <Ionicons name="checkmark" size={20} color="white" />}
				</Pressable>
			))}
		</View>
	);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<Stack.Screen
				options={{
					headerShown: false,
				}}
			/>
			<Header
				title="Tag-Verwaltung"
				showBackButton={true}
				rightContent={
					<Button
						icon="add"
						iconSize={24}
						variant="ghost"
						onPress={() => setShowCreateModal(true)}
					/>
				}
			/>

			{isLoading && !refreshing ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color={theme.colors.primary.default} />
					<Text variant="body" color="secondary" className="mt-2">
						Lade Tags...
					</Text>
				</View>
			) : (
				<FlatList
					data={tags}
					renderItem={renderTag}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ paddingVertical: 16 }}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
					ListEmptyComponent={() => (
						<View className="flex-1 items-center justify-center p-8">
							<Text className="mb-4 text-6xl">🏷️</Text>
							<Text variant="h3" color="primary" align="center" className="mb-2">
								Noch keine Tags
							</Text>
							<Text variant="body" color="secondary" align="center" className="mb-4">
								Erstelle deinen ersten Tag, um deine Bilder zu organisieren!
							</Text>
							<Button title="Ersten Tag erstellen" onPress={() => setShowCreateModal(true)} />
						</View>
					)}
				/>
			)}

			{error && (
				<View className="absolute bottom-20 left-4 right-4 rounded-lg bg-red-600 p-3">
					<Text variant="body" color="inverse" align="center">
						{error}
					</Text>
				</View>
			)}

			{/* Create Tag Modal */}
			<Modal
				visible={showCreateModal}
				transparent
				animationType="slide"
				onRequestClose={() => setShowCreateModal(false)}
			>
				<View className="flex-1 justify-end bg-black/50">
					<View
						style={{
							backgroundColor: theme.colors.surface,
							borderTopLeftRadius: 24,
							borderTopRightRadius: 24,
							padding: 24,
						}}
					>
						<Text variant="h2" color="primary" className="mb-4">
							Neuen Tag erstellen
						</Text>

						<Text variant="label" color="secondary" className="mb-2">
							Tag-Name
						</Text>
						<TextInput
							value={newTagName}
							onChangeText={setNewTagName}
							placeholder="Tag-Name eingeben..."
							placeholderTextColor="#6b7280"
							style={{
								backgroundColor: theme.colors.input,
								borderWidth: 1,
								borderColor: theme.colors.border,
								borderRadius: 8,
								paddingHorizontal: 16,
								paddingVertical: 12,
								color: theme.colors.text.primary,
								marginBottom: 16,
							}}
							autoCapitalize="none"
						/>

						<Text variant="label" color="secondary" className="mb-2">
							Farbe wählen
						</Text>
						<ColorPicker selectedColor={newTagColor} onColorChange={setNewTagColor} />

						<View className="flex-row justify-between">
							<Button
								title="Abbrechen"
								variant="secondary"
								onPress={() => {
									setShowCreateModal(false);
									setNewTagName('');
									setNewTagColor('#3B82F6');
								}}
								className="mr-2 flex-1"
							/>

							<Button
								title="Erstellen"
								onPress={handleCreateTag}
								disabled={!newTagName.trim()}
								className="ml-2 flex-1"
							/>
						</View>
					</View>
				</View>
			</Modal>

			{/* Edit Tag Modal */}
			<Modal
				visible={!!editingTag}
				transparent
				animationType="slide"
				onRequestClose={() => setEditingTag(null)}
			>
				<View className="flex-1 justify-end bg-black/50">
					<View
						style={{
							backgroundColor: theme.colors.surface,
							borderTopLeftRadius: 24,
							borderTopRightRadius: 24,
							padding: 24,
						}}
					>
						<Text variant="h2" color="primary" className="mb-4">
							Tag bearbeiten
						</Text>

						<Text variant="label" color="secondary" className="mb-2">
							Tag-Name
						</Text>
						<TextInput
							value={editTagName}
							onChangeText={setEditTagName}
							placeholder="Tag-Name eingeben..."
							placeholderTextColor="#6b7280"
							style={{
								backgroundColor: theme.colors.input,
								borderWidth: 1,
								borderColor: theme.colors.border,
								borderRadius: 8,
								paddingHorizontal: 16,
								paddingVertical: 12,
								color: theme.colors.text.primary,
								marginBottom: 16,
							}}
							autoCapitalize="none"
						/>

						<Text variant="label" color="secondary" className="mb-2">
							Farbe wählen
						</Text>
						<ColorPicker selectedColor={editTagColor} onColorChange={setEditTagColor} />

						<View className="flex-row justify-between">
							<Button
								title="Abbrechen"
								variant="secondary"
								onPress={() => {
									setEditingTag(null);
									setEditTagName('');
									setEditTagColor('');
								}}
								className="mr-2 flex-1"
							/>

							<Button
								title="Speichern"
								onPress={handleSaveEdit}
								disabled={!editTagName.trim()}
								className="ml-2 flex-1 bg-green-600"
							/>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}
