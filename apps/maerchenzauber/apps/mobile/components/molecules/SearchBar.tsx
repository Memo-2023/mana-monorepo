import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Icon from '../atoms/Icon';

interface SearchBarProps {
	value: string;
	onChangeText: (text: string) => void;
	onClose: () => void;
	visible: boolean;
}

export default function SearchBar({ value, onChangeText, onClose, visible }: SearchBarProps) {
	if (!visible) return null;

	return (
		<View style={styles.container}>
			<View style={styles.searchContainer}>
				<Icon set="ionicons" name="search" size={20} color="#999999" style={styles.searchIcon} />
				<TextInput
					value={value}
					onChangeText={onChangeText}
					placeholder="Suche nach Geschichten..."
					placeholderTextColor="#999999"
					style={styles.input}
					autoFocus={true}
				/>
				<TouchableOpacity onPress={onClose} style={styles.closeButton}>
					<Icon set="ionicons" name="close-circle" size={20} color="#999999" />
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#181818',
		height: 50,
		justifyContent: 'center',
		paddingHorizontal: 16,
		marginBottom: 16,
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#2C2C2C',
		borderRadius: 8,
		paddingHorizontal: 12,
		height: 40,
	},
	searchIcon: {
		marginRight: 8,
	},
	input: {
		flex: 1,
		color: '#FFFFFF',
		fontSize: 16,
		padding: 0,
		height: '100%',
	},
	closeButton: {
		padding: 4,
		marginLeft: 8,
	},
});
