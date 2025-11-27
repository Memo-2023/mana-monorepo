import React, { useState } from 'react';
import { Modal, View, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';

interface CreateSpaceModalProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (name: string) => void;
}

export function CreateSpaceModal({ visible, onClose, onSubmit }: CreateSpaceModalProps) {
	const { isDark } = useTheme();
	const [name, setName] = useState('');

	const handleSubmit = () => {
		if (name.trim()) {
			onSubmit(name);
			setName(''); // Reset the input
		}
	};

	return (
		<Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
			<View style={styles.centeredView}>
				<View style={[styles.modalView, { backgroundColor: isDark ? '#303030' : '#FFFFFF' }]}>
					<Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
						Create New Space
					</Text>

					<TextInput
						style={[
							styles.input,
							{
								backgroundColor: isDark ? '#505050' : '#F5F5F5',
								color: isDark ? '#FFFFFF' : '#000000',
								borderColor: isDark ? '#505050' : '#E0E0E0',
							},
						]}
						placeholder="Enter space name"
						placeholderTextColor={isDark ? '#A0A0A0' : '#808080'}
						value={name}
						onChangeText={setName}
						autoFocus={true}
					/>

					<View style={styles.buttonContainer}>
						<Button title="Cancel" onPress={onClose} style={styles.cancelButton} />
						<Button
							title="Create"
							onPress={handleSubmit}
							style={styles.createButton}
							disabled={!name.trim()}
						/>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalView: {
		width: '80%',
		borderRadius: 12,
		padding: 20,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	input: {
		width: '100%',
		padding: 12,
		borderWidth: 1,
		borderRadius: 8,
		marginBottom: 20,
	},
	buttonContainer: {
		flexDirection: 'row',
		width: '100%',
		justifyContent: 'space-between',
	},
	cancelButton: {
		flex: 1,
		marginRight: 10,
	},
	createButton: {
		flex: 1,
		marginLeft: 10,
	},
});

export default CreateSpaceModal;
