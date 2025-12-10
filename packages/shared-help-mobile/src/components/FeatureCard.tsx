/**
 * Feature Card component for mobile
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { FeatureItem } from '@manacore/shared-help-types';

interface FeatureCardProps {
	item: FeatureItem;
	comingSoonLabel?: string;
}

export function FeatureCard({ item, comingSoonLabel = 'Coming soon' }: FeatureCardProps) {
	return (
		<View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border border-gray-200 dark:border-gray-700">
			<View className="flex-row items-center mb-2">
				{item.icon && <Text className="text-2xl mr-3">{item.icon}</Text>}
				<View className="flex-1">
					<View className="flex-row items-center">
						<Text className="font-semibold text-gray-900 dark:text-gray-100 text-base">
							{item.title}
						</Text>
						{item.comingSoon && (
							<View className="ml-2 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
								<Text className="text-xs text-amber-700 dark:text-amber-400">
									{comingSoonLabel}
								</Text>
							</View>
						)}
					</View>
				</View>
			</View>

			<Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">{item.description}</Text>

			{item.highlights && item.highlights.length > 0 && (
				<View className="mt-2">
					{item.highlights.map((highlight, index) => (
						<View key={index} className="flex-row items-start mb-1">
							<Text className="text-green-500 mr-2">✓</Text>
							<Text className="text-gray-600 dark:text-gray-400 text-sm flex-1">{highlight}</Text>
						</View>
					))}
				</View>
			)}
		</View>
	);
}
