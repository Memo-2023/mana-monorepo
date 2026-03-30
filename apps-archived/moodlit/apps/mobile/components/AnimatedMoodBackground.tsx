import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withTiming,
	withSequence,
	Easing,
} from 'react-native-reanimated';

import type { Mood } from '@/store/store';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface AnimatedMoodBackgroundProps {
	mood: Mood;
	animationSpeed?: number; // 0.5 = langsam, 1 = normal, 2 = schnell
}

export const AnimatedMoodBackground = ({
	mood,
	animationSpeed = 1,
}: AnimatedMoodBackgroundProps) => {
	const opacity = useSharedValue(1);
	const scale = useSharedValue(1);

	// Für sunrise/sunset brauchen wir einen dedizierten Wert
	const needsGradientSequence = mood.animationType === 'sunrise' || mood.animationType === 'sunset';
	const colorIndex = useSharedValue(needsGradientSequence ? 0 : 0);

	useEffect(() => {
		// Basis-Dauer angepasst an Geschwindigkeit
		const baseDuration = 2000 / animationSpeed;

		if (mood.animationType === 'pulse') {
			// Pulsieren: Opacity und Scale ändern
			opacity.value = withRepeat(
				withSequence(
					withTiming(0.6, { duration: baseDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(1, { duration: baseDuration, easing: Easing.inOut(Easing.ease) })
				),
				-1,
				true
			);

			scale.value = withRepeat(
				withSequence(
					withTiming(1.1, { duration: baseDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(1, { duration: baseDuration, easing: Easing.inOut(Easing.ease) })
				),
				-1,
				true
			);
		} else if (mood.animationType === 'wave') {
			// Wellen: Nur Opacity
			const waveDuration = 3000 / animationSpeed;
			opacity.value = withRepeat(
				withSequence(
					withTiming(0.7, { duration: waveDuration, easing: Easing.sin }),
					withTiming(1, { duration: waveDuration, easing: Easing.sin })
				),
				-1,
				true
			);
		} else if (mood.animationType === 'flash') {
			// Flash: Schnelles Aufblitzen von schwarz zu weiß
			const flashDuration = 100 / animationSpeed; // Sehr kurz für Blitz-Effekt
			const pauseDuration = 500 / animationSpeed; // Pause zwischen Blitzen

			opacity.value = withRepeat(
				withSequence(
					withTiming(0, { duration: 0 }), // Schwarz
					withTiming(0, { duration: pauseDuration }), // Pause
					withTiming(1, { duration: flashDuration, easing: Easing.linear }), // Blitz
					withTiming(0, { duration: flashDuration, easing: Easing.linear }), // Zurück zu Schwarz
					withTiming(0, { duration: pauseDuration }) // Pause
				),
				-1,
				false
			);
		} else if (mood.animationType === 'sos') {
			// SOS: Morse-Code Pattern (· · · — — — · · ·)
			const shortFlash = 200 / animationSpeed; // Kurzes Signal
			const longFlash = 600 / animationSpeed; // Langes Signal
			const shortPause = 200 / animationSpeed; // Pause zwischen Signalen
			const letterPause = 600 / animationSpeed; // Pause zwischen Buchstaben
			const wordPause = 2000 / animationSpeed; // Pause nach SOS

			opacity.value = withRepeat(
				withSequence(
					// S (drei kurze)
					withTiming(1, { duration: shortFlash, easing: Easing.linear }),
					withTiming(0, { duration: shortPause, easing: Easing.linear }),
					withTiming(1, { duration: shortFlash, easing: Easing.linear }),
					withTiming(0, { duration: shortPause, easing: Easing.linear }),
					withTiming(1, { duration: shortFlash, easing: Easing.linear }),
					withTiming(0, { duration: letterPause, easing: Easing.linear }),

					// O (drei lange)
					withTiming(1, { duration: longFlash, easing: Easing.linear }),
					withTiming(0, { duration: shortPause, easing: Easing.linear }),
					withTiming(1, { duration: longFlash, easing: Easing.linear }),
					withTiming(0, { duration: shortPause, easing: Easing.linear }),
					withTiming(1, { duration: longFlash, easing: Easing.linear }),
					withTiming(0, { duration: letterPause, easing: Easing.linear }),

					// S (drei kurze)
					withTiming(1, { duration: shortFlash, easing: Easing.linear }),
					withTiming(0, { duration: shortPause, easing: Easing.linear }),
					withTiming(1, { duration: shortFlash, easing: Easing.linear }),
					withTiming(0, { duration: shortPause, easing: Easing.linear }),
					withTiming(1, { duration: shortFlash, easing: Easing.linear }),
					withTiming(0, { duration: wordPause, easing: Easing.linear }) // Lange Pause
				),
				-1,
				false
			);
		} else if (mood.animationType === 'candle') {
			// Kerze: Sanftes, langsames Flackern wie echte Kerzenflamme
			const flickerDuration = 400 / animationSpeed;
			opacity.value = withRepeat(
				withSequence(
					withTiming(0.92, { duration: flickerDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(1, { duration: flickerDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(0.88, { duration: flickerDuration * 0.8, easing: Easing.inOut(Easing.ease) }),
					withTiming(0.95, { duration: flickerDuration * 1.2, easing: Easing.inOut(Easing.ease) }),
					withTiming(1, { duration: flickerDuration, easing: Easing.inOut(Easing.ease) })
				),
				-1,
				false
			);
			scale.value = withRepeat(
				withSequence(
					withTiming(0.99, { duration: flickerDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(1, { duration: flickerDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(0.985, { duration: flickerDuration * 0.8, easing: Easing.inOut(Easing.ease) }),
					withTiming(0.995, { duration: flickerDuration * 1.2, easing: Easing.inOut(Easing.ease) }),
					withTiming(1, { duration: flickerDuration, easing: Easing.inOut(Easing.ease) })
				),
				-1,
				false
			);
		} else if (mood.animationType === 'police') {
			// Polizei: Abwechselnd Blau und Rot
			const blinkDuration = 300 / animationSpeed;
			colorIndex.value = withRepeat(
				withSequence(
					withTiming(0, { duration: 0 }),
					withTiming(0, { duration: blinkDuration }),
					withTiming(1, { duration: 0 }),
					withTiming(1, { duration: blinkDuration })
				),
				-1,
				false
			);
		} else if (mood.animationType === 'warning') {
			// Warnsignal: Blinkendes Orange/Gelb
			const warnDuration = 500 / animationSpeed;
			opacity.value = withRepeat(
				withSequence(
					withTiming(1, { duration: warnDuration, easing: Easing.linear }),
					withTiming(0.3, { duration: warnDuration, easing: Easing.linear })
				),
				-1,
				false
			);
		} else if (mood.animationType === 'disco') {
			// Disco: Schnell wechselnde Farben
			const discoSpeed = 400 / animationSpeed;
			colorIndex.value = withRepeat(
				withSequence(
					withTiming(0, { duration: 0 }),
					withTiming(0, { duration: discoSpeed }),
					withTiming(1, { duration: 0 }),
					withTiming(1, { duration: discoSpeed }),
					withTiming(2, { duration: 0 }),
					withTiming(2, { duration: discoSpeed }),
					withTiming(3, { duration: 0 }),
					withTiming(3, { duration: discoSpeed }),
					withTiming(4, { duration: 0 }),
					withTiming(4, { duration: discoSpeed }),
					withTiming(5, { duration: 0 }),
					withTiming(5, { duration: discoSpeed })
				),
				-1,
				false
			);
		} else if (mood.animationType === 'thunder') {
			// Gewitter: Zufällige Blitze
			const thunderPattern = () => {
				return withSequence(
					withTiming(1, { duration: 0 }), // Grau/Normal
					withTiming(1, { duration: 2000 / animationSpeed }), // Pause
					withTiming(3, { duration: 50 / animationSpeed }), // Kurzer Blitz
					withTiming(1, { duration: 100 / animationSpeed }),
					withTiming(3, { duration: 80 / animationSpeed }), // Zweiter Blitz
					withTiming(1, { duration: 3000 / animationSpeed }) // Längere Pause
				);
			};
			opacity.value = withRepeat(thunderPattern(), -1, false);
		} else if (mood.animationType === 'breath') {
			// Atem: 4 Sekunden einatmen, 4 Sekunden ausatmen
			const breathInDuration = 4000 / animationSpeed;
			const breathOutDuration = 4000 / animationSpeed;
			opacity.value = withRepeat(
				withSequence(
					withTiming(0.3, { duration: breathOutDuration, easing: Easing.inOut(Easing.ease) }), // Ausatmen
					withTiming(1, { duration: breathInDuration, easing: Easing.inOut(Easing.ease) }) // Einatmen
				),
				-1,
				true
			);
			scale.value = withRepeat(
				withSequence(
					withTiming(0.95, { duration: breathOutDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(1, { duration: breathInDuration, easing: Easing.inOut(Easing.ease) })
				),
				-1,
				true
			);
		} else if (mood.animationType === 'rave') {
			// Rave: Sehr schnelle, chaotische Farbwechsel
			const raveSpeed = 150 / animationSpeed;
			colorIndex.value = withRepeat(
				withSequence(
					withTiming(0, { duration: 0 }),
					withTiming(0, { duration: raveSpeed }),
					withTiming(1, { duration: 0 }),
					withTiming(1, { duration: raveSpeed }),
					withTiming(2, { duration: 0 }),
					withTiming(2, { duration: raveSpeed }),
					withTiming(3, { duration: 0 }),
					withTiming(3, { duration: raveSpeed }),
					withTiming(4, { duration: 0 }),
					withTiming(4, { duration: raveSpeed }),
					withTiming(5, { duration: 0 }),
					withTiming(5, { duration: raveSpeed }),
					withTiming(6, { duration: 0 }),
					withTiming(6, { duration: raveSpeed }),
					withTiming(7, { duration: 0 }),
					withTiming(7, { duration: raveSpeed })
				),
				-1,
				false
			);
		} else if (mood.animationType === 'scanner') {
			// Scanner: Lichtwelle die hin und her wandert
			const scanDuration = 2000 / animationSpeed;
			opacity.value = withRepeat(
				withSequence(
					withTiming(0, { duration: 0 }),
					withTiming(1, { duration: scanDuration / 4, easing: Easing.inOut(Easing.ease) }),
					withTiming(1, { duration: scanDuration / 4 }),
					withTiming(0, { duration: scanDuration / 4, easing: Easing.inOut(Easing.ease) }),
					withTiming(0, { duration: scanDuration / 4 })
				),
				-1,
				false
			);
		} else if (mood.animationType === 'matrix') {
			// Matrix: Grün blinkend wie digitaler Code
			const matrixSpeed = 100 / animationSpeed;
			opacity.value = withRepeat(
				withSequence(
					withTiming(1, { duration: matrixSpeed }),
					withTiming(0.7, { duration: matrixSpeed }),
					withTiming(1, { duration: matrixSpeed }),
					withTiming(0.85, { duration: matrixSpeed }),
					withTiming(1, { duration: matrixSpeed }),
					withTiming(0.6, { duration: matrixSpeed }),
					withTiming(1, { duration: matrixSpeed * 2 })
				),
				-1,
				false
			);
		} else if (mood.animationType === 'sunrise') {
			// Sonnenaufgang: Sehr sanfter, langsamer Durchlauf durch verschiedene Gradient-Phasen
			const phaseDuration = 20000 / animationSpeed; // 20 Sekunden pro Phase
			const transitionDuration = 8000 / animationSpeed; // 8 Sekunden Übergang

			colorIndex.value = 0; // Start bei 0
			colorIndex.value = withRepeat(
				withSequence(
					withTiming(0.5, { duration: transitionDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(0.5, { duration: phaseDuration - transitionDuration * 2 }),
					withTiming(1.5, { duration: transitionDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(1.5, { duration: phaseDuration - transitionDuration * 2 }),
					withTiming(2.5, { duration: transitionDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(2.5, { duration: phaseDuration - transitionDuration * 2 }),
					withTiming(3.5, { duration: transitionDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(3.5, { duration: phaseDuration - transitionDuration * 2 }),
					withTiming(4.5, { duration: transitionDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(4.5, { duration: phaseDuration - transitionDuration * 2 }),
					withTiming(5.5, { duration: transitionDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(5.5, { duration: phaseDuration - transitionDuration * 2 })
				),
				-1,
				false
			);
		} else if (mood.animationType === 'sunset') {
			// Sonnenuntergang: Sehr sanfter, langsamer Durchlauf durch verschiedene Gradient-Phasen
			const phaseDuration = 20000 / animationSpeed; // 20 Sekunden pro Phase
			const transitionDuration = 8000 / animationSpeed; // 8 Sekunden Übergang

			colorIndex.value = 0;
			colorIndex.value = withRepeat(
				withSequence(
					withTiming(0.5, { duration: transitionDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(0.5, { duration: phaseDuration - transitionDuration * 2 }),
					withTiming(1.5, { duration: transitionDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(1.5, { duration: phaseDuration - transitionDuration * 2 }),
					withTiming(2.5, { duration: transitionDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(2.5, { duration: phaseDuration - transitionDuration * 2 }),
					withTiming(3.5, { duration: transitionDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(3.5, { duration: phaseDuration - transitionDuration * 2 }),
					withTiming(4.5, { duration: transitionDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(4.5, { duration: phaseDuration - transitionDuration * 2 }),
					withTiming(5.5, { duration: transitionDuration, easing: Easing.inOut(Easing.ease) }),
					withTiming(5.5, { duration: phaseDuration - transitionDuration * 2 })
				),
				-1,
				false
			);
		}
	}, [mood.animationType, animationSpeed]);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			opacity: opacity.value,
			transform: [{ scale: scale.value }],
		};
	});

	// Farb-Logik für verschiedene Animationen
	const animatedColors = useAnimatedStyle(() => {
		// Für Polizei: Wechsel zwischen Blau und Rot
		if (mood.animationType === 'police') {
			const idx = Math.floor(colorIndex.value);
			const color = idx === 0 ? '#0000FF' : '#FF0000';
			return { backgroundColor: color };
		}

		// Für Disco: Durchlaufe alle Farben
		if (mood.animationType === 'disco') {
			const idx = Math.floor(colorIndex.value);
			const colors = mood.colors;
			const color = colors[idx % colors.length] || colors[0];
			return { backgroundColor: color };
		}

		// Für Rave: Durchlaufe alle Farben (schneller als Disco)
		if (mood.animationType === 'rave') {
			const idx = Math.floor(colorIndex.value);
			const colors = mood.colors;
			const color = colors[idx % colors.length] || colors[0];
			return { backgroundColor: color };
		}

		// Für Gewitter: Normal grau, aber bei opacity > 2 wird es weiß (Blitz)
		if (mood.animationType === 'thunder') {
			const isFlash = opacity.value > 2;
			return { backgroundColor: isFlash ? '#FFFFFF' : '#34495E' };
		}

		return {};
	});

	// Für Sonnenaufgang/Sonnenuntergang: Sanfte Übergänge zwischen Phasen
	const phase0Opacity = useAnimatedStyle(() => {
		const idx = colorIndex.value;
		// Fade out when approaching phase 1
		if (idx < 0.5) return { opacity: 1 };
		if (idx < 1.5) return { opacity: Math.max(0, 1.5 - idx) };
		return { opacity: 0 };
	});

	const phase1Opacity = useAnimatedStyle(() => {
		const idx = colorIndex.value;
		if (idx < 0.5) return { opacity: 0 };
		if (idx < 1.5) return { opacity: Math.min(1, idx - 0.5) };
		if (idx < 2.5) return { opacity: Math.max(0, 2.5 - idx) };
		return { opacity: 0 };
	});

	const phase2Opacity = useAnimatedStyle(() => {
		const idx = colorIndex.value;
		if (idx < 1.5) return { opacity: 0 };
		if (idx < 2.5) return { opacity: Math.min(1, idx - 1.5) };
		if (idx < 3.5) return { opacity: Math.max(0, 3.5 - idx) };
		return { opacity: 0 };
	});

	const phase3Opacity = useAnimatedStyle(() => {
		const idx = colorIndex.value;
		if (idx < 2.5) return { opacity: 0 };
		if (idx < 3.5) return { opacity: Math.min(1, idx - 2.5) };
		if (idx < 4.5) return { opacity: Math.max(0, 4.5 - idx) };
		return { opacity: 0 };
	});

	const phase4Opacity = useAnimatedStyle(() => {
		const idx = colorIndex.value;
		if (idx < 3.5) return { opacity: 0 };
		if (idx < 4.5) return { opacity: Math.min(1, idx - 3.5) };
		if (idx < 5.5) return { opacity: Math.max(0, 5.5 - idx) };
		return { opacity: 0 };
	});

	const phase5Opacity = useAnimatedStyle(() => {
		const idx = colorIndex.value;
		if (idx < 4.5) return { opacity: 0 };
		if (idx < 5.5) return { opacity: Math.min(1, idx - 4.5) };
		return { opacity: 1 }; // Stay visible at the end before looping
	});

	const getColors = () => {
		if (mood.animationType === 'sos') {
			return ['#FF0000', '#FF0000']; // Einheitliches Rot
		}
		if (mood.animationType === 'flash') {
			return ['#FFFFFF', '#FFFFFF']; // Einheitliches Weiß
		}
		if (mood.animationType === 'scanner') {
			return ['#FF0000', '#FF0000']; // Einheitliches Rot für Scanner
		}
		if (mood.animationType === 'matrix') {
			return ['#00FF00', '#00FF00']; // Einheitliches Grün für Matrix
		}
		if (
			mood.animationType === 'police' ||
			mood.animationType === 'disco' ||
			mood.animationType === 'rave' ||
			mood.animationType === 'thunder' ||
			mood.animationType === 'sunrise' ||
			mood.animationType === 'sunset'
		) {
			// Für diese Modi verwenden wir animatedColors statt Gradient
			return ['transparent', 'transparent'];
		}
		return mood.colors;
	};

	// Für SOS, Flash, Scanner und Matrix brauchen wir einen schwarzen Hintergrund
	const needsBlackBackground =
		mood.animationType === 'sos' ||
		mood.animationType === 'flash' ||
		mood.animationType === 'scanner' ||
		mood.animationType === 'matrix';
	const needsAnimatedBackground =
		mood.animationType === 'police' ||
		mood.animationType === 'disco' ||
		mood.animationType === 'rave' ||
		mood.animationType === 'thunder';

	// Für Sonnenaufgang/Sonnenuntergang: Gradient-Paare extrahieren
	const getGradientPhases = () => {
		if (!needsGradientSequence) return [];
		const phases = [];
		const colors = mood.colors;
		for (let i = 0; i < colors.length; i += 2) {
			phases.push([colors[i], colors[i + 1] || colors[i]]);
		}
		return phases;
	};

	const gradientPhases = getGradientPhases();

	return (
		<>
			{needsBlackBackground && (
				<View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
			)}

			{needsAnimatedBackground ? (
				<Animated.View style={[StyleSheet.absoluteFill, animatedStyle, animatedColors]} />
			) : needsGradientSequence ? (
				<>
					{/* Render all gradient phases, only one visible at a time */}
					{gradientPhases.length > 0 && (
						<>
							<AnimatedLinearGradient
								colors={gradientPhases[0]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={[StyleSheet.absoluteFill, phase0Opacity]}
							/>
							<AnimatedLinearGradient
								colors={gradientPhases[1]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={[StyleSheet.absoluteFill, phase1Opacity]}
							/>
							<AnimatedLinearGradient
								colors={gradientPhases[2]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={[StyleSheet.absoluteFill, phase2Opacity]}
							/>
							<AnimatedLinearGradient
								colors={gradientPhases[3]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={[StyleSheet.absoluteFill, phase3Opacity]}
							/>
							<AnimatedLinearGradient
								colors={gradientPhases[4]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={[StyleSheet.absoluteFill, phase4Opacity]}
							/>
							<AnimatedLinearGradient
								colors={gradientPhases[5]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={[StyleSheet.absoluteFill, phase5Opacity]}
							/>
						</>
					)}
				</>
			) : (
				<AnimatedLinearGradient
					colors={getColors()}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={[StyleSheet.absoluteFill, animatedStyle]}
				/>
			)}
		</>
	);
};
