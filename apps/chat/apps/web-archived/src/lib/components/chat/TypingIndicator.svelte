<script lang="ts">
	import { Robot } from '@manacore/shared-icons';
</script>

<div class="flex gap-3 flex-row mb-6 animate-fade-in">
	<!-- Avatar -->
	<div
		class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm
			   bg-gradient-to-br from-violet-500 to-purple-600 text-white"
	>
		<Robot size={18} weight="bold" />
	</div>

	<!-- Typing Bubble -->
	<div class="flex flex-col items-start max-w-[75%]">
		<div
			class="relative px-4 py-3 shadow-sm
				   bg-white dark:bg-white/10 text-foreground border border-black/5 dark:border-white/10 rounded-2xl rounded-tl-md"
		>
			<div class="flex items-center gap-1.5">
				<div
					class="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
					style="animation-delay: 0ms"
				></div>
				<div
					class="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
					style="animation-delay: 150ms"
				></div>
				<div
					class="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
					style="animation-delay: 300ms"
				></div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}

	@keyframes bounce {
		0%,
		60%,
		100% {
			transform: translateY(0);
		}
		30% {
			transform: translateY(-4px);
		}
	}

	.animate-bounce {
		animation: bounce 1s infinite;
	}
</style>
