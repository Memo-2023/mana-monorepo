/**
 * FAQ List component for mobile
 */

import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { FAQItem } from './FAQItem';
import type { FAQListProps } from '../types';

export function FAQList({ items, translations }: FAQListProps) {
	const [expandedId, setExpandedId] = useState<string | null>(
		items.length > 0 ? items[0].id : null
	);

	function toggleItem(id: string) {
		setExpandedId(expandedId === id ? null : id);
	}

	if (items.length === 0) {
		return (
			<View className="py-8 items-center">
				<Text className="text-gray-500 dark:text-gray-400">{translations.faq.noItems}</Text>
			</View>
		);
	}

	return (
		<View>
			{items.map((item) => (
				<FAQItem
					key={item.id}
					item={item}
					expanded={expandedId === item.id}
					onToggle={() => toggleItem(item.id)}
				/>
			))}
		</View>
	);
}
