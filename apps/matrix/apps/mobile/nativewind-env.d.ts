/// <reference types="nativewind/types" />

import 'react-native';

declare module 'react-native' {
	interface PressableProps {
		className?: string | ((state: { pressed: boolean }) => string);
		cssInterop?: boolean;
	}
}
