// Atoms
export { Text, Button, Badge, Card } from './atoms';

// Molecules
export { Toggle, Input, Select, Textarea, Checkbox } from './molecules';
export type { SelectOption } from './molecules';

// Stats
export { GlassCard, StatRow } from './molecules';

// Tags
export {
	TagBadge,
	TagColorPicker,
	TagEditModal,
	TagSelector,
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
} from './molecules';

// Feedback
export { EmptyState } from './molecules';

// Contacts
export { ContactAvatar, ContactBadge, ContactSelector } from './molecules';

// Layout
export { ModalFooter, DataCard, PageHeader, KeyboardShortcutsPanel } from './molecules';

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
	PillTabGroup,
	PillTimeRangeSelector,
	PillViewSwitcher,
	PillToolbar,
	PillToolbarButton,
	PillToolbarDivider,
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
export { InputBar, QuickInputBar } from './quick-input';
export type { QuickInputItem, QuickAction, CreatePreview } from './quick-input';

// Pages
export { default as AppsPage } from './pages/AppsPage.svelte';

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
