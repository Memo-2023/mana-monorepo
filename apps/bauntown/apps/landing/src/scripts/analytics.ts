// Umami Analytics Custom Events Helper
declare global {
	interface Window {
		umami?: {
			track: (eventName: string, eventData?: Record<string, any>) => void;
		};
	}
}

// Helper function to track events
export function trackEvent(eventName: string, eventData?: Record<string, any>) {
	if (typeof window !== 'undefined' && window.umami) {
		window.umami.track(eventName, eventData);
	}
}

// Predefined event types for consistency
export const EVENTS = {
	// Navigation
	NAV_CLICK: 'nav-click',
	FOOTER_CLICK: 'footer-click',
	LANGUAGE_SWITCH: 'language-switch',
	THEME_TOGGLE: 'theme-toggle',

	// Content Views
	TUTORIAL_VIEW: 'tutorial-view',
	PROJECT_VIEW: 'project-view',
	TOOL_VIEW: 'tool-view',
	MODEL_VIEW: 'model-view',
	MISSION_VIEW: 'mission-view',

	// User Actions
	JOIN_CLICK: 'join-click',
	SUPPORT_CLICK: 'support-click',
	MEMBER_VIEW: 'member-view',

	// Payment/Donation
	COFFEE_SELECT: 'coffee-select',
	PAYMENT_TYPE_CHANGE: 'payment-type-change',
	CHECKOUT_START: 'checkout-start',
	CHECKOUT_SUCCESS: 'checkout-success',
	CHECKOUT_CANCEL: 'checkout-cancel',

	// External Links
	DISCORD_CLICK: 'discord-click',
	GITHUB_CLICK: 'github-click',
	EXTERNAL_LINK: 'external-link',

	// Content Interactions
	VIDEO_PLAY: 'video-play',
	FIGMA_EMBED_VIEW: 'figma-embed-view',
	CODE_COPY: 'code-copy',

	// Search & Filter
	SEARCH: 'search',
	FILTER_CHANGE: 'filter-change',

	// Scroll Depth
	SCROLL_25: 'scroll-25',
	SCROLL_50: 'scroll-50',
	SCROLL_75: 'scroll-75',
	SCROLL_100: 'scroll-100',
} as const;

// Initialize scroll tracking
export function initScrollTracking() {
	if (typeof window === 'undefined') return;

	const scrollDepths = [25, 50, 75, 100];
	const trackedDepths = new Set<number>();

	const checkScrollDepth = () => {
		const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
		const scrolled = window.scrollY;
		const scrollPercentage = (scrolled / scrollHeight) * 100;

		scrollDepths.forEach((depth) => {
			if (scrollPercentage >= depth && !trackedDepths.has(depth)) {
				trackedDepths.add(depth);
				trackEvent(`scroll-${depth}`, { depth });
			}
		});
	};

	// Debounce scroll events
	let scrollTimer: NodeJS.Timeout;
	window.addEventListener('scroll', () => {
		clearTimeout(scrollTimer);
		scrollTimer = setTimeout(checkScrollDepth, 100);
	});
}

// Auto-track external links
export function initExternalLinkTracking() {
	if (typeof window === 'undefined') return;

	document.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const link = target.closest('a');

		if (link && link.href) {
			const url = new URL(link.href);
			const currentHost = window.location.hostname;

			// Track external links
			if (url.hostname !== currentHost && !url.hostname.includes('localhost')) {
				// Special cases for known platforms
				if (url.hostname.includes('discord')) {
					trackEvent(EVENTS.DISCORD_CLICK, { url: url.href });
				} else if (url.hostname.includes('github')) {
					trackEvent(EVENTS.GITHUB_CLICK, { url: url.href });
				} else {
					trackEvent(EVENTS.EXTERNAL_LINK, {
						domain: url.hostname,
						url: url.href,
					});
				}
			}
		}
	});
}

// Initialize all tracking on page load
export function initAnalytics() {
	if (typeof window === 'undefined') return;

	// Wait for Umami to be loaded
	const checkUmami = setInterval(() => {
		if (window.umami) {
			clearInterval(checkUmami);
			initScrollTracking();
			initExternalLinkTracking();
		}
	}, 100);

	// Stop checking after 5 seconds
	setTimeout(() => clearInterval(checkUmami), 5000);
}
