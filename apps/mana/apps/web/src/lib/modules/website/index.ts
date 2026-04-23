export { sitesStore, InvalidSlugError, DuplicateSlugError } from './stores/sites.svelte';
export {
	pagesStore,
	InvalidPathError,
	DuplicatePathError,
	isValidPath,
} from './stores/pages.svelte';
export { blocksStore, InvalidBlockPropsError } from './stores/blocks.svelte';

export {
	useAllSites,
	useAllPages,
	useAllBlocks,
	findSite,
	findPage,
	pagesForSite,
	blocksForPage,
	toWebsite,
	toWebsitePage,
	toWebsiteBlock,
	buildBlockTree,
} from './queries';

export { websitesTable, websitePagesTable, websiteBlocksTable } from './collections';

export {
	RESERVED_SLUGS,
	SLUG_REGEX,
	isReservedSlug,
	isValidSlug,
	DEFAULT_THEME,
	DEFAULT_NAV,
	DEFAULT_FOOTER,
	DEFAULT_SETTINGS,
	DEFAULT_HOME_PAGE,
} from './constants';

export type {
	LocalWebsite,
	LocalWebsitePage,
	LocalWebsiteBlock,
	Website,
	WebsitePage,
	WebsiteBlock,
	ThemeConfig,
	ThemePreset,
	NavConfig,
	NavItem,
	FooterConfig,
	FooterLink,
	SiteSettings,
	PageSeo,
} from './types';
