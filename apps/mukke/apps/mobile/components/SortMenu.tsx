import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View, Text, Modal } from 'react-native';

import type { SortField, SortDirection } from '~/types';
import { useTheme } from '~/utils/themeContext';

const SORT_OPTIONS: { field: SortField; label: string }[] = [
	{ field: 'title', label: 'Titel' },
	{ field: 'artist', label: 'Künstler' },
	{ field: 'album', label: 'Album' },
	{ field: 'addedAt', label: 'Hinzugefügt' },
	{ field: 'playCount', label: 'Wiedergaben' },
];

interface SortMenuProps {
	currentField: SortField;
	currentDirection: SortDirection;
	onSort: (field: SortField, direction: SortDirection) => void;
}

export function SortMenu({ currentField, currentDirection, onSort }: SortMenuProps) {
	const { colors } = useTheme();
	const [visible, setVisible] = useState(false);

	return (
		<>
			<Pressable onPress={() => setVisible(true)} style={{ padding: 8 }}>
				<Ionicons name="swap-vertical" size={22} color={colors.primary} />
			</Pressable>

			<Modal visible={visible} transparent animationType="fade">
				<Pressable
					onPress={() => setVisible(false)}
					style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
				>
					<View
						style={{
							backgroundColor: colors.card,
							borderTopLeftRadius: 16,
							borderTopRightRadius: 16,
							padding: 20,
							paddingBottom: 40,
						}}
					>
						<Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
							Sortieren
						</Text>
						{SORT_OPTIONS.map((opt) => {
							const isActive = opt.field === currentField;
							return (
								<Pressable
									key={opt.field}
									onPress={() => {
										if (isActive) {
											onSort(opt.field, currentDirection === 'asc' ? 'desc' : 'asc');
										} else {
											onSort(opt.field, 'asc');
										}
										setVisible(false);
									}}
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										paddingVertical: 14,
										borderBottomWidth: 0.5,
										borderBottomColor: colors.border,
									}}
								>
									<Text
										style={{
											flex: 1,
											fontSize: 16,
											color: isActive ? colors.primary : colors.text,
											fontWeight: isActive ? '600' : '400',
										}}
									>
										{opt.label}
									</Text>
									{isActive && (
										<Ionicons
											name={currentDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
											size={18}
											color={colors.primary}
										/>
									)}
								</Pressable>
							);
						})}
					</View>
				</Pressable>
			</Modal>
		</>
	);
}
