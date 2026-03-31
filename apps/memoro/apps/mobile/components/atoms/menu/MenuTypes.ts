export interface MenuItem {
	key: string;
	title?: string;
	iconName?: string;
	destructive?: boolean;
	onSelect?: () => void;
	separator?: boolean;
}
