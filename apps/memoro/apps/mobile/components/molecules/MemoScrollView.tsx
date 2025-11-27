import React, { forwardRef, useEffect, useRef } from 'react';
import { ScrollView, ScrollViewProps, Text } from 'react-native';

/**
 * Wrapper around ScrollView with forwardRef to ensure ref works properly
 */
const MemoScrollView = forwardRef<ScrollView, ScrollViewProps>((props, ref) => {
	const internalRef = useRef<ScrollView>(null);

	console.log('MemoScrollView rendering');
	console.log('MemoScrollView props:', Object.keys(props));

	// Try syncing in useEffect
	useEffect(() => {
		console.log('MemoScrollView useEffect - internalRef.current:', internalRef.current);

		if (internalRef.current) {
			console.log('Setting forwarded ref from useEffect');
			if (typeof ref === 'function') {
				ref(internalRef.current);
			} else if (ref) {
				(ref as any).current = internalRef.current;
			}
		}
	}, [internalRef.current]);

	console.log('About to render ScrollView...');

	return (
		<>
			<Text style={{ color: 'red', fontSize: 20 }}>DEBUG: ScrollView is rendering</Text>
			<ScrollView
				ref={(scrollViewRef) => {
					console.log('=== MemoScrollView ref callback fired ===');
					console.log('ref value:', scrollViewRef);
					console.log('ref is null:', scrollViewRef === null);

					// Set both refs
					internalRef.current = scrollViewRef;

					// Set the forwarded ref
					if (scrollViewRef) {
						if (typeof ref === 'function') {
							ref(scrollViewRef);
						} else if (ref) {
							(ref as any).current = scrollViewRef;
						}
						console.log('Forwarded ref set successfully!');
					}
				}}
				{...props}
			/>
		</>
	);
});

MemoScrollView.displayName = 'MemoScrollView';

export default MemoScrollView;
