// Atoms
export { Text, Button, Badge, Card } from './atoms';

// Molecules
export {
	Toggle,
	Input,
	Select,
	Textarea,
	Checkbox,
	FilterDropdown,
	FavoriteButton,
	ColorPicker,
	COLORS_12,
	COLORS_16,
	DEFAULT_COLOR,
	getRandomColor,
	ReminderPicker,
} from './molecules';
export type { SelectOption, FilterDropdownOption } from './molecules';

// Stats
export { GlassCard, StatRow } from './molecules';

// Tags
export {
	TagBadge,
	TagChip,
	TagColorPicker,
	TagEditModal,
	TagSelector,
	TagField,
	TagList,
	TAG_COLORS,
	DEFAULT_TAG_COLOR,
	getRandomTagColor,
	getTagColorByName,
} from './molecules';
export type { Tag, TagData, TagColorName, TagColorHex } from './molecules';

// Media
export { AudioPlayer } from './molecules';

// Loading/Skeletons
export {
	SkeletonBox,
	SkeletonText,
	SkeletonAvatar,
	SkeletonRow,
	SkeletonList,
	SkeletonCard,
	SkeletonGrid,
	AppLoadingSkeleton,
	calculateFadeOpacity,
} from './molecules';

// Feedback
export { EmptyState } from './molecules';

// Contacts
export { ContactAvatar, ContactBadge, ContactSelector } from './molecules';

// Layout
export { ModalFooter, DataCard, PageHeader, KeyboardShortcutsPanel } from './molecules';

// Confirmation (inline popover)
export { ConfirmationPopover } from './molecules';

// Organisms
export { Modal, ConfirmationModal, FormModal, AppSlider } from './organisms';
export type { AppItem } from './organisms';

// Network Graph
export {
	NetworkGraph,
	NetworkControls,
	stringToColor,
	getInitials,
	SIMULATION_CONFIG,
	NODE_CONFIG,
	LABEL_CONFIG,
} from './organisms';
export type {
	NetworkNode,
	NetworkLink,
	NetworkTag,
	NetworkTransform,
	NetworkGraphProps,
	NetworkControlsProps,
	NetworkGraphResponse,
	SimulationNode,
	SimulationLink,
} from './organisms';

// Navigation
export {
	NavLink,
	Navbar,
	Sidebar,
	SidebarSection,
	PillNavigation,
	PillDropdown,
	AppDrawer,
	GlobalSpotlight,
	createGlobalSpotlightState,
	PillTabGroup,
	PillTagSelector,
	PillTimeRangeSelector,
	PillViewSwitcher,
	PillToolbar,
	PillToolbarButton,
	PillToolbarDivider,
	TagStrip,
	ExpandableToolbar,
	createAppNavigationStore,
	getFavoriteApps,
	getRecentApps,
	getUsageCounts,
	toggleFavoriteApp,
	recordAppVisit,
	clearRecentApps,
} from './navigation';
export type {
	NavItem,
	NavbarProps,
	SidebarProps,
	NavLinkProps,
	KeyboardShortcut,
	PillNavItem,
	PillDropdownItem,
	PillNavElement,
	PillNavigationProps,
	PillTabOption,
	PillTabGroupConfig,
	PillTagItem,
	PillTagSelectorConfig,
	ExpandableToolbarProps,
	RecentAppEntry,
	SpotlightAction,
	ContentSearcher,
	ContentSearchResult,
	ContentSearchGroup,
} from './navigation';

// Settings
export {
	SettingsPage,
	SettingsSection,
	SettingsCard,
	SettingsRow,
	SettingsToggle,
	SettingsSelect,
	SettingsNumberInput,
	SettingsTimeInput,
	SettingsDangerZone,
	SettingsDangerButton,
	GlobalSettingsSection,
} from './settings';

// Command Bar (deprecated - use QuickInputBar)
export { CommandBar } from './command-bar';
export type { CommandBarItem } from './command-bar';

// Input Bar
export {
	InputBar,
	QuickInputBar,
	InputBarContextMenu,
	InputBarHelpModal,
	// Recent history
	getRecentTags,
	getRecentReferences,
	addRecentTag,
	addRecentReference,
	extractAndSaveFromInput,
	clearRecentHistory,
	createRecentInputHistoryStore,
	// Settings
	loadInputBarSettings,
	saveInputBarSettings,
	updateInputBarSetting,
	resetInputBarSettings,
	createInputBarSettingsStore,
	getInputBarSettingsStore,
} from './quick-input';
export type { QuickInputItem, QuickAction, CreatePreview, InputBarSettings } from './quick-input';

// Pages
export { default as AppsPage } from './pages/AppsPage.svelte';
export { default as OfflinePage } from './pages/OfflinePage.svelte';

// Charts - Statistics Visualization
export {
	StatsGrid,
	ActivityHeatmap,
	TrendLineChart,
	DonutChart,
	ProgressBars,
	StatisticsSkeleton,
	STAT_VARIANT_COLORS,
} from './charts';
export type {
	StatVariant,
	StatItem,
	HeatmapDataPoint,
	TrendDataPoint,
	DonutSegment,
	ProgressItem,
} from './charts';

// Context Menu
export { ContextMenu, createContextMenuState } from './context-menu';
export type { ContextMenuItem, ContextMenuState } from './context-menu';

// Help Components
export {
	HelpModal,
	KeyboardShortcutsPanel as HelpKeyboardShortcutsPanel,
	SyntaxHelpPanel,
	COMMON_SHORTCUTS,
	COMMON_SYNTAX,
	DEFAULT_LIVE_EXAMPLE,
} from './help';
export type {
	KeyboardShortcut as HelpKeyboardShortcut,
	ShortcutCategory,
	SyntaxColor,
	SyntaxExample,
	SyntaxPattern,
	SyntaxGroup,
	HelpModalConfig,
} from './help';

// Immersive Mode
export { default as ImmersiveModeToggle } from './components/ImmersiveModeToggle.svelte';
export { default as DevBuildBadge } from './components/DevBuildBadge.svelte';
export { default as SyncIndicator } from './components/SyncIndicator.svelte';

// Toast & Global Error Handling
export {
	toastStore,
	toast,
	handleApiError,
	ToastContainer,
	setupGlobalErrorHandler,
	GLOBAL_ERROR_TRANSLATIONS,
} from './toast';
export type {
	Toast,
	ToastType,
	GlobalErrorHandlerOptions,
	GlobalErrorHandlerTranslations,
} from './toast';

// Bottom Stack
export { BottomStack, MinimizedTabs, NotificationBar } from './bottom-stack';
export type { MinimizedPage, MinimizedTabsCallbacks, BottomNotification } from './bottom-stack';

// Actions
export { focusTrap } from './actions';

// Drag & Drop
export {
	dragSource,
	dropTarget,
	passiveDropZone,
	dragState,
	registerSvelteActionDrag,
	clearSvelteActionDrag,
	isTypeBeingDragged,
	DragPreview,
	ActionZone,
} from './dnd';
export type {
	DragType,
	DragPayload,
	TagDragData,
	TaskDragData,
	DragSourceOptions,
	DropTargetOptions,
	PassiveDropZoneOptions,
	ActionZoneProps,
} from './dnd';
