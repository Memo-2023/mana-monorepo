import React from 'react';
import {
	Modal as RNModal,
	View,
	StyleSheet,
	TouchableOpacity,
	ModalProps as RNModalProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Text from './Text';
import Button from './Button';

export interface ModalProps {
	visible: boolean;
	onClose: () => void;
	title?: string;
	children?: React.ReactNode;
	buttons?: Array<{
		title: string;
		onPress: () => void;
		variant?: 'primary' | 'secondary' | 'tonal' | 'plain' | 'danger';
		color?: string;
		iconName?: any;
		iconPosition?: 'left' | 'right' | 'none';
	}>;
	maxWidth?: number;
	useBlur?: boolean;
	blurIntensity?: number;
	dismissOnBackgroundPress?: boolean;
}

const Modal: React.FC<ModalProps> = ({
	visible,
	onClose,
	title,
	children,
	buttons,
	maxWidth = 360,
	useBlur = true,
	blurIntensity = 80,
	dismissOnBackgroundPress = true,
}) => {
	return (
		<RNModal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
			<TouchableOpacity
				style={styles.modalOverlay}
				activeOpacity={1}
				onPress={dismissOnBackgroundPress ? onClose : undefined}
			>
				<TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
					{useBlur ? (
						<BlurView
							intensity={blurIntensity}
							tint="dark"
							style={[styles.modalBlur, { maxWidth }]}
						>
							<View style={styles.modalContent}>
								{title && (
									<Text variant="header" color="#fff" style={styles.modalTitle}>
										{title}
									</Text>
								)}
								{children && <View style={styles.modalBody}>{children}</View>}
								{buttons && buttons.length > 0 && (
									<View style={styles.modalButtons}>
										{buttons.map((button, index) => (
											<Button
												key={index}
												title={button.title}
												onPress={button.onPress}
												variant={button.variant || 'primary'}
												size="md"
												color={button.color}
												style={styles.modalButton}
												textStyle={styles.modalButtonText}
												iconName={button.iconName}
												iconPosition={button.iconPosition}
											/>
										))}
									</View>
								)}
							</View>
						</BlurView>
					) : (
						<View style={[styles.modalBlur, styles.modalBlurSolid, { maxWidth }]}>
							<View style={styles.modalContent}>
								{title && (
									<Text variant="header" color="#fff" style={styles.modalTitle}>
										{title}
									</Text>
								)}
								{children && <View style={styles.modalBody}>{children}</View>}
								{buttons && buttons.length > 0 && (
									<View style={styles.modalButtons}>
										{buttons.map((button, index) => (
											<Button
												key={index}
												title={button.title}
												onPress={button.onPress}
												variant={button.variant || 'primary'}
												size="md"
												color={button.color}
												style={styles.modalButton}
												textStyle={styles.modalButtonText}
												iconName={button.iconName}
												iconPosition={button.iconPosition}
											/>
										))}
									</View>
								)}
							</View>
						</View>
					)}
				</TouchableOpacity>
			</TouchableOpacity>
		</RNModal>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	modalBlur: {
		borderRadius: 16,
		overflow: 'hidden',
		width: '100%',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
	modalBlurSolid: {
		backgroundColor: '#1a1a1a',
	},
	modalContent: {
		padding: 24,
		alignItems: 'flex-start',
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		textAlign: 'center',
		width: '100%',
	},
	modalBody: {
		width: '100%',
		marginBottom: 24,
	},
	modalButtons: {
		flexDirection: 'column',
		gap: 15,
		width: '100%',
	},
	modalButton: {
		width: '100%',
		paddingHorizontal: 8,
		paddingVertical: 14,
		minHeight: 44,
	},
	modalButtonText: {
		fontSize: 15,
		flexShrink: 1,
	},
});

export default Modal;
