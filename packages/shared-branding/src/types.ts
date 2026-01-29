/**
 * App identifiers for branding
 */
export type AppId =
	| 'memoro'
	| 'manacore'
	| 'manadeck'
	| 'uload'
	| 'chat'
	| 'presi'
	| 'nutriphi'
	| 'zitare'
	| 'picture'
	| 'contacts'
	| 'calendar'
	| 'storage'
	| 'clock'
	| 'todo'
	| 'mail'
	| 'moodlit'
	| 'inventory'
	| 'questions';

/**
 * App branding configuration
 */
export interface AppBranding {
	/** Unique app identifier */
	id: AppId;
	/** Display name */
	name: string;
	/** Short description/tagline */
	tagline: string;
	/** Primary brand color (hex) */
	primaryColor: string;
	/** Secondary brand color (hex) */
	secondaryColor?: string;
	/** SVG path data for the logo icon */
	logoPath: string;
	/** Logo viewBox (default: "0 0 24 24") */
	logoViewBox?: string;
	/** Whether the logo uses stroke instead of fill */
	logoStroke?: boolean;
	/** Logo stroke width (if logoStroke is true) */
	logoStrokeWidth?: number;
}

/**
 * Logo component props
 */
export interface LogoProps {
	/** Size in pixels */
	size?: number;
	/** Override color (uses app primary color if not provided) */
	color?: string;
	/** Additional CSS classes */
	class?: string;
}

/**
 * App logo with name props
 */
export interface AppLogoWithNameProps extends LogoProps {
	/** Show app name next to logo */
	showName?: boolean;
	/** Font size for name (CSS value) */
	nameFontSize?: string;
	/** Gap between logo and name */
	gap?: string;
}
