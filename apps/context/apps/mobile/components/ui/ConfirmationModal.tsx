import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '~/utils/theme/theme';
import { ThemedButton } from './ThemedButton';

interface ConfirmationModalProps {
	visible: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
	confirmVariant?: 'primary' | 'secondary' | 'danger';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
	visible,
	title,
	message,
	confirmText = 'Bestätigen',
	cancelText = 'Abbrechen',
	onConfirm,
	onCancel,
	confirmVariant = 'primary',
}) => {
	const { isDark } = useTheme();

	return (
		<Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onCancel}>
			<Pressable style={styles.overlay} onPress={onCancel}>
				<View
					style={[styles.modalContainer, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
					// Prevent closing when clicking inside the modal
					onStartShouldSetResponder={() => true}
					onTouchEnd={(e) => e.stopPropagation()}
				>
					<Text style={[styles.title, { color: isDark ? '#f9fafb' : '#111827' }]}>{title}</Text>

					<Text style={[styles.message, { color: isDark ? '#e5e7eb' : '#4b5563' }]}>{message}</Text>

					<View style={styles.buttonContainer}>
						<ThemedButton
							title={cancelText}
							onPress={onCancel}
							variant="secondary"
							style={{ marginRight: 8, flex: 1 }}
						/>

						<ThemedButton
							title={confirmText}
							onPress={onConfirm}
							variant={confirmVariant}
							style={{ flex: 1 }}
						/>
					</View>
				</View>
			</Pressable>
		</Modal>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	modalContainer: {
		width: '100%',
		maxWidth: 400,
		borderRadius: 8,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	message: {
		fontSize: 14,
		marginBottom: 16,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
});
