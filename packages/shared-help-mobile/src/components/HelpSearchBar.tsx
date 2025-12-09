/**
 * Search Bar component for mobile Help screen
 */

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import type { HelpSearchBarProps } from '../types';

export function HelpSearchBar({ placeholder, onSearch, onClear }: HelpSearchBarProps) {
	const [query, setQuery] = useState('');

	function handleChangeText(text: string) {
		setQuery(text);
		onSearch(text);
	}

	function handleClear() {
		setQuery('');
		onClear();
	}

	return (
		<View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 mb-4">
			<Text className="text-gray-400 mr-2">🔍</Text>
			<TextInput
				className="flex-1 text-gray-900 dark:text-gray-100 text-base"
				placeholder={placeholder}
				placeholderTextColor="#9CA3AF"
				value={query}
				onChangeText={handleChangeText}
				autoCapitalize="none"
				autoCorrect={false}
				clearButtonMode="while-editing"
			/>
			{query.length > 0 && (
				<TouchableOpacity onPress={handleClear} className="ml-2">
					<Text className="text-gray-400">✕</Text>
				</TouchableOpacity>
			)}
		</View>
	);
}
