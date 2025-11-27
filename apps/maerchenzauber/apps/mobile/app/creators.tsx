// Firebase functionality temporarily disabled - see dataService.ts for placeholders
import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../components/atoms/Avatar';
import Text from '../components/atoms/Text';
import CommonHeader from '../components/molecules/CommonHeader';
import { useDebugBorders } from '../hooks/useDebugBorders';
import { useDebug } from '../src/contexts/DebugContext';

interface Creator {
	creatorId: string;
	description: string;
	name: string;
	profilePicture: string;
	systemPrompt: string;
	type: string;
}

export default function CreatorsScreen() {
	const [creators, setCreators] = useState<Creator[]>([]);
	const [loading, setLoading] = useState(true);
	const { debugBordersEnabled } = useDebug();

	// Screen width calculations
	const { width: screenWidth } = Dimensions.get('window');
	const isWideScreen = screenWidth > 1000;

	// Debug borders
	const debugStyles = {
		safeArea: useDebugBorders('#FF0000'),
		container: useDebugBorders('#00FF00'),
		section: useDebugBorders('#0000FF'),
		card: useDebugBorders('#FF00FF'),
	};

	// Dynamic styles
	const dynamicStyles = {
		container: {
			maxWidth: 600,
			width: '100%',
			alignSelf: 'center',
			paddingHorizontal: isWideScreen ? 0 : 20,
		},
	};

	useEffect(() => {
		const fetchCreators = async () => {
			try {
				const creatorsCollection = collection(db, 'creators');
				const creatorsSnapshot = await getDocs(creatorsCollection);
				const creatorsList = creatorsSnapshot.docs.map((doc) => ({
					...doc.data(),
					creatorId: doc.id,
				})) as Creator[];
				setCreators(creatorsList);
			} catch (error) {
				console.error('Error fetching creators:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchCreators();
	}, []);

	const renderCreatorCard = ({ item }: { item: Creator }) => (
		<View style={styles.card}>
			<Avatar
				imageUrl={item.profilePicture !== 'to_be_added' ? item.profilePicture : undefined}
				name={item.name}
				size={80}
				showName={false}
			/>
			<View style={styles.cardContent}>
				<Text style={styles.name}>{item.name}</Text>
				<Text style={styles.type}>{item.type}</Text>
				<Text style={styles.description}>{item.description}</Text>
			</View>
		</View>
	);

	if (loading) {
		return (
			<SafeAreaView style={[styles.safeArea, debugStyles.safeArea]} edges={['top']}>
				<CommonHeader title="Unsere Künstler" />
				<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
					<View style={[styles.container, debugStyles.container, dynamicStyles.container]}>
						<Text style={styles.loadingText}>Lade Künstler...</Text>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[styles.safeArea, debugStyles.safeArea]} edges={['top']}>
			<CommonHeader title="Unsere Künstler" />
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
				<View style={[styles.container, debugStyles.container, dynamicStyles.container]}>
					<FlatList
						data={creators}
						renderItem={renderCreatorCard}
						keyExtractor={(item) => item.creatorId}
						contentContainerStyle={styles.list}
						scrollEnabled={false}
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		width: '100%',
	},
	scrollViewContent: {
		flexGrow: 1,
		paddingTop: 100, // Space for header
		paddingBottom: 0,
	},
	safeArea: {
		flex: 1,
		backgroundColor: '#181818',
	},
	container: {
		flex: 1,
	},
	loadingText: {
		color: '#FFFFFF',
		textAlign: 'center',
		marginTop: 20,
	},
	list: {
		gap: 16,
		paddingVertical: 16,
	},
	card: {
		flexDirection: 'row',
		backgroundColor: '#2C2C2C',
		borderRadius: 12,
		padding: 16,
		marginHorizontal: 16,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	cardContent: {
		flex: 1,
		marginLeft: 16,
	},
	name: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FFFFFF',
		marginBottom: 4,
	},
	type: {
		fontSize: 14,
		color: '#999999',
		marginBottom: 8,
	},
	description: {
		fontSize: 14,
		color: '#CCCCCC',
	},
});
