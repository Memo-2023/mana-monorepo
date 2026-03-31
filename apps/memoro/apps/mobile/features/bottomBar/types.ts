import type React from 'react';

export interface BottomBarConfig {
	id: string;
	priority: number;
	content: React.ReactNode;
	collapsedIcon: string;
	collapsible?: boolean;
	visible?: boolean;
	keyboardBehavior?: 'dodge' | 'hide' | 'stay';
}
