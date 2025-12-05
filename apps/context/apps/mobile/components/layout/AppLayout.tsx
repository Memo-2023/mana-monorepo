import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { Breadcrumbs } from '../navigation/Breadcrumbs';
import { useSegments, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { getSpaceById } from '~/services/supabaseService';

interface AppLayoutProps {
	children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
	const segments = useSegments();
	const [spaceName, setSpaceName] = useState<string>('');
	const [documentTitle, setDocumentTitle] = useState<string>('');
	const [breadcrumbItems, setBreadcrumbItems] = useState<Array<{ label: string; href?: string }>>(
		[]
	);

	// Funktion zum Laden des Space-Namens
	const loadSpaceName = async (spaceId: string) => {
		try {
			const space = await getSpaceById(spaceId);
			if (space) {
				setSpaceName(space.name);
			}
		} catch (err) {
			console.error('Fehler beim Laden des Space-Namens:', err);
		}
	};

	// Aktualisiere die Breadcrumbs basierend auf dem aktuellen Pfad
	useEffect(() => {
		const updateBreadcrumbs = async () => {
			const items: Array<{ label: string; href?: string }> = [];

			// Immer mit Home/Spaces beginnen
			items.push({ label: 'Spaces', href: '/' });

			// Wenn wir in einem Space sind
			if (segments.length > 1 && segments[0] === 'spaces') {
				const spaceId = segments[1];

				// Lade den Space-Namen, wenn wir ihn noch nicht haben
				if (!spaceName && spaceId) {
					await loadSpaceName(spaceId);
				}

				// Füge den Space zur Breadcrumb hinzu
				if (spaceName) {
					items.push({ label: spaceName, href: `/spaces/${spaceId}` });
				} else {
					items.push({ label: 'Space', href: `/spaces/${spaceId}` });
				}

				// Wenn wir in der Dokumentenansicht sind
				if (segments.length > 3 && segments[2] === 'documents') {
					const documentId = segments[3];

					if (documentId && documentId.toString() === 'new') {
						items.push({ label: 'Neues Dokument' });
					} else if (documentTitle) {
						items.push({ label: documentTitle });
					} else {
						items.push({ label: 'Dokument' });
					}
				}
			}

			setBreadcrumbItems(items);
		};

		updateBreadcrumbs();
	}, [segments, spaceName, documentTitle]);

	// Setze den Dokumenttitel, wenn er von außen gesetzt wird
	const setCurrentDocumentTitle = (title: string) => {
		setDocumentTitle(title);
	};

	return (
		<View className="flex-1">
			{/* Breadcrumb-Navigation */}
			{breadcrumbItems.length > 1 && (
				<View className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
					<Breadcrumbs items={breadcrumbItems} />
				</View>
			)}

			{/* Hauptinhalt */}
			{children}
		</View>
	);
}
