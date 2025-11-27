/**
 * UI-related types
 */

/**
 * Common size variants
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';

/**
 * Text variants
 */
export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'muted' | 'code';

/**
 * Font weight
 */
export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold';

/**
 * Badge variants
 */
export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';

/**
 * Input types
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

/**
 * Toast/notification types
 */
export type ToastType = 'info' | 'success' | 'warning' | 'error';

/**
 * Toast notification
 */
export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	title?: string;
	duration?: number;
	dismissible?: boolean;
}

/**
 * Modal configuration
 */
export interface ModalConfig {
	title?: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	dangerous?: boolean;
}

/**
 * Dropdown/Select option
 */
export interface SelectOption<T = string> {
	value: T;
	label: string;
	disabled?: boolean;
	icon?: string;
}

/**
 * Tab item
 */
export interface TabItem {
	id: string;
	label: string;
	icon?: string;
	disabled?: boolean;
	badge?: string | number;
}

/**
 * Menu item
 */
export interface MenuItem {
	id: string;
	label: string;
	icon?: string;
	href?: string;
	onClick?: () => void;
	disabled?: boolean;
	danger?: boolean;
	divider?: boolean;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
	label: string;
	href?: string;
}

/**
 * Loading state
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
