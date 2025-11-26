/**
 * Interface for Alert button properties
 */
export interface AlertButtonProps {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Interface for the Alert service to ensure consistent implementation
 * across all platform-specific services
 */
export interface IAlertService {
  /**
   * Displays an alert dialog with the specified title, message, and buttons
   * 
   * @param title The title of the alert
   * @param message The message to display in the alert
   * @param buttons Array of buttons to display in the alert
   * @returns A function to dismiss the alert (web only)
   */
  alert(
    title: string,
    message?: string,
    buttons?: AlertButtonProps[],
  ): void | (() => void);
}
