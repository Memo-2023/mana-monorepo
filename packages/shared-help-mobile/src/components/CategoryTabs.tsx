/**
 * Category Tabs component for mobile Help screen
 */

import React from 'react';
import { Text, TouchableOpacity, ScrollView } from 'react-native';
import type { HelpSection } from '../types';

interface CategoryTabsProps {
	sections: Array<{ id: HelpSection; label: string; show: boolean }>;
	activeSection: HelpSection;
	onSectionChange: (section: HelpSection) => void;
}

export function CategoryTabs({ sections, activeSection, onSectionChange }: CategoryTabsProps) {
	const visibleSections = sections.filter((s) => s.show);

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			className="mb-4"
			contentContainerStyle={{ paddingHorizontal: 4 }}
		>
			{visibleSections.map((section) => (
				<TouchableOpacity
					key={section.id}
					onPress={() => onSectionChange(section.id)}
					className={`px-4 py-2 mr-2 rounded-full ${
						activeSection === section.id
							? 'bg-blue-500 dark:bg-blue-600'
							: 'bg-gray-100 dark:bg-gray-800'
					}`}
				>
					<Text
						className={`text-sm font-medium ${
							activeSection === section.id ? 'text-white' : 'text-gray-600 dark:text-gray-300'
						}`}
					>
						{section.label}
					</Text>
				</TouchableOpacity>
			))}
		</ScrollView>
	);
}
