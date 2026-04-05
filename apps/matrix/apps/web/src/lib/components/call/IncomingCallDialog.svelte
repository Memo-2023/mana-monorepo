<script lang="ts">
	import { matrixStore, type SimpleCall } from '$lib/matrix';
	import { Phone, PhoneDisconnect, VideoCamera, User } from '@mana/shared-icons';

	interface Props {
		call: SimpleCall;
		onAnswer?: () => void;
		onReject?: () => void;
	}

	let { call, onAnswer, onReject }: Props = $props();

	function handleAnswer() {
		matrixStore.answerCall();
		onAnswer?.();
	}

	function handleReject() {
		matrixStore.rejectCall();
		onReject?.();
	}
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
	<div class="bg-zinc-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 animate-bounce-in">
		<!-- Caller info -->
		<div class="flex flex-col items-center text-center mb-8">
			{#if call.opponentAvatar}
				<img
					src={call.opponentAvatar}
					alt={call.opponentName}
					class="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-violet-500/50 animate-pulse"
				/>
			{:else}
				<div
					class="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 ring-4 ring-violet-500/50 animate-pulse"
				>
					<User class="w-12 h-12 text-white" />
				</div>
			{/if}
			<p class="text-xl font-semibold text-white">{call.opponentName || 'Unbekannt'}</p>
			<p class="text-white/70 mt-1">
				{call.type === 'video' ? 'Eingehender Videoanruf' : 'Eingehender Sprachanruf'}
			</p>
		</div>

		<!-- Call type indicator -->
		<div class="flex items-center justify-center gap-2 mb-8">
			{#if call.type === 'video'}
				<VideoCamera class="w-5 h-5 text-violet-400" />
				<span class="text-violet-400 text-sm">Video</span>
			{:else}
				<Phone class="w-5 h-5 text-green-400" />
				<span class="text-green-400 text-sm">Audio</span>
			{/if}
		</div>

		<!-- Action buttons -->
		<div class="flex items-center justify-center gap-8">
			<!-- Reject -->
			<button
				class="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-red-500/30"
				onclick={handleReject}
				title="Ablehnen"
			>
				<PhoneDisconnect class="w-7 h-7 text-white" />
			</button>

			<!-- Answer -->
			<button
				class="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-green-500/30 animate-ring"
				onclick={handleAnswer}
				title="Annehmen"
			>
				<Phone class="w-7 h-7 text-white" />
			</button>
		</div>
	</div>
</div>

<style>
	@keyframes bounce-in {
		0% {
			opacity: 0;
			transform: scale(0.8);
		}
		50% {
			transform: scale(1.05);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes ring {
		0%,
		100% {
			transform: scale(1);
		}
		10%,
		30%,
		50%,
		70%,
		90% {
			transform: scale(1.1);
		}
		20%,
		40%,
		60%,
		80% {
			transform: scale(0.95);
		}
	}

	.animate-bounce-in {
		animation: bounce-in 0.4s ease-out;
	}

	.animate-ring {
		animation: ring 2s ease-in-out infinite;
	}
</style>
