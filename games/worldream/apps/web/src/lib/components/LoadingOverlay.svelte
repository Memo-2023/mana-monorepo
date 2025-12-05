<script lang="ts">
	import { loadingStore } from '$lib/stores/loadingStore';
	import { fade, fly, scale } from 'svelte/transition';
	import { cubicOut, elasticOut } from 'svelte/easing';

	// Props - optional message for simple loading states
	interface Props {
		message?: string;
	}
	let { message }: Props = $props();

	// Reactive state from store
	let loading = $derived($loadingStore);
	let minimized = $state(false);
	let toastMode = $state(false);

	// Use store title or fallback to message prop
	let displayTitle = $derived(loading.title || message || 'Laden...');

	// Calculate overall progress
	let progress = $derived(() => {
		if (!loading.steps.length) return 0;
		const completed = loading.steps.filter((s) => s.status === 'completed').length;
		return (completed / loading.steps.length) * 100;
	});

	// Show overlay if store is loading OR if message prop is provided
	let showOverlay = $derived(loading.isLoading || !!message);
</script>

{#if showOverlay}
	<!-- Overlay -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-theme-overlay backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
	>
		<!-- Main Container with Glassmorphism (responsive) -->
		<div
			class="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-theme-border-subtle bg-theme-surface/95 shadow-2xl backdrop-blur-md sm:mx-auto {minimized
				? 'max-w-xs'
				: ''}"
			transition:fly={{ y: 50, duration: 300, easing: cubicOut }}
		>
			<!-- Header with gradient -->
			<div
				class="relative overflow-hidden border-b border-theme-border-subtle bg-gradient-to-r from-theme-primary-500/10 to-theme-primary-600/10 px-6 py-4"
			>
				<!-- Animated background pattern -->
				<div class="absolute inset-0 opacity-30">
					<div
						class="absolute -left-4 -top-4 h-24 w-24 animate-pulse rounded-full bg-gradient-to-br from-theme-primary-400 to-transparent blur-2xl"
					></div>
					<div
						class="absolute -right-4 -bottom-4 h-24 w-24 animate-pulse rounded-full bg-gradient-to-br from-theme-primary-600 to-transparent blur-2xl animation-delay-1000"
					></div>
				</div>

				<div class="relative flex items-center justify-between">
					<h2 class="text-xl font-semibold text-theme-text-primary">
						{displayTitle}
					</h2>

					<!-- Minimize button -->
					<button
						onclick={() => (minimized = !minimized)}
						class="rounded-lg p-1 text-theme-text-secondary transition-colors hover:bg-theme-interactive-hover hover:text-theme-text-primary"
						title={minimized ? 'Maximieren' : 'Minimieren'}
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							{#if minimized}
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 15l7-7 7 7"
								/>
							{:else}
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							{/if}
						</svg>
					</button>
				</div>

				<!-- Progress bar -->
				<div class="relative mt-3 h-1.5 overflow-hidden rounded-full bg-theme-border-default">
					<div
						class="absolute left-0 top-0 h-full bg-gradient-to-r from-theme-primary-500 to-theme-primary-600 transition-all duration-500 ease-out"
						style="width: {progress()}%"
					>
						<!-- Shimmer effect -->
						<div
							class="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"
						></div>
					</div>
				</div>

				<!-- Progress percentage -->
				{#if progress() > 0}
					<div class="mt-2 flex items-center justify-between text-xs">
						<span class="text-theme-text-secondary">{Math.round(progress())}% abgeschlossen</span>
						{#if loading.estimatedTime && loading.estimatedTime > Date.now()}
							<span class="text-theme-text-secondary">
								~{Math.max(1, Math.ceil((loading.estimatedTime - Date.now()) / 1000))}s verbleibend
							</span>
						{/if}
					</div>
				{/if}
			</div>

			{#if !minimized}
				<!-- Steps Container -->
				<div class="px-6 py-4" transition:scale={{ duration: 200, easing: cubicOut }}>
					<div class="space-y-3">
						{#each loading.steps as step, index}
							<div class="flex items-start space-x-3" style="animation-delay: {index * 50}ms">
								<!-- Step indicator with animations -->
								<div class="relative mt-0.5 flex-shrink-0">
									{#if step.status === 'completed'}
										<div
											class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-theme-success to-theme-success-dark shadow-lg shadow-theme-success/30"
											transition:scale={{ duration: 400, easing: elasticOut }}
										>
											<svg
												class="h-4 w-4 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												transition:scale={{ duration: 600, delay: 100, easing: elasticOut }}
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M5 13l4 4L19 7"
												/>
											</svg>
										</div>
									{:else if step.status === 'active'}
										<div class="relative flex h-7 w-7 items-center justify-center">
											<!-- Outer ring animation -->
											<div
												class="absolute inset-0 animate-ping rounded-full bg-theme-primary-400 opacity-30"
											></div>
											<!-- Inner spinning ring -->
											<div
												class="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-theme-primary-500 border-r-theme-primary-600"
											></div>
											<!-- Center dot -->
											<div
												class="relative h-3 w-3 animate-pulse rounded-full bg-gradient-to-br from-theme-primary-500 to-theme-primary-600"
											></div>
										</div>
									{:else if step.status === 'error'}
										<div
											class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-theme-error to-theme-error-dark shadow-lg shadow-theme-error/30"
											transition:scale={{ duration: 400, easing: elasticOut }}
										>
											<svg
												class="h-4 w-4 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</div>
									{:else}
										<div
											class="h-7 w-7 rounded-full border-2 border-theme-border-default bg-theme-elevated"
										></div>
									{/if}
								</div>

								<!-- Step content -->
								<div class="min-w-0 flex-1">
									<p
										class="text-sm font-medium transition-colors duration-200 {step.status ===
										'active'
											? 'text-theme-text-primary'
											: step.status === 'completed'
												? 'text-theme-text-secondary'
												: 'text-theme-text-tertiary'}"
									>
										{step.label}
									</p>
									{#if step.message}
										<p
											class="mt-1 text-xs text-theme-text-tertiary"
											transition:fade={{ duration: 200 }}
										>
											{step.message}
										</p>
									{/if}
								</div>
							</div>

							<!-- Animated connection line -->
							{#if index < loading.steps.length - 1}
								<div class="relative ml-3.5 h-4">
									<div
										class="absolute left-0 w-px bg-theme-border-default {step.status === 'completed'
											? 'bg-gradient-to-b from-theme-success to-theme-success/50'
											: ''}"
										style="height: 100%; transform-origin: top; transition: all 0.3s ease-out;"
									></div>
									{#if step.status === 'active'}
										<div
											class="absolute left-0 w-px animate-flow bg-gradient-to-b from-theme-primary-500 to-transparent"
											style="height: 100%;"
										></div>
									{/if}
								</div>
							{/if}
						{/each}
					</div>

					<!-- Error message -->
					{#if loading.error}
						<div
							class="mt-4 rounded-lg bg-theme-error/10 border border-theme-error/20 p-3"
							transition:scale={{ duration: 200 }}
						>
							<p class="text-sm text-theme-error">{loading.error}</p>
						</div>
					{/if}

					<!-- Fun Fact -->
					{#if loading.funFact && !loading.error}
						<div
							class="mt-4 rounded-lg bg-gradient-to-r from-theme-primary-500/5 to-theme-primary-600/5 border border-theme-border-subtle p-3"
							transition:fade={{ duration: 300 }}
						>
							<p class="text-xs italic text-theme-text-secondary">
								{loading.funFact}
							</p>
						</div>
					{/if}
				</div>

				<!-- Footer actions -->
				{#if loading.error}
					<div class="rounded-b-2xl bg-theme-elevated px-6 py-3">
						<button
							onclick={() => loadingStore.reset()}
							class="w-full rounded-lg border border-theme-border-default bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text-primary transition-all hover:bg-theme-interactive-hover hover:shadow-md"
						>
							Schließen
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}

<style>
	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(200%);
		}
	}

	@keyframes flow {
		0% {
			opacity: 0;
			transform: translateY(-100%);
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateY(100%);
		}
	}

	.animate-shimmer {
		animation: shimmer 2s infinite;
	}

	.animate-flow {
		animation: flow 1.5s ease-in-out infinite;
	}

	.animation-delay-1000 {
		animation-delay: 1s;
	}
</style>
