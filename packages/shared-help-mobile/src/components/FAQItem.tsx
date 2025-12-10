/**
 * Expandable FAQ Item component for mobile
 */

import React from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import type { FAQItem as FAQItemType } from '@manacore/shared-help-types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItemProps {
	item: FAQItemType;
	expanded?: boolean;
	onToggle?: () => void;
}

export function FAQItem({ item, expanded = false, onToggle }: FAQItemProps) {
	function handlePress() {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		onToggle?.();
	}

	// Strip HTML tags for mobile display
	const plainAnswer = item.answer.replace(/<[^>]*>/g, '').trim();

	return (
		<View className="border-b border-gray-200 dark:border-gray-700">
			<TouchableOpacity
				onPress={handlePress}
				className="py-4 flex-row items-center justify-between"
				accessibilityRole="button"
				accessibilityState={{ expanded }}
			>
				<Text className="flex-1 pr-4 font-medium text-gray-900 dark:text-gray-100 text-base">
					{item.question}
				</Text>
				<Text
					className="text-gray-500 dark:text-gray-400"
					style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
				>
					▼
				</Text>
			</TouchableOpacity>

			{expanded && (
				<View className="pb-4">
					<Text className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
						{plainAnswer}
					</Text>
				</View>
			)}
		</View>
	);
}
