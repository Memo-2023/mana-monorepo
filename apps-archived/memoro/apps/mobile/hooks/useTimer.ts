import { useState, useEffect, useCallback, useRef } from 'react';
import { formatDuration, formatDurationFromMs } from '../utils/formatters';

/**
 * Configuration options for the timer
 */
export interface TimerOptions {
	/** Whether to track time in milliseconds (true) or seconds (false) */
	useMilliseconds?: boolean;
	/** Update interval in milliseconds */
	updateInterval?: number;
	/** Whether to use external time updates instead of internal timer */
	useExternalTimeUpdates?: boolean;
}

/**
 * A hook for managing timer functionality with support for audio recording and playback
 * @param initialState Initial time value (in seconds or milliseconds based on options)
 * @param options Configuration options
 */
const useTimer = (initialState = 0, options?: TimerOptions) => {
	// Default options
	const {
		useMilliseconds = false,
		updateInterval = 100,
		useExternalTimeUpdates = false,
	} = options || {};

	// State for the current timer value
	const [timer, setTimer] = useState(initialState);
	// State for formatted time display (MM:SS)
	const [formattedTime, setFormattedTime] = useState(formatDuration(initialState));
	// Timer activity states
	const [isActive, setIsActive] = useState(false);
	const [isPaused, setIsPaused] = useState(false);

	// References for tracking time
	const startTimeRef = useRef<number | null>(null);
	const elapsedTimeRef = useRef<number>(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	/**
	 * Clear the timer interval
	 */
	const clearTimerInterval = useCallback(() => {
		if (intervalRef.current) {
			global.clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	/**
	 * Update the formatted time display
	 */
	const updateFormattedTime = useCallback(
		(timeValue: number) => {
			if (useMilliseconds) {
				setFormattedTime(formatDurationFromMs(timeValue));
			} else {
				setFormattedTime(formatDuration(timeValue));
			}
		},
		[useMilliseconds]
	);

	/**
	 * Timer effect that handles the interval and time calculations
	 */
	useEffect(() => {
		// Skip internal timer if using external time updates
		if (useExternalTimeUpdates) return undefined;

		if (isActive && !isPaused) {
			startTimeRef.current = Date.now();
			intervalRef.current = global.setInterval(() => {
				const currentTime = Date.now();
				const startTime = startTimeRef.current || currentTime;
				const elapsed = currentTime - startTime;

				// Calculate current elapsed time based on precision setting
				let currentElapsed;
				if (useMilliseconds) {
					currentElapsed = elapsedTimeRef.current + elapsed;
					setTimer(currentElapsed);
				} else {
					currentElapsed = elapsedTimeRef.current + elapsed / 1000;
					setTimer(Math.floor(currentElapsed));
				}

				// Update formatted time display
				updateFormattedTime(useMilliseconds ? currentElapsed : currentElapsed);
			}, updateInterval);
		} else if (isPaused && startTimeRef.current) {
			const elapsed = Date.now() - startTimeRef.current;
			if (useMilliseconds) {
				elapsedTimeRef.current += elapsed;
			} else {
				elapsedTimeRef.current += elapsed / 1000;
			}
			startTimeRef.current = null;
			clearTimerInterval();
		}

		return clearTimerInterval;
	}, [
		isActive,
		isPaused,
		clearTimerInterval,
		updateFormattedTime,
		useMilliseconds,
		updateInterval,
		useExternalTimeUpdates,
	]);

	/**
	 * Start the timer
	 */
	const handleStart = useCallback(() => {
		setIsActive(true);
		setIsPaused(false);
		startTimeRef.current = Date.now();
		elapsedTimeRef.current = 0;
		setTimer(0);
		updateFormattedTime(0);
	}, [updateFormattedTime]);

	/**
	 * Pause the timer
	 */
	const handlePause = useCallback(() => {
		setIsPaused(true);
	}, []);

	/**
	 * Resume the timer
	 */
	const handleResume = useCallback(() => {
		setIsPaused(false);
		startTimeRef.current = Date.now();
	}, []);

	/**
	 * Reset the timer
	 */
	const handleReset = useCallback(() => {
		setIsActive(false);
		setIsPaused(false);
		setTimer(0);
		updateFormattedTime(0);
		startTimeRef.current = null;
		elapsedTimeRef.current = 0;
		clearTimerInterval();
	}, [clearTimerInterval, updateFormattedTime]);

	/**
	 * Set the timer to a specific value
	 */
	const setTime = useCallback(
		(newTime: number) => {
			setTimer(newTime);
			updateFormattedTime(newTime);
			if (!isActive) {
				elapsedTimeRef.current = useMilliseconds ? newTime : newTime * 1000;
			}
		},
		[isActive, updateFormattedTime, useMilliseconds]
	);

	/**
	 * Update the timer with an external time value (for use with audio players)
	 * This is useful when the time is controlled by an external source
	 */
	const updateTime = useCallback(
		(newTime: number) => {
			setTimer(newTime);
			updateFormattedTime(newTime);
		},
		[updateFormattedTime]
	);

	return {
		timer,
		formattedTime,
		isActive,
		isPaused,
		handleStart,
		handlePause,
		handleResume,
		handleReset,
		setTime,
		updateTime,
		// Aliases for better compatibility with existing code
		duration: timer,
		start: handleStart,
		pause: handlePause,
		resume: handleResume,
		reset: handleReset,
	};
};

export default useTimer;
