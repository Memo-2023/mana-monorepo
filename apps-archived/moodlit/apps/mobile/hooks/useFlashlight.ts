import { useEffect, useRef } from 'react';
import { useTorch } from 'react-native-torch-nitro';

import type { AnimationType } from '@/store/store';

interface UseFlashlightProps {
	enabled: boolean;
	animationType: AnimationType;
	animationSpeed?: number;
	brightness?: number; // 1-10 (iOS), wird zu 0-maxLevel gemappt
}

export const useFlashlight = ({
	enabled,
	animationType,
	animationSpeed = 1,
	brightness = 10,
}: UseFlashlightProps) => {
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const sosTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const { on, off, setLevel, getMaxLevel } = useTorch({
		onError: (error) => {
			console.log('Torch error:', error.code);
		},
	});

	const maxLevel = getMaxLevel() || 10;
	const targetLevel = Math.round((brightness / 10) * maxLevel);

	useEffect(() => {
		// Cleanup function
		const cleanup = () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			if (sosTimeoutRef.current) {
				clearTimeout(sosTimeoutRef.current);
				sosTimeoutRef.current = null;
			}
			off();
		};

		if (!enabled) {
			cleanup();
			return;
		}

		if (animationType === 'sos') {
			// SOS: Morse-Code Pattern (··· --- ···)
			const shortDuration = 200 / animationSpeed;
			const longDuration = 600 / animationSpeed;
			const charPause = 200 / animationSpeed;
			const wordPause = 1400 / animationSpeed;

			const playSOSPattern = () => {
				let currentStep = 0;
				const steps = [
					// S - 3 kurze
					{ isOn: true, duration: shortDuration },
					{ isOn: false, duration: charPause },
					{ isOn: true, duration: shortDuration },
					{ isOn: false, duration: charPause },
					{ isOn: true, duration: shortDuration },
					{ isOn: false, duration: charPause + charPause },
					// O - 3 lange
					{ isOn: true, duration: longDuration },
					{ isOn: false, duration: charPause },
					{ isOn: true, duration: longDuration },
					{ isOn: false, duration: charPause },
					{ isOn: true, duration: longDuration },
					{ isOn: false, duration: charPause + charPause },
					// S - 3 kurze
					{ isOn: true, duration: shortDuration },
					{ isOn: false, duration: charPause },
					{ isOn: true, duration: shortDuration },
					{ isOn: false, duration: charPause },
					{ isOn: true, duration: shortDuration },
					{ isOn: false, duration: wordPause },
				];

				const runStep = () => {
					if (!enabled || currentStep >= steps.length) {
						currentStep = 0;
					}

					const step = steps[currentStep];
					if (step.isOn) {
						setLevel(targetLevel);
					} else {
						off();
					}
					currentStep++;

					sosTimeoutRef.current = setTimeout(runStep, step.duration);
				};

				runStep();
			};

			playSOSPattern();
		} else if (animationType === 'warning') {
			// Warnsignal: Blinkendes Pattern
			const warnDuration = 500 / animationSpeed;
			let isOn = false;

			intervalRef.current = setInterval(() => {
				isOn = !isOn;
				if (isOn) {
					setLevel(targetLevel);
				} else {
					off();
				}
			}, warnDuration);
		} else if (animationType === 'thunder') {
			// Gewitter: Zufällige Blitze
			const runThunderPattern = () => {
				off(); // Meistens aus

				// Zufälliger Blitz nach 2-4 Sekunden
				const waitTime = (2000 + Math.random() * 2000) / animationSpeed;

				sosTimeoutRef.current = setTimeout(() => {
					// Kurzer Blitz
					setLevel(maxLevel); // Volle Helligkeit für Blitz
					setTimeout(() => {
						off();
						// Manchmal zweiter Blitz
						if (Math.random() > 0.5) {
							setTimeout(() => {
								setLevel(maxLevel);
								setTimeout(() => {
									off();
									runThunderPattern();
								}, 80 / animationSpeed);
							}, 100 / animationSpeed);
						} else {
							runThunderPattern();
						}
					}, 50 / animationSpeed);
				}, waitTime);
			};

			runThunderPattern();
		} else if (animationType === 'pulse') {
			// Pulsieren zwischen niedrig und hoch
			let increasing = true;
			let currentBrightness = 1;

			intervalRef.current = setInterval(() => {
				if (increasing) {
					currentBrightness += 1;
					if (currentBrightness >= targetLevel) {
						increasing = false;
					}
				} else {
					currentBrightness -= 1;
					if (currentBrightness <= 1) {
						increasing = true;
					}
				}
				setLevel(currentBrightness);
			}, 100 / animationSpeed);
		} else {
			// Alle anderen Moods: Taschenlampe konstant an
			setLevel(targetLevel);
		}

		return cleanup;
	}, [enabled, animationType, animationSpeed, targetLevel, maxLevel]);

	return {
		maxLevel,
		currentBrightness: brightness,
	};
};
