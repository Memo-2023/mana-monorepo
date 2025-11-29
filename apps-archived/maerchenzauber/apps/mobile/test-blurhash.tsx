import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Blurhash } from 'react-native-blurhash';

/**
 * BlurHash Demo Component
 *
 * Zeigt den Unterschied zwischen:
 * 1. Bild MIT BlurHash-Placeholder
 * 2. Bild OHNE BlurHash-Placeholder
 *
 * Usage: Importiere diese Component in eine Test-Screen
 */
export default function BlurHashDemo() {
	const [imageLoaded1, setImageLoaded1] = useState(false);
	const [imageLoaded2, setImageLoaded2] = useState(false);

	// Beispiel-Bild URL (ändere zu deinem eigenen)
	const testImageUrl = 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800';

	// BlurHash für das Test-Bild (generiert mit blurhash.dev)
	const testBlurHash = 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.';

	const resetTest = () => {
		setImageLoaded1(false);
		setImageLoaded2(false);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>BlurHash Test</Text>
			<Text style={styles.subtitle}>Vergleiche Loading-Experience:</Text>

			<View style={styles.row}>
				{/* MIT BlurHash */}
				<View style={styles.testBox}>
					<Text style={styles.label}>MIT BlurHash ✨</Text>
					<View style={styles.imageContainer}>
						{/* BlurHash Placeholder */}
						{!imageLoaded1 && (
							<Blurhash blurhash={testBlurHash} style={styles.blurHash} resizeMode="cover" />
						)}

						{/* Actual Image */}
						<Image
							source={{ uri: `${testImageUrl}&t=${Date.now()}` }}
							style={[styles.image, !imageLoaded1 && styles.hiddenImage]}
							contentFit="cover"
							transition={300}
							cachePolicy="none"
							onLoad={() => setImageLoaded1(true)}
						/>
					</View>
				</View>

				{/* OHNE BlurHash */}
				<View style={styles.testBox}>
					<Text style={styles.label}>OHNE BlurHash 😐</Text>
					<View style={styles.imageContainer}>
						{/* Nur graues Placeholder */}
						{!imageLoaded2 && (
							<View style={styles.grayPlaceholder}>
								<Text style={styles.loadingText}>Loading...</Text>
							</View>
						)}

						{/* Actual Image */}
						<Image
							source={{ uri: `${testImageUrl}&t=${Date.now() + 1}` }}
							style={[styles.image, !imageLoaded2 && styles.hiddenImage]}
							contentFit="cover"
							transition={300}
							cachePolicy="none"
							onLoad={() => setImageLoaded2(true)}
						/>
					</View>
				</View>
			</View>

			<TouchableOpacity style={styles.resetButton} onPress={resetTest}>
				<Text style={styles.resetButtonText}>🔄 Reset & Reload</Text>
			</TouchableOpacity>

			<View style={styles.infoBox}>
				<Text style={styles.infoTitle}>💡 Tipp:</Text>
				<Text style={styles.infoText}>
					Aktiviere "Slow 3G" in Chrome DevTools (Network Tab) oder verwende Network Link
					Conditioner auf iOS um den Effekt besser zu sehen!
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#181818',
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#ffffff',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#999999',
		marginBottom: 24,
	},
	row: {
		flexDirection: 'row',
		gap: 16,
		marginBottom: 24,
	},
	testBox: {
		flex: 1,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#ffffff',
		marginBottom: 8,
	},
	imageContainer: {
		width: '100%',
		aspectRatio: 1,
		backgroundColor: '#222222',
		borderRadius: 12,
		overflow: 'hidden',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	blurHash: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		zIndex: 1,
	},
	grayPlaceholder: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		backgroundColor: '#333333',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1,
	},
	loadingText: {
		color: '#666666',
		fontSize: 14,
	},
	hiddenImage: {
		opacity: 0,
	},
	resetButton: {
		backgroundColor: '#FFD700',
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: 'center',
		marginBottom: 24,
	},
	resetButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#000000',
	},
	infoBox: {
		backgroundColor: 'rgba(255, 215, 0, 0.1)',
		padding: 16,
		borderRadius: 12,
		borderLeftWidth: 4,
		borderLeftColor: '#FFD700',
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFD700',
		marginBottom: 8,
	},
	infoText: {
		fontSize: 14,
		color: '#CCCCCC',
		lineHeight: 20,
	},
});
