import { StyleSheet } from 'react-native';
import { useDebug } from '../src/contexts/DebugContext';

interface DebugBorderOptions {
	backgroundColor?: string;
	borderStyle?: 'solid' | 'dotted' | 'dashed';
	borderWidth?: number;
}

export function useDebugBorders(color: string = '#FF0000', options: DebugBorderOptions = {}) {
	const { debugBordersEnabled } = useDebug();

	return debugBordersEnabled
		? StyleSheet.create({
				debug: {
					borderWidth: options.borderWidth || 2,
					borderColor: color,
					borderStyle: options.borderStyle || 'dashed',
					backgroundColor: options.backgroundColor,
				},
			}).debug
		: {};
}
