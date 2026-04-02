<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { recording } from '$lib/stores/recording';
	import Text from '$lib/components/atoms/Text.svelte';

	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let stream: MediaStream | null = null;
	let durationInterval: number;
	let startTime: number = 0;

	let hasPermission = $state(false);
	let permissionDenied = $state(false);

	onMount(async () => {
		await checkPermissions();
	});

	onDestroy(() => {
		stopRecording();
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
		}
		if (durationInterval) {
			clearInterval(durationInterval);
		}
	});

	async function checkPermissions() {
		try {
			const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
			hasPermission = result.state === 'granted';
			permissionDenied = result.state === 'denied';

			result.addEventListener('change', () => {
				hasPermission = result.state === 'granted';
				permissionDenied = result.state === 'denied';
			});
		} catch (error) {
			console.log('Permissions API not supported, will request on first use');
		}
	}

	async function startRecording() {
		try {
			audioChunks = [];
			recording.setError(null);

			// Request microphone access
			stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});

			hasPermission = true;
			permissionDenied = false;

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
			}, 100);
		} catch (error: any) {
			console.error('Error starting recording:', error);
			if (error.name === 'NotAllowedError') {
				permissionDenied = true;
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
			clearInterval(durationInterval);
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
			}, 100);
		}
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
			clearInterval(durationInterval);

			// Stop all tracks
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
		}
	}

	function formatDuration(seconds: number) {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function reset() {
		stopRecording();
		recording.reset();
		audioChunks = [];
	}
</script>

<div class="space-y-6">
	<!-- Permission Status -->
	{#if permissionDenied}
		<div class="card bg-red-50 dark:bg-red-900/20">
			<div class="flex items-start gap-3">
				<svg
					class="h-6 w-6 text-red-600 dark:text-red-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<div>
					<Text variant="body" weight="semibold" class="text-red-800 dark:text-red-300"
						>Microphone Permission Required</Text
					>
					<Text variant="small" class="mt-1 text-red-700 dark:text-red-400">
						Please enable microphone access in your browser settings to record audio.
					</Text>
				</div>
			</div>
		</div>
	{/if}

	{#if $recording.error}
		<div class="card bg-red-50 dark:bg-red-900/20">
			<Text variant="body" class="text-red-800 dark:text-red-300">{$recording.error}</Text>
		</div>
	{/if}

	<!-- Recording Interface -->
	<div class="card">
		<div class="text-center">
			<!-- Visual Indicator -->
			<div class="mb-6 flex justify-center">
				{#if $recording.status === 'recording'}
					<div class="relative">
						<div class="h-32 w-32 rounded-full bg-red-600 animate-pulse"></div>
						<div class="absolute inset-0 flex items-center justify-center">
							<svg class="h-16 w-16 text-white" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
								/>
								<path
									d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
								/>
							</svg>
						</div>
					</div>
				{:else if $recording.status === 'paused'}
					<div class="h-32 w-32 rounded-full bg-yellow-600 flex items-center justify-center">
						<svg class="h-16 w-16 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
						</svg>
					</div>
				{:else if $recording.status === 'stopped' && $recording.audioUrl}
					<div class="h-32 w-32 rounded-full bg-green-600 flex items-center justify-center">
						<svg class="h-16 w-16 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
						</svg>
					</div>
				{:else}
					<div
						class="h-32 w-32 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center"
					>
						<svg class="h-16 w-16 text-theme-secondary" fill="currentColor" viewBox="0 0 24 24">
							<path
								d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
							/>
							<path
								d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
							/>
						</svg>
					</div>
				{/if}
			</div>

			<!-- Duration -->
			<Text variant="large" weight="bold" class="mb-6 text-4xl tabular-nums">
				{formatDuration($recording.duration)}
			</Text>

			<!-- Status Text -->
			<Text variant="large" class="mb-6 text-theme-secondary">
				{#if $recording.status === 'idle'}
					Ready to record
				{:else if $recording.status === 'recording'}
					Recording...
				{:else if $recording.status === 'paused'}
					Recording paused
				{:else if $recording.status === 'stopped'}
					Recording complete
				{:else if $recording.status === 'uploading'}
					Uploading...
				{/if}
			</Text>

			<!-- Controls -->
			<div class="flex justify-center gap-4">
				{#if $recording.status === 'idle'}
					<button
						onclick={startRecording}
						disabled={permissionDenied}
						class="btn-primary px-8 py-3 text-lg"
					>
						🎤 Start Recording
					</button>
				{:else if $recording.status === 'recording'}
					<button onclick={pauseRecording} class="btn-secondary px-6 py-3"> ⏸️ Pause </button>
					<button onclick={stopRecording} class="btn-primary px-6 py-3 bg-red-600 hover:bg-red-700">
						⏹️ Stop
					</button>
				{:else if $recording.status === 'paused'}
					<button onclick={resumeRecording} class="btn-primary px-6 py-3"> ▶️ Resume </button>
					<button onclick={stopRecording} class="btn-secondary px-6 py-3"> ⏹️ Stop </button>
				{:else if $recording.status === 'stopped'}
					<button onclick={reset} class="btn-secondary px-6 py-3"> 🔄 Record Again </button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Playback -->
	{#if $recording.status === 'stopped' && $recording.audioUrl}
		<div class="card">
			<Text variant="large" weight="semibold" class="mb-4">Preview Recording</Text>
			<audio controls src={$recording.audioUrl} class="w-full"></audio>
		</div>
	{/if}
</div>
