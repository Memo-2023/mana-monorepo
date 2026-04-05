<script lang="ts">
	import { matrixStore, type SimpleCall } from '$lib/matrix';
	import {
		PhoneDisconnect,
		Microphone,
		MicrophoneSlash,
		VideoCamera,
		VideoCameraSlash,
		Screencast,
		User,
	} from '@mana/shared-icons';
	import { onDestroy } from 'svelte';

	interface Props {
		call: SimpleCall;
		onHangup?: () => void;
	}

	let { call, onHangup }: Props = $props();

	// Video refs need to work with bind:this - not reactive
	let localVideoRef: HTMLVideoElement | undefined = $state();
	let remoteVideoRef: HTMLVideoElement | undefined = $state();
	let callDuration = $state(0);
	let durationInterval: ReturnType<typeof setInterval> | null = null;

	// Start duration timer when call connects
	$effect(() => {
		if (call.state === 'connected' && !durationInterval) {
			durationInterval = setInterval(() => {
				callDuration++;
			}, 1000);
		}
	});

	// Attach local stream to video element
	$effect(() => {
		if (localVideoRef && call.localStream) {
			localVideoRef.srcObject = call.localStream;
		}
	});

	// Attach remote stream to video element
	$effect(() => {
		if (remoteVideoRef && call.remoteStream) {
			remoteVideoRef.srcObject = call.remoteStream;
		}
	});

	onDestroy(() => {
		if (durationInterval) {
			clearInterval(durationInterval);
		}
	});

	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	function handleMicToggle() {
		matrixStore.toggleMicMute();
	}

	function handleCameraToggle() {
		matrixStore.toggleCameraMute();
	}

	async function handleScreenShare() {
		await matrixStore.toggleScreenShare();
	}

	function handleHangup() {
		matrixStore.hangupCall();
		onHangup?.();
	}

	function getStateText(state: string): string {
		switch (state) {
			case 'invite_sent':
				return 'Anrufen...';
			case 'ringing':
				return 'Klingelt...';
			case 'connecting':
				return 'Verbinden...';
			case 'connected':
				return formatDuration(callDuration);
			case 'ended':
				return 'Beendet';
			default:
				return 'Verbinden...';
		}
	}
</script>

<div class="fixed inset-0 z-[100] bg-zinc-900 flex flex-col">
	<!-- Header -->
	<div class="flex items-center justify-between p-4 bg-black/30">
		<div class="flex items-center gap-3">
			{#if call.opponentAvatar}
				<img
					src={call.opponentAvatar}
					alt={call.opponentName}
					class="w-10 h-10 rounded-full object-cover"
				/>
			{:else}
				<div
					class="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
				>
					<User class="w-5 h-5 text-white" />
				</div>
			{/if}
			<div>
				<p class="font-medium text-white">{call.opponentName || 'Unbekannt'}</p>
				<p class="text-sm text-white/70 flex items-center gap-2">
					<span>{call.type === 'video' ? 'Videoanruf' : 'Sprachanruf'} · {getStateText(call.state)}</span>
					{#if call.isScreenSharing}
						<span class="flex items-center gap-1 px-2 py-0.5 bg-violet-500/30 rounded-full text-violet-300 text-xs">
							<Screencast class="w-3 h-3" />
							Bildschirmfreigabe
						</span>
					{/if}
				</p>
			</div>
		</div>
	</div>

	<!-- Video area -->
	<div class="flex-1 relative">
		{#if call.type === 'video'}
			<!-- Remote video (full screen) -->
			<!-- svelte-ignore a11y_media_has_caption -->
			<video bind:this={remoteVideoRef} autoplay playsinline class="w-full h-full object-cover"
			></video>

			<!-- Local video (picture-in-picture) -->
			<div
				class="absolute bottom-24 right-4 w-32 h-48 rounded-xl overflow-hidden shadow-xl border-2 border-white/20"
			>
				<video
					bind:this={localVideoRef}
					autoplay
					playsinline
					muted
					class="w-full h-full object-cover"
				></video>
			</div>
		{:else}
			<!-- Voice call - show avatar -->
			<div class="flex flex-col items-center justify-center h-full">
				{#if call.opponentAvatar}
					<img
						src={call.opponentAvatar}
						alt={call.opponentName}
						class="w-32 h-32 rounded-full object-cover mb-6 ring-4 ring-white/20"
					/>
				{:else}
					<div
						class="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 ring-4 ring-white/20"
					>
						<User class="w-16 h-16 text-white" />
					</div>
				{/if}
				<p class="text-2xl font-semibold text-white">{call.opponentName || 'Unbekannt'}</p>
				<p class="text-lg text-white/70 mt-2">{getStateText(call.state)}</p>
			</div>
		{/if}
	</div>

	<!-- Controls -->
	<div
		class="flex items-center justify-center gap-6 p-8 bg-gradient-to-t from-black/50 to-transparent"
	>
		<!-- Mute mic -->
		<button
			class="w-14 h-14 rounded-full flex items-center justify-center transition-colors
			       {call.isMicMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'}"
			onclick={handleMicToggle}
			title={call.isMicMuted ? 'Mikrofon aktivieren' : 'Mikrofon stumm'}
		>
			{#if call.isMicMuted}
				<MicrophoneSlash class="w-6 h-6 text-white" />
			{:else}
				<Microphone class="w-6 h-6 text-white" />
			{/if}
		</button>

		<!-- Mute camera (video calls only) -->
		{#if call.type === 'video'}
			<button
				class="w-14 h-14 rounded-full flex items-center justify-center transition-colors
				       {call.isCameraMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'}"
				onclick={handleCameraToggle}
				title={call.isCameraMuted ? 'Kamera aktivieren' : 'Kamera aus'}
			>
				{#if call.isCameraMuted}
					<VideoCameraSlash class="w-6 h-6 text-white" />
				{:else}
					<VideoCamera class="w-6 h-6 text-white" />
				{/if}
			</button>

			<!-- Screen share -->
			<button
				class="w-14 h-14 rounded-full flex items-center justify-center transition-colors
				       {call.isScreenSharing ? 'bg-violet-500 hover:bg-violet-600' : 'bg-white/20 hover:bg-white/30'}"
				onclick={handleScreenShare}
				title={call.isScreenSharing ? 'Bildschirmfreigabe beenden' : 'Bildschirm freigeben'}
			>
				<Screencast class="w-6 h-6 text-white" />
			</button>
		{/if}

		<!-- Hang up -->
		<button
			class="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
			onclick={handleHangup}
			title="Auflegen"
		>
			<PhoneDisconnect class="w-7 h-7 text-white" />
		</button>
	</div>
</div>
