import { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SearchBarProps = {
	placeholder?: string;
	onSearch: (query: string) => void;
	initialValue?: string;
};

export const SearchBar = ({
	placeholder = 'Suchen...',
	onSearch,
	initialValue = '',
}: SearchBarProps) => {
	const [query, setQuery] = useState(initialValue);

	const handleClear = () => {
		setQuery('');
		onSearch('');
	};

	const handleSubmit = () => {
		onSearch(query);
	};

	return (
		<View className="flex-row items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 mb-4">
			<Ionicons name="search" size={20} color="#9CA3AF" />
			<TextInput
				className="flex-1 ml-2 text-gray-900 dark:text-white"
				placeholder={placeholder}
				placeholderTextColor="#9CA3AF"
				value={query}
				onChangeText={setQuery}
				onSubmitEditing={handleSubmit}
				returnKeyType="search"
			/>
			{query.length > 0 && (
				<TouchableOpacity onPress={handleClear}>
					<Ionicons name="close-circle" size={20} color="#9CA3AF" />
				</TouchableOpacity>
			)}
		</View>
	);
};
