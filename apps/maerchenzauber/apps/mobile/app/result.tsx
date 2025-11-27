import { View, ScrollView, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useState, useRef } from 'react';
import { Image } from 'expo-image';
import { Blurhash } from 'react-native-blurhash';
import CommonHeader from '../components/molecules/CommonHeader';
import Text from '../components/atoms/Text';

interface StoryImage {
	status: string;
	data: {
		image: string;
		page: number;
		description: string;
		blur_hash?: string;
	};
}

export default function StoryResult() {
	const { images } = useLocalSearchParams();
	const storyImages = JSON.parse(decodeURIComponent(images as string)) as StoryImage[];
	const [loadedImages, setLoadedImages] = useState<{ [key: number]: boolean }>({});

	// Default BlurHash for smooth placeholder (neutral gray-blue)
	const defaultBlurHash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<CommonHeader title="Deine Geschichte" />
			<View style={styles.container}>
				<ScrollView>
					{storyImages.map((item: StoryImage, index: number) => (
						<View key={index} style={styles.storyPage}>
							<View style={styles.imageContainer}>
								{/* BlurHash Placeholder - shown while image loads */}
								{!loadedImages[index] && (
									<Blurhash
										blurhash={item.data.blur_hash || defaultBlurHash}
										style={styles.blurHashPlaceholder}
										resizeMode="cover"
									/>
								)}

								{/* Actual Image - fades in smoothly when loaded */}
								<Image
									source={{ uri: item.data.image }}
									style={[styles.storyImage, !loadedImages[index] && styles.hiddenImage]}
									contentFit="contain"
									transition={300}
									cachePolicy="memory-disk"
									onLoad={() => {
										setLoadedImages((prev) => ({ ...prev, [index]: true }));
									}}
									onError={(error) => {
										console.error('Bildfehler:', error);
									}}
								/>
							</View>
							<Text variant="subheader" color="#fff" style={styles.pageNumber}>
								Seite {item.data.page}
							</Text>
							<Text variant="body" color="#ccc" style={styles.description}>
								{item.data.description}
							</Text>
						</View>
					))}
				</ScrollView>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#181818',
	},
	container: {
		flex: 1,
	},
	storyPage: {
		padding: 16,
		marginBottom: 24,
		borderBottomWidth: 1,
		borderBottomColor: '#333',
	},
	imageContainer: {
		width: '100%',
		height: 300,
		marginBottom: 16,
		backgroundColor: '#222',
		justifyContent: 'center',
		alignItems: 'center',
	},
	storyImage: {
		width: '100%',
		height: '100%',
	},
	hiddenImage: {
		opacity: 0,
	},
	blurHashPlaceholder: {
		position: 'absolute',
		width: '100%',
		height: '100%',
	},
	pageNumber: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
		color: '#fff',
	},
	description: {
		fontSize: 16,
		lineHeight: 24,
		color: '#ccc',
	},
});
