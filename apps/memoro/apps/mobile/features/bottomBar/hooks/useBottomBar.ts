import { useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useBottomBarStore } from '../store/bottomBarStore';
import type { BottomBarConfig } from '../types';

/**
 * Hook to register/unregister a bottom bar.
 * Pass null to skip registration (for conditional bars).
 * Uses useFocusEffect to handle page navigation.
 *
 * IMPORTANT: Never calls store.set() during render to prevent loops.
 */
export function useBottomBar(config: BottomBarConfig | null) {
	const configRef = useRef(config);
	configRef.current = config;
	const prevIdRef = useRef<string | null>(null);

	// Register on focus, unregister on blur
	useFocusEffect(
		useCallback(() => {
			const current = configRef.current;
			if (current) {
				useBottomBarStore.getState().registerBar(current);
				prevIdRef.current = current.id;
			}

			return () => {
				if (prevIdRef.current) {
					useBottomBarStore.getState().unregisterBar(prevIdRef.current);
					prevIdRef.current = null;
				}
			};
		}, [])
	);

	// Handle metadata/visibility changes via effect (safe to call set() here)
	const configId = config?.id ?? null;
	const configPriority = config?.priority;
	const configIcon = config?.collapsedIcon;
	const configCollapsible = config?.collapsible;
	const configVisible = config?.visible;
	const configKeyboard = config?.keyboardBehavior;

	useEffect(() => {
		// Unregister previous if id changed
		if (prevIdRef.current && prevIdRef.current !== configId) {
			useBottomBarStore.getState().unregisterBar(prevIdRef.current);
			prevIdRef.current = null;
		}

		if (config) {
			useBottomBarStore.getState().registerBar(config);
			prevIdRef.current = config.id;
		} else if (prevIdRef.current) {
			useBottomBarStore.getState().unregisterBar(prevIdRef.current);
			prevIdRef.current = null;
		}
	}, [configId, configPriority, configIcon, configCollapsible, configVisible, configKeyboard]);

	// Handle content changes via effect (uses updateBarContent which bumps contentVersion)
	const content = config?.content;
	const prevContentRef = useRef(content);

	useEffect(() => {
		if (content === prevContentRef.current) return;
		prevContentRef.current = content;

		if (config && prevIdRef.current === config.id) {
			useBottomBarStore.getState().updateBarContent(config.id, content);
		}
	}, [content]);
}
