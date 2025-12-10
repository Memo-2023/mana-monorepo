/**
 * Main Help Screen component for mobile apps
 */

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import type { HelpScreenProps, HelpSection } from '../types';
import { HelpSearchBar } from '../components/HelpSearchBar';
import { CategoryTabs } from '../components/CategoryTabs';
import { FAQList } from '../components/FAQList';
import { FeaturesList } from '../components/FeaturesList';
import { ContactCard } from '../components/ContactCard';
import { useHelpSearch } from '../hooks/useHelpContent';
import type { SearchResult } from '@manacore/shared-help-types';

export function HelpScreen({
	content,
	appName,
	appId: _appId,
	translations,
	onBack: _onBack,
	defaultSection = 'faq',
}: HelpScreenProps) {
	const [activeSection, setActiveSection] = useState<HelpSection>(defaultSection);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

	const { search } = useHelpSearch(content);

	// Define available sections
	const sections = useMemo(
		() => [
			{ id: 'faq' as HelpSection, label: translations.sections.faq, show: content.faq.length > 0 },
			{
				id: 'features' as HelpSection,
				label: translations.sections.features,
				show: content.features.length > 0,
			},
			{
				id: 'shortcuts' as HelpSection,
				label: translations.sections.shortcuts,
				show: content.shortcuts.length > 0,
			},
			{
				id: 'getting-started' as HelpSection,
				label: translations.sections.gettingStarted,
				show: content.gettingStarted.length > 0,
			},
			{
				id: 'changelog' as HelpSection,
				label: translations.sections.changelog,
				show: content.changelog.length > 0,
			},
			{
				id: 'contact' as HelpSection,
				label: translations.sections.contact,
				show: !!content.contact,
			},
		],
		[content, translations]
	);

	function handleSearch(query: string) {
		setSearchQuery(query);
		if (query.trim().length >= 2) {
			const results = search(query, 10);
			setSearchResults(results);
		} else {
			setSearchResults([]);
		}
	}

	function handleClearSearch() {
		setSearchQuery('');
		setSearchResults([]);
	}

	function handleResultPress(result: SearchResult) {
		// Navigate to appropriate section
		switch (result.type) {
			case 'faq':
				setActiveSection('faq');
				break;
			case 'feature':
				setActiveSection('features');
				break;
			case 'guide':
				setActiveSection('getting-started');
				break;
			case 'changelog':
				setActiveSection('changelog');
				break;
		}
		handleClearSearch();
	}

	// Use handleResultPress in search results (currently just viewing results)
	void handleResultPress;

	function renderContent() {
		// Show search results if searching
		if (searchQuery.length >= 2) {
			if (searchResults.length === 0) {
				return (
					<View className="py-8 items-center">
						<Text className="text-gray-500 dark:text-gray-400">
							{translations.search.noResults.replace('{query}', searchQuery)}
						</Text>
					</View>
				);
			}

			return (
				<View>
					<Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
						{translations.search.resultsCount.replace('{count}', String(searchResults.length))}
					</Text>
					{searchResults.map((result) => (
						<View
							key={result.id}
							className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-2 border border-gray-200 dark:border-gray-700"
						>
							<Text className="font-medium text-gray-900 dark:text-gray-100">{result.title}</Text>
							<Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
								{result.excerpt}
							</Text>
						</View>
					))}
				</View>
			);
		}

		// Show section content
		switch (activeSection) {
			case 'faq':
				return <FAQList items={content.faq} translations={translations} />;
			case 'features':
				return <FeaturesList items={content.features} translations={translations} />;
			case 'contact':
				return <ContactCard contact={content.contact} translations={translations} />;
			case 'shortcuts':
				return (
					<View className="py-8 items-center">
						<Text className="text-gray-500 dark:text-gray-400">
							{translations.shortcuts.noItems}
						</Text>
					</View>
				);
			case 'getting-started':
				return (
					<View className="py-8 items-center">
						<Text className="text-gray-500 dark:text-gray-400">
							{translations.gettingStarted.noItems}
						</Text>
					</View>
				);
			case 'changelog':
				return (
					<View className="py-8 items-center">
						<Text className="text-gray-500 dark:text-gray-400">
							{translations.changelog.noItems}
						</Text>
					</View>
				);
			default:
				return null;
		}
	}

	return (
		<SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
			<ScrollView className="flex-1 px-4 pt-4">
				{/* Header */}
				<View className="mb-6">
					<Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
						{translations.title}
					</Text>
					{translations.subtitle && (
						<Text className="text-gray-600 dark:text-gray-400 mt-1">
							{translations.subtitle} - {appName}
						</Text>
					)}
				</View>

				{/* Search */}
				<HelpSearchBar
					placeholder={translations.searchPlaceholder}
					onSearch={handleSearch}
					onClear={handleClearSearch}
				/>

				{/* Category Tabs */}
				{searchQuery.length < 2 && (
					<CategoryTabs
						sections={sections}
						activeSection={activeSection}
						onSectionChange={setActiveSection}
					/>
				)}

				{/* Content */}
				<View className="pb-8">{renderContent()}</View>
			</ScrollView>
		</SafeAreaView>
	);
}
