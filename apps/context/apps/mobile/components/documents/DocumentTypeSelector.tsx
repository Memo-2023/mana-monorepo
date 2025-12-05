import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/utils/theme/theme';
import { ThemedButton } from '~/components/ui/ThemedButton';

export type DocumentType = 'original' | 'generated' | 'context' | 'prompt';

interface DocumentTypeSelectorProps {
	currentType: DocumentType;
	onTypeChange: (type: DocumentType) => void;
	disabled?: boolean;
}

interface TypeOption {
	value: DocumentType;
	label: string;
	icon: string;
	description: string;
}

export const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
	currentType,
	onTypeChange,
	disabled = false,
}) => {
	const { isDark } = useTheme();
	const [modalVisible, setModalVisible] = useState(false);

	const typeOptions: TypeOption[] = [
		{
			value: 'original',
			label: 'Original',
			icon: 'document-text-outline',
			description: 'Importierte oder manuell erstellte Originaltexte',
		},
		{
			value: 'generated',
			label: 'Generiert',
			icon: 'sparkles-outline',
			description: 'KI-generierte neue Texte basierend auf Originaldokumenten',
		},
		{
			value: 'context',
			label: 'Kontext',
			icon: 'information-circle-outline',
			description: 'Texte, die als Kontext für KI-Anfragen dienen',
		},
		{
			value: 'prompt',
			label: 'Prompt',
			icon: 'chatbubble-outline',
			description: 'Prompts für KI-Modelle',
		},
	];

	const currentTypeOption =
		typeOptions.find((option) => option.value === currentType) || typeOptions[0];

	const handleTypeSelect = (type: DocumentType) => {
		onTypeChange(type);
		setModalVisible(false);
	};

	const renderTypeItem = ({ item }: { item: TypeOption }) => (
		<TouchableOpacity
			style={[
				styles.typeItem,
				{ backgroundColor: isDark ? '#1f2937' : '#ffffff' },
				currentType === item.value && {
					backgroundColor: isDark ? '#374151' : '#f3f4f6',
				},
			]}
			onPress={() => handleTypeSelect(item.value)}
		>
			<View style={styles.typeItemContent}>
				<View style={styles.typeItemHeader}>
					<Ionicons name={item.icon as any} size={20} color={isDark ? '#d1d5db' : '#4b5563'} />
					<Text style={[styles.typeItemLabel, { color: isDark ? '#f9fafb' : '#111827' }]}>
						{item.label}
					</Text>
				</View>
				<Text style={[styles.typeItemDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
					{item.description}
				</Text>
			</View>
		</TouchableOpacity>
	);

	return (
		<>
			<ThemedButton
				title="Dokumenttyp"
				onPress={() => setModalVisible(true)}
				variant="secondary"
				iconName={currentTypeOption.icon as any}
				tooltip={`Dokumenttyp: ${currentTypeOption.label}`}
				disabled={disabled}
				iconOnly={true}
				style={{ marginRight: 4 }}
			/>

			{/* Modal für mobile Geräte */}
			<Modal
				visible={modalVisible}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setModalVisible(false)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setModalVisible(false)}
				>
					<View style={[styles.modalContent, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
						<View style={styles.modalHeader}>
							<Text style={[styles.modalTitle, { color: isDark ? '#f9fafb' : '#111827' }]}>
								Dokumenttyp auswählen
							</Text>
							<TouchableOpacity onPress={() => setModalVisible(false)}>
								<Ionicons name="close" size={24} color={isDark ? '#d1d5db' : '#4b5563'} />
							</TouchableOpacity>
						</View>
						<FlatList
							data={typeOptions}
							renderItem={renderTypeItem}
							keyExtractor={(item) => item.value}
							style={styles.typeList}
						/>
					</View>
				</TouchableOpacity>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		padding: 20,
	},
	modalContent: {
		width: '100%',
		maxWidth: 400,
		borderRadius: 8,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
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
	typeList: {
		maxHeight: 300,
	},
	typeItem: {
		padding: 12,
		borderRadius: 6,
		marginBottom: 8,
	},
	typeItemContent: {
		flexDirection: 'column',
	},
	typeItemHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 4,
	},
	typeItemLabel: {
		fontSize: 16,
		fontWeight: '500',
		marginLeft: 8,
	},
	typeItemDescription: {
		fontSize: 14,
		marginLeft: 28,
	},
});
