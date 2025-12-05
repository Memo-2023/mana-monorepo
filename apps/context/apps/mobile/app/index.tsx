import { Stack, useRouter } from 'expo-router';
import {
	View,
	RefreshControl,
	TouchableOpacity,
	ScrollView,
	useWindowDimensions,
} from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '~/components/layout/Screen';
import { Text } from '~/components/ui/Text';
import { useAuth } from '~/context/AuthContext';
import { getSpaces, getDocuments, Document, Space } from '~/services/supabaseService';
import { useTheme } from '~/utils/theme/theme';
import { useTranslations } from '~/context/I18nContext';
import { SpaceFilterPill } from '~/components/spaces/SpaceFilterPill';
import { AllSpacesFilterPill } from '~/components/spaces/AllSpacesFilterPill';
import { SpaceFilterPillSkeleton } from '~/components/spaces/SpaceFilterPillSkeleton';
import { DocumentTypeBadge } from '~/components/documents/DocumentTypeBadge';
import { DocumentGallery } from '~/components/documents/DocumentGallery';
import { SpaceCreator } from '~/components/spaces/SpaceCreator';
import { InlineSpaceCreator } from '~/components/spaces/InlineSpaceCreator';
import { Breadcrumbs } from '~/components/navigation/Breadcrumbs';
import {
	DocumentTypeFilterDropdown,
	FilterType,
} from '~/components/documents/DocumentTypeFilterDropdown';
import { FilterPill } from '~/components/ui/FilterPill';
import { Skeleton } from '~/components/ui/Skeleton';

