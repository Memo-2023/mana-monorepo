import { View, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { Text } from '../Text';
import { useTheme } from '~/contexts/ThemeContext';
import { STYLE_KEYWORDS, CATEGORY_LABELS, StyleKeyword } from '~/constants/promptTemplates';

type PromptBuilderProps = {
	onPromptChange: (prompt: string) => void;
	initialPrompt?: string;
};

export function PromptBuilder({ onPromptChange, initialPrompt = '' }: PromptBuilderProps) {
	const { theme } = useTheme();
	const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
	const [basePrompt, setBasePrompt] = useState(initialPrompt);

	const toggleKeyword = (keyword: StyleKeyword) => {
		let newKeywords: string[];

		if (selectedKeywords.includes(keyword.id)) {
			newKeywords = selectedKeywords.filter((id) => id !== keyword.id);
		} else {
			newKeywords = [...selectedKeywords, keyword.id];
		}

		setSelectedKeywords(newKeywords);
		updatePrompt(basePrompt, newKeywords);
	};

	const updatePrompt = (base: string, keywords: string[]) => {
		const keywordStrings = keywords
			.map((id) => STYLE_KEYWORDS.find((k) => k.id === id)?.value)
			.filter(Boolean);

		const combined = [base, ...keywordStrings].filter(Boolean).join(', ');
		onPromptChange(combined);
	};

	const categories = Object.entries(
		STYLE_KEYWORDS.reduce(
			(acc, keyword) => {
				if (!acc[keyword.category]) {
					acc[keyword.category] = [];
				}
				acc[keyword.category].push(keyword);
				return acc;
			},
			{} as Record<string, StyleKeyword[]>
		)
	);

	return (
		<View>
			{categories.map(([category, keywords]) => (
				<View key={category} style={{ marginBottom: 20 }}>
					<Text
						variant="bodySmall"
						weight="semibold"
						color="secondary"
						style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}
					>
						{CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
					</Text>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ gap: 8 }}
					>
						{keywords.map((keyword) => {
							const isSelected = selectedKeywords.includes(keyword.id);

							return (
								<Pressable
									key={keyword.id}
									onPress={() => toggleKeyword(keyword)}
									style={{
										paddingHorizontal: 14,
										paddingVertical: 8,
										borderRadius: 20,
										backgroundColor: isSelected ? keyword.color : theme.colors.surface,
										borderWidth: 1,
										borderColor: isSelected ? keyword.color : theme.colors.border,
									}}
								>
									<Text
										variant="bodySmall"
										weight={isSelected ? 'semibold' : 'medium'}
										style={{ color: isSelected ? '#fff' : theme.colors.text.primary }}
									>
										{keyword.label}
									</Text>
								</Pressable>
							);
						})}
					</ScrollView>
				</View>
			))}

			{selectedKeywords.length > 0 && (
				<View
					style={{
						marginTop: 8,
						padding: 12,
						backgroundColor: theme.colors.surface,
						borderRadius: 8,
						borderWidth: 1,
						borderColor: theme.colors.border,
					}}
				>
					<Text variant="bodySmall" color="secondary" style={{ marginBottom: 4 }}>
						Hinzugefügte Keywords:
					</Text>
					<Text variant="bodySmall" color="primary" weight="medium">
						{selectedKeywords
							.map((id) => STYLE_KEYWORDS.find((k) => k.id === id)?.value)
							.join(', ')}
					</Text>
				</View>
			)}
		</View>
	);
}
