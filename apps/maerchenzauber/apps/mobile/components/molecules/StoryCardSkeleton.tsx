import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Skeleton from '../atoms/Skeleton';

interface StoryCardSkeletonProps {
	width?: number;
}

const ASPECT_RATIO = 1.5; // Same as StoryCard

const StoryCardSkeleton: React.FC<StoryCardSkeletonProps> = ({ width }) => {
	const screenWidth = Dimensions.get('window').width;
	const cardWidth = width || screenWidth * 0.4;
	const cardHeight = cardWidth * ASPECT_RATIO;

	const dynamicStyles = StyleSheet.create({
		container: {
			width: cardWidth,
			height: cardHeight,
			backgroundColor: '#2C2C2C',
			borderRadius: 12,
			overflow: 'hidden',
			shadowColor: '#000',
			shadowOffset: {
				width: 4,
				height: 4,
			},
			shadowOpacity: 0.3,
			shadowRadius: 5,
			elevation: 8,
			transform: [{ perspective: 1000 }, { rotateY: '-5deg' }],
		},
	});

	return (
		<View style={dynamicStyles.container}>
			<Skeleton style={styles.image} />
			<View style={styles.textContainer}>
				<Skeleton style={styles.titleSkeleton} />
				<View style={styles.footer}>
					<Skeleton style={styles.authorSkeleton} />
					<Skeleton style={styles.pagesSkeleton} />
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	image: {
		width: '100%',
		height: '100%',
		position: 'absolute',
		backgroundColor: '#2C2C2C',
	},
	textContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		padding: 16,
		paddingTop: 32,
		backgroundColor: 'rgba(0,0,0,0.5)',
		height: '40%', // Ensure consistent height with the actual component
	},
	titleSkeleton: {
		height: 20,
		width: '80%',
		backgroundColor: '#2C2C2C',
		borderRadius: 4,
		marginBottom: 8,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 8,
	},
	authorSkeleton: {
		height: 16,
		width: '40%',
		backgroundColor: '#2C2C2C',
		borderRadius: 4,
	},
	pagesSkeleton: {
		height: 16,
		width: '20%',
		backgroundColor: '#2C2C2C',
		borderRadius: 4,
	},
});

export default StoryCardSkeleton;