export default function Home() {
	const router = useRouter();
	const { user } = useAuth();
	const { isDark } = useTheme();
	const { width } = useWindowDimensions();
	const isDesktop = width > 1024;
	const { t, homepage, spaces: spacesT, common, errors } = useTranslations();

	const [spaces, setSpaces] = useState<Space[]>([]);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);
	const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [showSpaceCreator, setShowSpaceCreator] = useState(false);
	const [showInlineCreator, setShowInlineCreator] = useState(false);
	const [selectedDocumentType, setSelectedDocumentType] = useState<FilterType | null>(null);

	// Optimierte Sortierfunktion
	const sortDocuments = useCallback((docs: Document[]) => {
		return docs.sort((a, b) => {
			// Zuerst nach Pin-Status sortieren (angepinnte zuerst)
			if ((a.pinned || false) && !(b.pinned || false)) return -1;
			if (!(a.pinned || false) && (b.pinned || false)) return 1;

			// Bei gleichem Pin-Status nach Aktualisierungsdatum sortieren (neueste zuerst)
			const dateA = new Date(a.updated_at || a.created_at);
			const dateB = new Date(b.updated_at || b.created_at);
			return dateB.getTime() - dateA.getTime();
		});
	}, []);

	// Funktion zum Laden der Daten
	const loadData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// Alle Spaces laden
			const spacesData = await getSpaces();
			setSpaces(spacesData);

			// Alle Dokumente aus allen Spaces laden (parallel)
			let allDocuments: Document[] = [];

			if (spacesData.length > 0) {
				// Wenn keine Spaces ausgewählt sind, alle Dokumente laden
				if (selectedSpaceIds.length === 0) {
					const documentPromises = spacesData.map((space) => getDocuments(space.id));
					const documentResults = await Promise.all(documentPromises);
					allDocuments = documentResults.flat();
				} else {
					// Nur Dokumente aus ausgewählten Spaces laden
					const documentPromises = selectedSpaceIds.map((spaceId) => getDocuments(spaceId));
					const documentResults = await Promise.all(documentPromises);
					allDocuments = documentResults.flat();
				}
			}

			// Dokumente sortieren
			const sortedDocuments = sortDocuments(allDocuments);
			setDocuments(sortedDocuments);
		} catch (err: any) {
			console.error('Fehler beim Laden der Daten:', err);
			setError(homepage('errorLoadingData'));
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [selectedSpaceIds]);

	// Lade die Daten beim ersten Rendern und wenn sich die ausgewählten Spaces ändern
	useEffect(() => {
		if (user) {
			loadData();
		}
	}, [user, loadData, selectedSpaceIds]);

	// Funktion zum Aktualisieren der Daten (Pull-to-Refresh)
	const onRefresh = useCallback(() => {
		setRefreshing(true);
		loadData();
	}, [loadData]);

	// Funktion zum Umschalten eines Space-Filters (Single-Select)
	const toggleSpaceFilter = (spaceId: string | null) => {
		// Wenn null ("Alle") oder der bereits ausgewählte Space angeklickt wird, alle deselektieren
		if (spaceId === null || (selectedSpaceIds.length === 1 && selectedSpaceIds[0] === spaceId)) {
			setSelectedSpaceIds([]);
		} else {
			// Sonst nur den angeklickten Space auswählen
			setSelectedSpaceIds([spaceId]);
		}
	};

	// Filtere Dokumente basierend auf der Suche und dem ausgewählten Dokumenttyp
	const filteredDocuments = useMemo(() => {
		return documents.filter((doc) => {
			const titleMatch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase());
			const contentMatch = doc.content?.toLowerCase().includes(searchQuery.toLowerCase());
			const typeMatch = !selectedDocumentType || doc.type === selectedDocumentType;
			return (titleMatch || contentMatch) && typeMatch;
		});
	}, [documents, searchQuery, selectedDocumentType]);
	return (
		<>
			<Stack.Screen
				options={{
					title: homepage('title'),
					headerShown: true,
				}}
			/>
			<Screen
				scrollable={false}
				padded={false}
				style={{ flex: 1, height: '100%' }}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={['#6366f1']}
						tintColor="#6366f1"
					/>
				}
			>
				{/* Hauptcontainer ohne Breitenbegrenzung */}
				<View
					style={{
						flex: 1,
						width: '100%',
						paddingTop: 4, // Optimaler Abstand oben
						height: '100%',
					}}
				>
					{/* Breadcrumbs mit Suchfunktion und Settings-Icon */}
					<View
						style={{
							marginBottom: 24,
							backgroundColor: isDark ? '#111827' : '#f9fafb',
							paddingHorizontal: 16,
						}}
					>
						<View
							style={{
								maxWidth: isDesktop ? 800 : '100%',
								width: '100%',
								marginHorizontal: 'auto',
							}}
						>
							<Breadcrumbs
								items={[
									{ label: homepage('title'), href: undefined },
									{
										label: homepage('selectSpace'),
										dropdownItems: spaces.map((space) => ({
											id: space.id,
											label: space.name,
											href: `/spaces/${space.id}`,
										})),
									},
								]}
								showSettingsIcon={false}
								className="justify-between"
								loading={loading}
								rightComponent={
									<DocumentTypeFilterDropdown
										selectedType={selectedDocumentType}
										onTypeChange={setSelectedDocumentType}
									/>
								}
							/>
						</View>
					</View>

					{/* Filter-Bereich mit Space-Filtern */}
					<View style={{ marginBottom: 24 }}>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{
								paddingHorizontal: 16,
								height: 28,
								flexGrow: 1,
								justifyContent: 'center', // Zentriert die Inhalte horizontal
							}}
						>
							{loading ? (
								<>
									{/* Space Filter Skeleton */}
									<FilterPill
										label={spacesT('newSpace')}
										icon="add"
										variant="action"
										disabled={true}
										style={{ opacity: 0.7 }}
										onPress={() => {}}
									/>
									<SpaceFilterPillSkeleton count={3} />
								</>
							) : (
								<>
									{/* Space Filter */}
									{spaces.length > 0 ? (
										<>
											{/* Neuer Space Button oder Inline Creator */}
											{showInlineCreator ? (
												<InlineSpaceCreator
													onCancel={() => setShowInlineCreator(false)}
													onCreated={(spaceId) => {
														setShowInlineCreator(false);
														loadData();
													}}
												/>
											) : (
												<FilterPill
													label={spacesT('newSpace')}
													icon="add"
													variant="action"
													onPress={() => setShowInlineCreator(true)}
												/>
											)}

											{/* "Alle" Filter Pill */}
											<AllSpacesFilterPill
												isSelected={selectedSpaceIds.length === 0}
												onPress={() => toggleSpaceFilter(null)}
											/>

											{/* Space Filter Pills - nur gepinnte Spaces anzeigen */}
											{spaces
												.filter((space) => space.pinned)
												.map((space) => (
													<SpaceFilterPill
														key={space.id}
														id={space.id}
														name={space.name}
														isSelected={
															selectedSpaceIds.length === 1 && selectedSpaceIds[0] === space.id
														}
														onPress={toggleSpaceFilter}
													/>
												))}
										</>
									) : (
										<>
											{/* Neuer Space Button oder Inline Creator */}
											{showInlineCreator ? (
												<InlineSpaceCreator
													onCancel={() => setShowInlineCreator(false)}
													onCreated={(spaceId) => {
														setShowInlineCreator(false);
														loadData();
													}}
												/>
											) : (
												<FilterPill
													label={spacesT('newSpace')}
													icon="add"
													variant="action"
													onPress={() => setShowInlineCreator(true)}
												/>
											)}

											{/* "Alle" Filter Pill */}
											<AllSpacesFilterPill
												isSelected={true}
												onPress={() => toggleSpaceFilter(null)}
											/>

											<Text
												style={{
													color: isDark ? '#9ca3af' : '#6b7280',
													fontSize: 14,
													fontStyle: 'italic',
													marginRight: 12,
												}}
											>
												{spacesT('noSpaces')}
											</Text>
										</>
									)}
								</>
							)}
						</ScrollView>
					</View>

					{/* Dokumente als Galerie anzeigen */}
					<View style={{ flex: 1, position: 'relative' }}>
						<DocumentGallery
							documents={filteredDocuments}
							loading={loading}
							error={error}
							searchQuery={searchQuery}
							selectedSpaceIds={selectedSpaceIds}
							onCreateDocument={() => {
								if (selectedSpaceIds.length === 1) {
									// Wenn genau ein Space ausgewählt ist, navigiere zur Dokumenterstellung für diesen Space
									router.push(`/spaces/${selectedSpaceIds[0]}/documents/create?mode=edit`);
								} else if (selectedSpaceIds.length === 0 && spaces.length > 0) {
									// Wenn kein Space ausgewählt ist, aber Spaces vorhanden sind, nehme den ersten Space
									router.push(`/spaces/${spaces[0].id}/documents/create?mode=edit`);
								} else if (spaces.length > 0) {
									// Wenn mehrere Spaces ausgewählt sind, nehme den ersten ausgewählten Space
									router.push(`/spaces/${selectedSpaceIds[0]}/documents/create?mode=edit`);
								} else {
									// Wenn keine Spaces vorhanden sind, zeige eine Meldung an
									alert(spacesT('createSpaceFirst'));
								}
							}}
						/>

						{/* Settings Icon (unten rechts) */}
						<Ionicons
							name="settings-outline"
							size={24}
							color={isDark ? '#9ca3af' : '#6b7280'}
							style={{
								position: 'absolute',
								bottom: 12,
								right: 20,
							}}
							onPress={() => router.push('/settings')}
						/>
					</View>
				</View>
			</Screen>

			{/* Space Creator Modal */}
			<SpaceCreator
				visible={showSpaceCreator}
				onClose={() => setShowSpaceCreator(false)}
				onCreated={(spaceId) => {
					// Space wurde erstellt, füge ihn zur Auswahl hinzu
					setSelectedSpaceIds([spaceId]);
					// Lade die Daten neu
					loadData();
				}}
			/>
		</>
	);
}
