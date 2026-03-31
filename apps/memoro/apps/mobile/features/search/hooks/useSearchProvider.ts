import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useGlobalSearchStore, type SearchProvider } from '../store/globalSearchStore';

/**
 * Hook for pages to register their search capabilities.
 * Registers on focus, unregisters on blur.
 * Pass null to indicate no search is available on this page.
 */
export function useSearchProvider(config: SearchProvider | null) {
	const configRef = useRef(config);
	configRef.current = config;
	const registeredIdRef = useRef<string | null>(null);

	// Register on focus, unregister on blur
	useFocusEffect(
		useCallback(() => {
			const current = configRef.current;
			if (current) {
				useGlobalSearchStore.getState().registerProvider(current);
				registeredIdRef.current = current.id;
			}

			return () => {
				if (registeredIdRef.current) {
					useGlobalSearchStore.getState().unregisterProvider(registeredIdRef.current);
					registeredIdRef.current = null;
				}
			};
		}, [])
	);

	// Handle config changes
	useEffect(() => {
		if (config) {
			useGlobalSearchStore.getState().registerProvider(config);
			registeredIdRef.current = config.id;
		} else if (registeredIdRef.current) {
			useGlobalSearchStore.getState().unregisterProvider(registeredIdRef.current);
			registeredIdRef.current = null;
		}
	}, [config?.id, config?.placeholder, config?.currentIndex, config?.totalResults]);

	// Update callbacks without full re-registration (they change on every render)
	useEffect(() => {
		if (config && registeredIdRef.current === config.id) {
			useGlobalSearchStore.getState().updateProvider({
				onSearch: config.onSearch,
				onClose: config.onClose,
				onNext: config.onNext,
				onPrevious: config.onPrevious,
			});
		}
	}, [config?.onSearch, config?.onClose, config?.onNext, config?.onPrevious]);
}
