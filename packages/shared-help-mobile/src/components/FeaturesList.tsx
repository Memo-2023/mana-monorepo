/**
 * Features List component for mobile
 */

import React from 'react';
import { View, Text } from 'react-native';
import { FeatureCard } from './FeatureCard';
import type { FeaturesListProps } from '../types';

export function FeaturesList({ items, translations }: FeaturesListProps) {
	if (items.length === 0) {
		return (
			<View className="py-8 items-center">
				<Text className="text-gray-500 dark:text-gray-400">{translations.features.noItems}</Text>
			</View>
		);
	}

	return (
		<View>
			{items.map((item) => (
				<FeatureCard key={item.id} item={item} comingSoonLabel={translations.features.comingSoon} />
			))}
		</View>
	);
}
