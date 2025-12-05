import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '~/components/ui/Text';
import { AIModelOption } from '~/services/aiService';
import { useTheme } from '~/utils/theme';

type ModelSelectorProps = {
	modelOptions: AIModelOption[];
	selectedModel: string;
	onSelectModel: (modelValue: string) => void;
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
	modelOptions,
	selectedModel,
	onSelectModel,
}) => {
	const { mode } = useTheme();
	const isDark = mode === 'dark';

	return (
		<View style={styles.container}>
			<Text style={styles.label}>Modell auswählen:</Text>
			<View style={styles.buttonContainer}>
				{modelOptions.map((model) => (
					<TouchableOpacity
						key={model.value}
						style={[
							styles.modelButton,
							selectedModel === model.value ? styles.modelButtonSelected : {},
							isDark ? styles.modelButtonDark : {},
						]}
						onPress={() => onSelectModel(model.value)}
					>
						<Text
							style={[
								styles.modelButtonText,
								selectedModel === model.value ? styles.modelButtonTextSelected : {},
								isDark ? styles.modelButtonTextDark : {},
							]}
						>
							{model.label}
						</Text>
					</TouchableOpacity>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},
	label: {
		marginBottom: 8,
		fontWeight: '500',
	},
	buttonContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	modelButton: {
		backgroundColor: '#f3f4f6',
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 4,
		marginRight: 8,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: '#e5e7eb',
	},
	modelButtonDark: {
		backgroundColor: '#374151',
		borderColor: '#4b5563',
	},
	modelButtonSelected: {
		backgroundColor: '#818cf8',
		borderColor: '#6366f1',
	},
	modelButtonText: {
		color: '#4b5563',
		fontWeight: '500',
	},
	modelButtonTextDark: {
		color: '#d1d5db',
	},
	modelButtonTextSelected: {
		color: '#ffffff',
	},
});
