<script lang="ts">
	import { onDestroy } from 'svelte';
	import { t } from 'svelte-i18n';
	import { recording } from '$lib/stores/recording';
	import type { RecordingStatus } from '$lib/stores/recording';

	// Props
	interface Props {
		size?: number;
		onRecordingComplete?: (blob: Blob) => void;
	}

	let { size = 180, onRecordingComplete }: Props = $props();

	// State
	let isPressedDown = $state(false);
	let rotation = $state(0);
	let pressRotation = $state(0);
	let scale = $state(1);
	let fillRadius = $state(0);
	let showCancelModal = $state(false);

	// Animation intervals and timeouts
	let pressTimeout: number | null = null;
	let halfwayTimeout: number | null = null;
	let rotationAnimationId: number | null = null;
	let pressAnimationId: number | null = null;
	let pressStartTime = 0;
	let rotationStartTime = 0;

	const PRESS_HOLD_DURATION = 500; // 0.5 seconds for one full rotation
	const ROTATION_SPEED = 36; // degrees per second during recording

	// Computed values
	const isRecording = $derived($recording.status === 'recording');
	const isPaused = $derived($recording.status === 'paused');
	const themeColor = '#F7D44C'; // Primary gold color from theme
	const borderColor = themeColor;
	const backgroundColor = isRecording ? themeColor : 'transparent';

	// Format duration MM:SS
	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	// Animation functions
	function startRotationAnimation() {
		if (rotationAnimationId) return;

		rotationStartTime = performance.now();
		const startRotation = rotation;

		const animate = (currentTime: number) => {
			const elapsed = currentTime - rotationStartTime;
			// Smooth continuous rotation
			rotation = (startRotation + (elapsed / 1000) * ROTATION_SPEED) % 360;
			rotationAnimationId = requestAnimationFrame(animate);
		};

		rotationAnimationId = requestAnimationFrame(animate);
	}

	function stopRotationAnimation() {
		if (rotationAnimationId) {
			cancelAnimationFrame(rotationAnimationId);
			rotationAnimationId = null;
		}
	}

	function animatePressRotation(
		targetDegrees: number,
		duration: number,
		useEaseOut: boolean = false
	) {
		// Cancel any existing press animation
		if (pressAnimationId) {
			cancelAnimationFrame(pressAnimationId);
			pressAnimationId = null;
		}

		const startRotation = pressRotation;
		const startTime = performance.now();

		const animate = (currentTime: number) => {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Use linear for press-in (to 360), ease-out for release (to 0)
			let eased = progress;
			if (useEaseOut) {
				eased = 1 - Math.pow(1 - progress, 2); // Quadratic ease-out
			}

			pressRotation = startRotation + (targetDegrees - startRotation) * eased;

			if (progress < 1) {
				pressAnimationId = requestAnimationFrame(animate);
			} else {
				pressAnimationId = null;
			}
		};

		pressAnimationId = requestAnimationFrame(animate);
	}

	function animateScale(target: number, duration: number = 200) {
		const startScale = scale;
		const startTime = Date.now();

		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Spring easing
			const t = progress;
			scale = startScale + (target - startScale) * (t * (2 - t));

			if (progress < 1) {
				requestAnimationFrame(animate);
			}
		};

		requestAnimationFrame(animate);
	}

	function animateFillRadius(target: number, duration: number = 300) {
		const startFill = fillRadius;
		const startTime = Date.now();

		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);

			fillRadius = startFill + (target - startFill) * progress;

			if (progress < 1) {
				requestAnimationFrame(animate);
			} else {
				fillRadius = target;
			}
		};

		requestAnimationFrame(animate);
	}

	// Press & Hold handlers
	async function handlePressIn() {
		isPressedDown = true;
		pressStartTime = Date.now();

		// Visual feedback: scale down and start rotation
		animateScale(0.95);

		if (!isRecording) {
			// Start microphone initialization immediately (runs in parallel with hold animation)
			initializeMicrophone().catch((error) => {
				console.error('Failed to initialize microphone:', error);
			});

			// Start press rotation animation
			animatePressRotation(360, PRESS_HOLD_DURATION);

			// Halfway feedback (optional visual feedback)
			halfwayTimeout = setTimeout(() => {
				if (isPressedDown) {
					console.log('Halfway through press & hold');
				}
			}, PRESS_HOLD_DURATION / 2) as unknown as number;

			// Complete press & hold - start recording
			pressTimeout = setTimeout(async () => {
				if (isPressedDown) {
					console.log('Press & Hold completed - Starting recording');

					// Reset press rotation and start fill animation
					pressRotation = 0;
					animateFillRadius(1, 300);

					// Start recording via existing AudioRecorder logic
					await startRecording();
				}
			}, PRESS_HOLD_DURATION) as unknown as number;
		} else if (!isPaused) {
			// Stopping recording
			animatePressRotation(360, PRESS_HOLD_DURATION);

			halfwayTimeout = setTimeout(() => {
				if (isPressedDown) {
					console.log('Halfway through stop press & hold');
				}
			}, PRESS_HOLD_DURATION / 2) as unknown as number;

			pressTimeout = setTimeout(() => {
				if (isPressedDown) {
					console.log('Press & Hold completed - Stopping recording');

					// Stop recording
					stopRecording();

					// Complete rotation and reset
					const currentTotal = rotation + pressRotation;
					const remainder = currentTotal % 360;
					let additionalRotation = 0;

					if (remainder < 10) {
						additionalRotation = -remainder;
					} else if (remainder > 350) {
						additionalRotation = 360 - remainder;
					} else {
						additionalRotation = 360 - remainder;
					}

					pressRotation = 360 + additionalRotation;

					setTimeout(() => {
						rotation = 0;
						pressRotation = 0;
					}, 500);
				}
			}, PRESS_HOLD_DURATION) as unknown as number;
		}
	}

	function handlePressOut() {
		const wasInProgress = pressTimeout !== null;
		isPressedDown = false;

		// Clear timeouts
		if (pressTimeout) {
			clearTimeout(pressTimeout);
			pressTimeout = null;
		}
		if (halfwayTimeout) {
			clearTimeout(halfwayTimeout);
			halfwayTimeout = null;
		}

		// Reset scale
		animateScale(1);

		// If not recording, reset press rotation with ease-out
		if (!isRecording) {
			animatePressRotation(0, 300, true);
		}
	}

	// Recording functions (using existing Web Audio API from AudioRecorder.svelte)
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let stream: MediaStream | null = null;
	let durationInterval: number | null = null;
	let startTime: number = 0;
	let micInitPromise: Promise<MediaStream> | null = null;
	let micInitialized = $state(false);

	// Pre-initialize microphone when user starts pressing
	async function initializeMicrophone() {
		if (stream) return stream;
		if (micInitPromise) return micInitPromise;

		micInitPromise = navigator.mediaDevices.getUserMedia({
			audio: {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true,
			},
		});

		try {
			stream = await micInitPromise;
			micInitialized = true;
			return stream;
		} catch (error) {
			micInitPromise = null;
			throw error;
		}
	}

	async function startRecording() {
		try {
			audioChunks = [];
			recording.setError(null);

			// Wait for microphone if not ready yet
			if (!stream) {
				stream = await initializeMicrophone();
			}

			// Create media recorder
			const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
			mediaRecorder = new MediaRecorder(stream, { mimeType });

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunks.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunks, { type: mimeType });
				recording.setAudioBlob(audioBlob);
				recording.setStatus('stopped');

				// Call completion callback
				onRecordingComplete?.(audioBlob);
			};

			// Start recording
			mediaRecorder.start();
			startTime = Date.now();
			recording.setStatus('recording');
			recording.setDuration(0);

			// Update duration every 100ms
			durationInterval = setInterval(() => {
				const elapsed = Date.now() - startTime;
				recording.setDuration(Math.floor(elapsed / 1000));
			}, 100) as unknown as number;
		} catch (error: any) {
			console.error('Error starting recording:', error);
			if (error.name === 'NotAllowedError') {
				recording.setError(
					'Microphone permission denied. Please enable it in your browser settings.'
				);
			} else {
				recording.setError('Failed to start recording: ' + error.message);
			}
		}
	}

	function pauseRecording() {
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			mediaRecorder.pause();
			recording.setStatus('paused');
			if (durationInterval) clearInterval(durationInterval);
		}
	}

	function resumeRecording() {
		if (mediaRecorder && mediaRecorder.state === 'paused') {
			mediaRecorder.resume();
			recording.setStatus('recording');
			startTime = Date.now() - $recording.duration * 1000;
			durationInterval = setInterval(() => {
				const elapsed = Date.now() - startTime;
				recording.setDuration(Math.floor(elapsed / 1000));
			}, 100) as unknown as number;
		}
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
			if (durationInterval) clearInterval(durationInterval);

			// Stop all tracks and reset for next recording
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
				stream = null;
			}
			micInitPromise = null;
			micInitialized = false;
		}

		// Stop animations
		stopRotationAnimation();
		animateFillRadius(0, 400);
	}

	function handleCancelRecording() {
		showCancelModal = true;
	}

	function confirmCancelRecording() {
		// Stop the media recorder without triggering upload
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			// Remove the onstop handler to prevent upload
			mediaRecorder.onstop = null;
			mediaRecorder.stop();
			if (durationInterval) clearInterval(durationInterval);
		}

		// Stop all tracks and reset stream
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
		micInitPromise = null;
		micInitialized = false;
		mediaRecorder = null;

		// Stop animations
		stopRotationAnimation();

		// Reset everything
		recording.reset();
		audioChunks = [];
		rotation = 0;
		pressRotation = 0;
		fillRadius = 0;
		showCancelModal = false;
	}

	function closeCancelModal() {
		showCancelModal = false;
	}

	// Lifecycle
	onDestroy(() => {
		// Cleanup
		if (pressTimeout) clearTimeout(pressTimeout);
		if (halfwayTimeout) clearTimeout(halfwayTimeout);
		if (durationInterval) clearInterval(durationInterval);
		if (pressAnimationId) cancelAnimationFrame(pressAnimationId);
		stopRotationAnimation();

		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
		}
	});

	// Watch for recording status changes
	$effect(() => {
		if (isRecording && !isPaused) {
			console.log('Starting rotation animation');
			startRotationAnimation();
		} else {
			console.log('Stopping rotation animation');
			stopRotationAnimation();
		}

		if (!isRecording && !isPaused) {
			// Reset animations when stopped/idle
			rotation = 0;
			pressRotation = 0;
			animateFillRadius(0, 400);
		}
	});
