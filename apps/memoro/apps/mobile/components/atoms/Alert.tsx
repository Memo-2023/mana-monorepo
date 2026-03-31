import { Alert as RNAlert } from 'react-native';
import { AlertButtonProps, IAlertService } from './alert.types';

/**
 * Alert component that wraps React Native's Alert API
 * This is the base implementation used by native platforms
 *
 * Provides a cross-platform alert dialog interface
 *
 * Example:
 * ```tsx
 * Alert.alert(
 *   'Title',
 *   'Message',
 *   [
 *     { text: 'Cancel', style: 'cancel' },
 *     { text: 'OK', onPress: () => console.log('OK Pressed') }
 *   ]
 * );
 * ```
 */
class AlertService implements IAlertService {
	/**
	 * Displays an alert dialog with the specified title, message, and buttons
	 *
	 * @param title The title of the alert
	 * @param message The message to display in the alert
	 * @param buttons Array of buttons to display in the alert
	 */
	alert(title: string, message?: string, buttons?: AlertButtonProps[]): void {
		RNAlert.alert(title, message, buttons);
	}
}

// Create and export singleton instance
const alertService = new AlertService();
export default alertService;
