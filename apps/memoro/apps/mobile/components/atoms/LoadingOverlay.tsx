import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import Text from './Text';
import { SpinnerAnimation } from '../molecules/SpinnerAnimation';

interface LoadingOverlayProps {
	/**
	 * Ob das Loading-Overlay sichtbar ist
	 */
	visible: boolean;

	/**
	 * Nachricht die angezeigt werden soll
	 */
	message?: string;

	/**
	 * Ob ein Modal verwendet werden soll (blockiert komplette App)
	 * Standard: false (nur als Overlay über aktueller View)
	 */
	modal?: boolean;

	/**
	 * Größe des ActivityIndicator
	 */
	size?: 'small' | 'large';

	/**
	 * Ob das Overlay abgebrochen werden kann (nur bei modal: true)
	 */
	cancelable?: boolean;

	/**
	 * Callback wenn das Overlay abgebrochen wird
	 */
	onCancel?: () => void;
}

/**
 * Wiederverwendbare Loading-Overlay-Komponente
 *
 * Kann als Overlay über einer View oder als vollständiges Modal verwendet werden.
 * Unterstützt verschiedene Größen, Nachrichten und Theme-angepasste Farben.
 *
 * @example
 * // Als Overlay über einer View
 * <View style={{ flex: 1 }}>
 *   <YourContent />
 *   <LoadingOverlay
 *     visible={isLoading}
 *     message="Übersetzung wird erstellt..."
 *   />
 * </View>
 *
 * @example
 * // Als blockierendes Modal
 * <LoadingOverlay
 *   visible={isProcessing}
 *   message="Verarbeitung läuft..."
 *   modal={true}
 *   cancelable={true}
 *   onCancel={() => setCanceled(true)}
 * />
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
	visible,
	message,
	modal = false,
	size = 'large',
	cancelable = false,
	onCancel,
}) => {
	const { isDark } = useTheme();
	const { t } = useTranslation();

	// Standard-Nachricht falls keine angegeben
	const displayMessage = message || t('common.loading', 'Wird geladen...');

	// Dynamische Styles basierend auf Theme
	const styles = StyleSheet.create({
		overlay: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: 'transparent',
			justifyContent: 'center',
			alignItems: 'center',
			zIndex: 9999,
		},
		modalOverlay: {
			flex: 1,
			backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
			justifyContent: 'center',
			alignItems: 'center',
		},
		content: {
			backgroundColor: isDark ? '#2C2C2C' : '#FFFFFF',
			borderRadius: 16,
			padding: 24,
			paddingHorizontal: 32,
			alignItems: 'center',
			minWidth: 200,
			marginHorizontal: 16,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.25,
			shadowRadius: 3.84,
			elevation: 5,
		},
		message: {
			marginTop: 16,
			textAlign: 'center',
			fontSize: 16,
			color: isDark ? '#FFFFFF' : '#000000',
		},
		cancelButton: {
			marginTop: 16,
			paddingVertical: 8,
			paddingHorizontal: 16,
			borderRadius: 8,
			backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
		},
		cancelText: {
			color: isDark ? '#FFFFFF' : '#000000',
			fontSize: 14,
		},
	});

	// Spinner Animation mit Theme-Farbe
	const spinnerSize = size === 'large' ? 60 : 40;

	// Content-Bereich
	const content = (
		<View style={styles.content}>
			<SpinnerAnimation size={spinnerSize} />
			<Text style={styles.message}>{displayMessage}</Text>
			{cancelable && onCancel && (
				<View style={styles.cancelButton} onTouchEnd={onCancel}>
					<Text style={styles.cancelText}>{t('common.cancel', 'Abbrechen')}</Text>
				</View>
			)}
		</View>
	);

	// Nicht sichtbar
	if (!visible) {
		return null;
	}

	// Als Modal rendern
	if (modal) {
		return (
			<Modal
				transparent={true}
				visible={visible}
				onRequestClose={cancelable ? onCancel : undefined}
				animationType="fade"
			>
				<View style={styles.modalOverlay}>{content}</View>
			</Modal>
		);
	}

	// Als Overlay rendern
	return <View style={styles.overlay}>{content}</View>;
};

export default LoadingOverlay;
