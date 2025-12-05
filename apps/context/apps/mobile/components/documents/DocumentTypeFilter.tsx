import React from 'react';
import { ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterPill } from '~/components/ui/FilterPill';

export type DocumentType = 'original' | 'generated' | 'context' | 'prompt';

interface DocumentTypeFilterProps {
	selectedType: DocumentType | null;
	onTypeChange: (type: DocumentType | null) => void;
}

interface FilterOption {
	value: DocumentType;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
	color: {
		light: string;
		dark: string;
	};
}

export const DocumentTypeFilter: React.FC<DocumentTypeFilterProps> = ({
	selectedType,
	onTypeChange,
}) => {
	const filterOptions: FilterOption[] = [
		{
			value: 'original',
			label: 'Original',
			icon: 'document-text-outline',
			color: {
				light: '#2563eb',
				dark: '#3b82f6',
			},
		},
		{
			value: 'generated',
			label: 'Generiert',
			icon: 'sparkles-outline',
			color: {
				light: '#0891b2',
				dark: '#06b6d4',
			},
		},
		{
			value: 'context',
			label: 'Kontext',
			icon: 'information-circle-outline',
			color: {
				light: '#16a34a',
				dark: '#22c55e',
			},
		},
		{
			value: 'prompt',
			label: 'Prompt',
			icon: 'chatbubble-outline',
			color: {
				light: '#d97706',
				dark: '#f59e0b',
			},
		},
	];

	// Keine 'Alle' Option mehr, da wir jetzt Toggle-Funktionalität haben

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			style={{
				flexDirection: 'row',
				width: '100%',
				paddingLeft: 16, // Padding links für Abstand zum Rand
			}}
			contentContainerStyle={{
				paddingRight: 32, // Ausreichendes Padding am Ende
			}}
		>
			{filterOptions.map((option) => (
				<FilterPill
					key={option.value}
					label={option.label}
					icon={option.icon}
					variant="document"
					isSelected={selectedType === option.value}
					onPress={() => {
						// Wenn der Filter bereits ausgewählt ist, deselektieren (null setzen)
						if (selectedType === option.value) {
							onTypeChange(null);
						} else {
							onTypeChange(option.value);
						}
					}}
					color={option.color}
				/>
			))}
		</ScrollView>
	);
};
