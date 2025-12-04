import React, { useState, useRef, useCallback } from 'react';
import { Dimensions, ImageSourcePropType, TouchableOpacity, View } from 'react-native';
import Animated, {
	FadeIn,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	Easing as ReanimatedEasing,
} from 'react-native-reanimated';
import { useTheme } from '~/utils/ThemeContext';
import { CardInfoPanel } from './FigureCardInfo';
import { FigureInfoModal } from './FigureInfoModal';

// Typ für den aktiven Tab im Modal
type ActiveTabType = 'character' | 'item1' | 'item2' | 'item3' | null;

interface VerticalFigureCardProps {
	image: ImageSourcePropType;
	title: string;
	creator: string;
	likes: number;
	expanded?: boolean;
	onToggleExpand?: () => void;
	characterInfo?: {
		character?: {
			image_prompt?: string;
			description?: string;
			lore?: string;
		};
		items?: Array<{
			name?: string;
			image_prompt?: string;
			description?: string;
			lore?: string;
		}>;
	};
}

const { width, height } = Dimensions.get('window');
// Maximale Höhe für Desktop-Geräte (600px oder 80% der Bildschirmhöhe, je nachdem was kleiner ist)
const MAX_CARD_HEIGHT = Math.min(600, height * 0.8);

// Berechne die Breite basierend auf der maximalen Höhe und dem 2:3-Verhältnis
// Wenn die Höhe 3 Einheiten ist, dann ist die Breite 2 Einheiten
const CARD_WIDTH_BASED_ON_MAX_HEIGHT = (MAX_CARD_HEIGHT / 3) * 2;

// Verwende die kleinere der beiden Breiten, um sicherzustellen, dass das Bild auf dem Bildschirm passt
const CARD_WIDTH = Math.min(width, CARD_WIDTH_BASED_ON_MAX_HEIGHT);

// Berechne die Höhe basierend auf dem 2:3-Format und der gewählten Breite
const CARD_HEIGHT = (CARD_WIDTH / 2) * 3;

