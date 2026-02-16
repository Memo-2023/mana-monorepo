<script lang="ts">
	import { onboardingStore } from '$lib/stores/onboarding.svelte';
	import WelcomeStep from './steps/WelcomeStep.svelte';
	import ProfileStep from './steps/ProfileStep.svelte';
	import AppsStep from './steps/AppsStep.svelte';
	import CreditsStep from './steps/CreditsStep.svelte';
	import CompleteStep from './steps/CompleteStep.svelte';

	interface Props {
		onComplete: () => void;
	}

	let { onComplete }: Props = $props();

	const STEPS = [
		{ id: 'welcome', label: 'Willkommen', component: WelcomeStep },
		{ id: 'profile', label: 'Profil', component: ProfileStep },
		{ id: 'apps', label: 'Apps', component: AppsStep },
		{ id: 'credits', label: 'Credits', component: CreditsStep },
		{ id: 'complete', label: 'Fertig', component: CompleteStep },
	];

	let currentStep = $derived(onboardingStore.currentStep);
	let currentStepData = $derived(STEPS[currentStep] || STEPS[0]);
	let isFirstStep = $derived(currentStep === 0);
	let isLastStep = $derived(currentStep === STEPS.length - 1);
	let progress = $derived(((currentStep + 1) / STEPS.length) * 100);

	function handleNext() {
		if (isLastStep) {
			onboardingStore.complete();
			onComplete();
		} else {
			onboardingStore.completeStep(currentStepData.id);
			onboardingStore.nextStep();
		}
	}

	function handlePrev() {
		onboardingStore.prevStep();
	}

	function handleSkip() {
		onboardingStore.skip();
		onComplete();
	}

	function handleStepClick(index: number) {
		// Only allow going to completed steps or the next step
		if (index <= currentStep) {
			onboardingStore.goToStep(index);
		}
	}
</script>

<!-- Backdrop -->
<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
	<!-- Modal Container - uses surface-elevated-2 for proper elevation hierarchy -->
	<div
		class="bg-surface-elevated-2 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border"
	>
		<!-- Header with progress -->
		<header class="border-b px-5 py-4 flex-shrink-0">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center gap-3">
					<div
						class="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center"
					>
						<span class="text-lg font-semibold text-primary-foreground">M</span>
					</div>
					<div>
						<h1 class="font-semibold">Willkommen bei ManaCore</h1>
						<p class="text-xs text-muted-foreground">
							Schritt {currentStep + 1} von {STEPS.length}
						</p>
					</div>
				</div>
				<button
					onclick={handleSkip}
					class="text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					Überspringen
				</button>
			</div>

			<!-- Progress bar -->
			<div class="h-1 bg-muted rounded-full overflow-hidden">
				<div
					class="h-full bg-primary transition-all duration-300 ease-out rounded-full"
					style="width: {progress}%"
				></div>
			</div>

			<!-- Step indicators (compact) -->
			<div class="flex justify-between mt-2">
				{#each STEPS as step, index}
					<button
						onclick={() => handleStepClick(index)}
						disabled={index > currentStep}
						class="flex flex-col items-center gap-0.5 group"
					>
						<div
							class="h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium transition-all
								{index < currentStep
								? 'bg-primary text-primary-foreground'
								: index === currentStep
									? 'bg-primary/20 text-primary border-2 border-primary'
									: 'bg-muted text-muted-foreground'}"
						>
							{#if index < currentStep}
								<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							{:else}
								{index + 1}
							{/if}
						</div>
						<span
							class="text-[10px] {index === currentStep
								? 'text-foreground font-medium'
								: 'text-muted-foreground'} hidden sm:block"
						>
							{step.label}
						</span>
					</button>
				{/each}
			</div>
		</header>

		<!-- Step content -->
		<main class="flex-1 overflow-y-auto px-5 py-4">
			{#if currentStepData.id === 'welcome'}
				<WelcomeStep />
			{:else if currentStepData.id === 'profile'}
				<ProfileStep />
			{:else if currentStepData.id === 'apps'}
				<AppsStep />
			{:else if currentStepData.id === 'credits'}
				<CreditsStep />
			{:else if currentStepData.id === 'complete'}
				<CompleteStep />
			{/if}
		</main>

		<!-- Footer with navigation -->
		<footer class="border-t px-5 py-3 flex-shrink-0">
			<div class="flex justify-between">
				<button
					onclick={handlePrev}
					disabled={isFirstStep}
					class="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors disabled:opacity-0 disabled:pointer-events-none"
				>
					Zurück
				</button>
				<button
					onclick={handleNext}
					class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
				>
					{isLastStep ? "Los geht's!" : 'Weiter'}
				</button>
			</div>
		</footer>
	</div>
</div>