</script>

<div class="flex flex-col items-center justify-center">
	<!-- Main Recording Button -->
	<div class="relative">
		<button
			on:mousedown={handlePressIn}
			on:mouseup={handlePressOut}
			on:mouseleave={handlePressOut}
			disabled={isPaused}
			class="relative overflow-hidden rounded-full border-[6px] bg-content transition-all duration-200 hover:bg-content-hover"
			style="
				width: {size}px;
				height: {size}px;
				border-color: {borderColor};
				transform: scale({scale});
				cursor: {isPaused ? 'not-allowed' : 'pointer'};
			"
		>
			<!-- Background fill when recording -->
			{#if isRecording}
				<div
					class="absolute inset-0 rounded-full transition-all duration-300"
					style="background-color: {themeColor};"
				></div>
			{/if}

			<!-- Radial fill animation (for start/stop transition) -->
			{#if fillRadius > 0 && !isRecording}
				<div
					class="absolute rounded-full"
					style="
						width: {fillRadius * size * 1.1}px;
						height: {fillRadius * size * 1.1}px;
						background-color: {themeColor};
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						opacity: {fillRadius};
					"
				></div>
			{/if}

			<!-- Memoro Logo with rotation -->
			<div
				class="absolute inset-0 flex items-center justify-center"
				style="transform: rotate({rotation + pressRotation}deg);"
			>
				<svg
					width={size * 0.42}
					height={size * 0.42}
					viewBox="0 0 280 280"
					fill={isRecording ? '#FFFFFF' : themeColor}
				>
					<!-- Memoro Logo -->
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M280 140C280 217.32 217.32 280 140 280C62.6801 280 0 217.32 0 140C0 62.6801 62.6801 0 140 0C217.32 0 280 62.6801 280 140ZM247.988 140C247.988 199.64 199.64 241.988 140 241.988C80.3598 241.988 32.0118 199.64 32.0118 140C32.0118 111.918 36.7308 95.3397 54.3005 76.1331C58.5193 71.5212 70.5 63 79.3937 74.511L119.781 131.788C134.5 149 149 147 160.218 131.788L200.605 74.5101C208 64 221.48 71.5203 225.699 76.1321C243.269 95.3388 247.988 111.918 247.988 140Z"
					/>
				</svg>
			</div>
		</button>
	</div>

	<!-- Timer Display -->
	{#if isRecording || isPaused}
		<div class="absolute animate-fade-in" style="top: {size + 20}px;">
			<p class="font-mono text-lg font-semibold text-theme">
				{formatDuration($recording.duration)}
			</p>
		</div>
	{/if}

	<!-- Control Buttons (Pause/Resume, Cancel) - positioned to the right like mobile app -->
	{#if isRecording || isPaused}
		<div
			class="absolute right-0 flex flex-col gap-5 animate-fade-in"
			style="top: 50%; transform: translate(calc(100% + 40px), -50%);"
		>
			<!-- Pause/Resume Button -->
			<button
				on:click={isPaused ? resumeRecording : pauseRecording}
				class="flex h-14 w-14 items-center justify-center rounded-full border-2 border-theme bg-content shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95"
				title={isPaused ? $t('record.resume') : $t('record.pause')}
			>
				{#if isPaused}
					<!-- Play Icon -->
					<svg class="h-6 w-6 text-theme" fill="currentColor" viewBox="0 0 24 24">
						<path d="M8 5v14l11-7z" />
					</svg>
				{:else}
					<!-- Pause Icon -->
					<svg class="h-6 w-6 text-theme" fill="currentColor" viewBox="0 0 24 24">
						<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
					</svg>
				{/if}
			</button>

			<!-- Cancel Button -->
			<button
				on:click={handleCancelRecording}
				class="flex h-14 w-14 items-center justify-center rounded-full border-2 border-theme bg-content shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95"
				title={$t('record.cancel')}
			>
				<!-- X Icon -->
				<svg
					class="h-6 w-6 text-theme"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					stroke-width="2.5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/if}
</div>

<!-- Cancel Recording Modal -->
{#if showCancelModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="mx-4 w-full max-w-sm rounded-2xl border border-theme bg-content p-6 shadow-2xl">
			<!-- Modal Header -->
			<h3 class="text-lg font-semibold text-theme">
				{$t('record.cancel_title')}
			</h3>

			<!-- Modal Message -->
			<p class="mt-3 text-sm text-theme-secondary leading-relaxed">
				{$t('record.cancel_message')}
			</p>

			<!-- Modal Buttons -->
			<div class="mt-6 flex gap-3">
				<button
					on:click={closeCancelModal}
					class="flex-1 rounded-lg border border-theme bg-content px-4 py-2.5 text-sm font-medium text-theme transition-colors hover:bg-menu-hover"
				>
					{$t('record.cancel_abort')}
				</button>
				<button
					on:click={confirmCancelRecording}
					class="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
				>
					{$t('record.cancel_confirm')}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>