export const VerticalFigureCard: React.FC<VerticalFigureCardProps> = ({
	image,
	title,
	creator,
	likes: initialLikes,
	expanded = false,
	onToggleExpand = () => {},
	characterInfo,
}) => {
	const { theme, debugBorders, isDark } = useTheme();

	// Debug description props
	console.log('VerticalFigureCard props:', { title, characterInfo });

	// State for tracking user interactions
	const [liked, setLiked] = useState(false);
	const [likes, setLikes] = useState(initialLikes);
	const [imageLoaded, setImageLoaded] = useState(false);
	const [showInfoModal, setShowInfoModal] = useState(false);
	const [activeTab, setActiveTab] = useState<ActiveTabType>(null);

	// Animation values
	const imageOpacity = useSharedValue(0);
	const imageMarginLeft = useSharedValue(0);
	const imageMarginRight = useSharedValue(0);

	// Handle like action
	const handleLike = () => {
		if (liked) {
			setLikes(likes - 1);
		} else {
			setLikes(likes + 1);
		}
		setLiked(!liked);
	};

	// Handle other actions
	const handleShare = () => {
		console.log('Share', title);
	};

	// Toggle info modal mit Animationen
	const toggleInfoModal = () => {
		if (showInfoModal) {
			setShowInfoModal(false);
			setActiveTab(null);

			// Zurücksetzen der Margins mit Animation
			imageMarginLeft.value = withTiming(0, {
				duration: 400,
				easing: ReanimatedEasing.inOut(ReanimatedEasing.ease),
			});
			imageMarginRight.value = withTiming(0, {
				duration: 400,
				easing: ReanimatedEasing.inOut(ReanimatedEasing.ease),
			});
		} else {
			setShowInfoModal(true);
			setActiveTab('character'); // Standard-Tab beim Öffnen

			// Initiale Animation für Character-Tab
			imageMarginLeft.value = withTiming(-200, {
				duration: 400,
				easing: ReanimatedEasing.inOut(ReanimatedEasing.ease),
			});
			imageMarginRight.value = withTiming(0, {
				duration: 400,
				easing: ReanimatedEasing.inOut(ReanimatedEasing.ease),
			});
		}
	};

	// Handler für Tab-Wechsel im Modal mit Animationen
	const handleTabChange = (tab: ActiveTabType) => {
		setActiveTab(tab);

		// Animiere die Margins basierend auf dem aktiven Tab
		if (tab === 'character') {
			// Animiere nach links für Character-Tab
			imageMarginLeft.value = withTiming(-200, {
				duration: 400,
				easing: ReanimatedEasing.inOut(ReanimatedEasing.ease),
			});
			imageMarginRight.value = withTiming(0, {
				duration: 400,
				easing: ReanimatedEasing.inOut(ReanimatedEasing.ease),
			});
		} else if (tab?.startsWith('item')) {
			// Animiere nach rechts für Item-Tabs
			imageMarginLeft.value = withTiming(0, {
				duration: 400,
				easing: ReanimatedEasing.inOut(ReanimatedEasing.ease),
			});
			imageMarginRight.value = withTiming(-120, {
				duration: 400,
				easing: ReanimatedEasing.inOut(ReanimatedEasing.ease),
			});
		} else {
			// Zurücksetzen, wenn kein Tab aktiv ist
			imageMarginLeft.value = withTiming(0, {
				duration: 400,
				easing: ReanimatedEasing.inOut(ReanimatedEasing.ease),
			});
			imageMarginRight.value = withTiming(0, {
				duration: 400,
				easing: ReanimatedEasing.inOut(ReanimatedEasing.ease),
			});
		}
	};

	// Debug border styles
	const debugCardStyle = debugBorders ? { borderWidth: 2, borderColor: '#FF00FF' } : {};
	const debugContainerStyle = debugBorders ? { borderWidth: 1, borderColor: '#00FFFF' } : {};
	const debugImageStyle = debugBorders ? { borderWidth: 1, borderColor: '#FF0000' } : {};
	const debugInfoStyle = debugBorders ? { borderWidth: 1, borderColor: '#00FF00' } : {};
	const debugImageContentStyle = debugBorders
		? { borderWidth: 2, borderColor: '#FFFF00', borderStyle: 'dashed' }
		: {};

	// Handle image load completion
	const onImageLoaded = useCallback(() => {
		// Markiere das Bild als geladen
		setImageLoaded(true);

		// Animate opacity to 1 when image is fully loaded
		// Längere Dauer für ein langsameres Einblenden mit Ease-In-Effekt
		imageOpacity.value = withTiming(1, {
			duration: 1200,
			easing: ReanimatedEasing.in(ReanimatedEasing.ease), // Ease-In-Kurve für sanften Start
		});
	}, []);

	// Create animated style for the image and container
	const imageAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: imageOpacity.value,
		};
	});

	// Animated style für die Margins des Containers
	const containerAnimatedStyle = useAnimatedStyle(() => {
		return {
			marginLeft: imageMarginLeft.value,
			marginRight: imageMarginRight.value,
		};
	});

	// Verwende die gleiche Höhe wie das Bild für die gesamte Karte
	const cardHeight = CARD_HEIGHT;

	return (
		<View
			className="w-full overflow-visible mb-[10px] flex flex-col items-center"
			style={debugCardStyle}
		>
			{/* Card with image */}
			<View
				className="w-full overflow-visible flex items-center justify-center"
				style={{ height: cardHeight }}
			>
				<View
					className="w-full h-full relative flex items-center justify-center"
					style={debugContainerStyle}
				>
					{/* Image container */}
					<TouchableOpacity activeOpacity={0.9} onPress={toggleInfoModal} className="w-full h-full">
						<Animated.View
							style={[
								{
									width: CARD_WIDTH,
									height: CARD_HEIGHT,
									overflow: 'hidden',
									alignItems: 'center',
									justifyContent: 'center',
									position: 'relative',
									alignSelf: 'center',
									borderRadius: 12,
								},
								debugImageStyle,
								containerAnimatedStyle,
							]}
						>
							{/* Black loader card with low opacity */}
							<View
								style={{
									position: 'absolute',
									zIndex: 1,
									width: '80%', // Deutlich reduziert für viel mehr Abstand links/rechts
									height: '90%', // Etwas mehr Abstand oben/unten
									borderRadius: 20,
									backgroundColor: '#000000',
									opacity: 0.2,
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.3,
									shadowRadius: 6,
									elevation: 5,
								}}
							/>

							{/* The actual image - only show when loaded */}
							{imageLoaded && (
								<Animated.Image
									source={image}
									style={[
										{
											width: '100%',
											height: '100%',
											borderRadius: 12,
											zIndex: 2,
											resizeMode: 'contain',
										},
										imageAnimatedStyle,
										debugImageContentStyle,
									]}
									resizeMode="contain"
									sharedTransitionTag={`figure-image-${title}`}
									entering={FadeIn.duration(1200).easing(
										ReanimatedEasing.in(ReanimatedEasing.ease)
									)}
								/>
							)}

							{/* Invisible image for loading - not displayed */}
							<Animated.Image
								source={image}
								style={{ width: 1, height: 1, opacity: 0, position: 'absolute' }}
								onLoad={onImageLoaded}
							/>
						</Animated.View>
					</TouchableOpacity>
				</View>
			</View>

			{/* Figure card info panel under the image */}
			<CardInfoPanel
				title={title}
				creator={creator}
				likes={likes}
				isLiked={liked}
				onLike={handleLike}
				onShare={handleShare}
			/>

			{/* Using the new FigureInfoModal component */}
			<FigureInfoModal
				visible={showInfoModal}
				onClose={toggleInfoModal}
				title={title}
				creator={creator}
				characterInfo={characterInfo}
				activeTab={activeTab || 'character'}
				onTabChange={handleTabChange}
			/>
		</View>
	);
};

// Holen Sie sich die Bildschirmbreite für die Bildgröße
const { width: SCREEN_WIDTH } = Dimensions.get('window');
