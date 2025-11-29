import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Blurhash } from 'react-native-blurhash';
import Text from '../atoms/Text';
import Icon from '../atoms/Icon';
import { LinearGradient } from 'expo-linear-gradient';

interface CharacterCardProps {
	character: {
		id: string;
		name: string;
		original_description?: string;
		image_url?: string;
		total_vote_score?: number;
		stories_count?: number;
		share_code?: string;
		sharing_preference?: string;
	};
	onPress?: () => void;
	onVote?: (voteType: 'like' | 'love' | 'star') => void;
	onClone?: () => void;
	showVoteCount?: boolean;
	voteCount?: number;
	showCloneButton?: boolean;
	style?: any;
}

export default function CharacterCard({
	character,
	onPress,
	onVote,
	onClone,
	showVoteCount = false,
	voteCount = 0,
	showCloneButton = false,
	style,
}: CharacterCardProps) {
	const cardWidth = style?.width || 160;
	const cardHeight = cardWidth * 1.3;
	const [imageLoaded, setImageLoaded] = useState(false);

	const blurHash = (character as any).blur_hash || 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

	return (
		<TouchableOpacity
			style={[styles.container, style, { height: cardHeight }]}
			onPress={onPress}
			activeOpacity={0.8}
		>
			<View style={styles.imageContainer}>
				{character.image_url ? (
					<>
						{/* BlurHash Placeholder */}
						{!imageLoaded && (
							<Blurhash blurhash={blurHash} style={styles.blurHashPlaceholder} resizeMode="cover" />
						)}

						{/* Actual Image */}
						<Image
							source={{ uri: character.image_url }}
							style={[styles.image, !imageLoaded && styles.hiddenImage]}
							contentFit="cover"
							transition={300}
							cachePolicy="memory-disk"
							onLoad={() => setImageLoaded(true)}
						/>
					</>
				) : (
					<LinearGradient colors={['#6D5B00', '#3D3100']} style={styles.placeholderGradient}>
						<Icon set="ionicons" name="person" size={48} color="rgba(255, 255, 255, 0.3)" />
					</LinearGradient>
				)}

				{showVoteCount && (
					<View style={styles.voteContainer}>
						<Icon set="ionicons" name="heart" size={14} color="#FFFFFF" />
						<Text style={styles.voteCount}>{voteCount}</Text>
					</View>
				)}

				{character.sharing_preference === 'commons' && (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>Commons</Text>
					</View>
				)}
			</View>

			<View style={styles.contentContainer}>
				<Text style={styles.name} numberOfLines={1}>
					{character.name}
				</Text>

				{character.original_description && (
					<Text style={styles.description} numberOfLines={2}>
						{character.original_description}
					</Text>
				)}

				<View style={styles.statsContainer}>
					{character.stories_count !== undefined && (
						<View style={styles.stat}>
							<Icon set="ionicons" name="book-outline" size={12} color="#999999" />
							<Text style={styles.statText}>{character.stories_count}</Text>
						</View>
					)}

					{character.share_code && (
						<View style={styles.stat}>
							<Icon set="ionicons" name="share-outline" size={12} color="#999999" />
							<Text style={styles.statText}>{character.share_code.slice(0, 6)}</Text>
						</View>
					)}
				</View>

				{(showCloneButton || onVote) && (
					<View style={styles.actionContainer}>
						{onVote && (
							<View style={styles.voteButtons}>
								<TouchableOpacity
									style={styles.actionButton}
									onPress={(e) => {
										e.stopPropagation();
										onVote('like');
									}}
								>
									<Icon set="ionicons" name="heart-outline" size={20} color="#FF69B4" />
								</TouchableOpacity>

								<TouchableOpacity
									style={styles.actionButton}
									onPress={(e) => {
										e.stopPropagation();
										onVote('star');
									}}
								>
									<Icon set="ionicons" name="star-outline" size={20} color="#FFD700" />
								</TouchableOpacity>
							</View>
						)}

						{showCloneButton && onClone && (
							<TouchableOpacity
								style={styles.cloneButton}
								onPress={(e) => {
									e.stopPropagation();
									onClone();
								}}
							>
								<Icon set="ionicons" name="copy-outline" size={18} color="#FFFFFF" />
							</TouchableOpacity>
						)}
					</View>
				)}
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#2C2C2C',
		borderRadius: 12,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
	imageContainer: {
		flex: 1,
		position: 'relative',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	blurHashPlaceholder: {
		width: '100%',
		height: '100%',
		position: 'absolute',
		zIndex: 1,
	},
	hiddenImage: {
		opacity: 0,
	},
	placeholderGradient: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	voteContainer: {
		position: 'absolute',
		top: 8,
		right: 8,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		gap: 4,
	},
	voteCount: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '600',
	},
	badge: {
		position: 'absolute',
		top: 8,
		left: 8,
		backgroundColor: 'rgba(255, 203, 0, 0.9)',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
	},
	badgeText: {
		color: '#000000',
		fontSize: 10,
		fontWeight: '600',
	},
	contentContainer: {
		padding: 12,
	},
	name: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	description: {
		color: '#999999',
		fontSize: 12,
		lineHeight: 16,
		marginBottom: 8,
	},
	statsContainer: {
		flexDirection: 'row',
		gap: 12,
		marginBottom: 8,
	},
	stat: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	statText: {
		color: '#999999',
		fontSize: 11,
	},
	actionContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 8,
	},
	voteButtons: {
		flexDirection: 'row',
		gap: 8,
	},
	actionButton: {
		padding: 6,
		borderRadius: 8,
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
	},
	cloneButton: {
		padding: 6,
		borderRadius: 8,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	},
});
