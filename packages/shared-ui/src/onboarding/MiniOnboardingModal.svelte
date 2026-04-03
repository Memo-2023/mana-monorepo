<script lang="ts">
	import type {
		AppOnboardingStore,
		AppOnboardingSelectStep,
		AppOnboardingToggleStep,
	} from './types';

	interface Props {
		store: AppOnboardingStore;
		appName: string;
		appEmoji?: string;
	}

	let { store, appName, appEmoji = '🚀' }: Props = $props();

	function handleNext() {
		if (store.isLastStep) {
			store.complete();
		} else {
			store.next();
		}
	}

	function handlePrev() {
		store.prev();
	}

	function handleSkip() {
		store.skip();
	}

	function selectOption(stepId: string, optionId: string) {
		store.setPreference(stepId, optionId);
	}

	function toggleOption(stepId: string) {
		const currentValue = store.preferences[stepId] ?? false;
		store.setPreference(stepId, !currentValue);
	}
</script>

<!-- Backdrop -->
<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
	<!-- Modal Container -->
	<div
		class="bg-surface-elevated-2 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border"
	>
		<!-- Header -->
		<header class="border-b px-5 py-4 flex-shrink-0">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center gap-3">
					<div
						class="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center"
					>
						<span class="text-xl">{appEmoji}</span>
					</div>
					<div>
						<h1 class="font-semibold text-sm">{appName} einrichten</h1>
						<p class="text-xs text-muted-foreground">
							Schritt {store.currentStep + 1} von {store.totalSteps}
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

			<!-- Step dots -->
			<div class="flex items-center gap-1.5">
				{#each Array(store.totalSteps) as _, i}
					<div
						class="h-1.5 rounded-full transition-all duration-300 {i <= store.currentStep
							? 'bg-primary'
							: 'bg-muted'} {i === store.currentStep ? 'w-6' : 'w-1.5'}"
					></div>
				{/each}
			</div>
		</header>

		<!-- Step content -->
		<main class="flex-1 overflow-y-auto px-5 py-6">
			{#if store.currentStepConfig}
				{@const step = store.currentStepConfig}

				<div class="text-center">
					<!-- Question -->
					<h2 class="text-lg font-bold mb-2">{step.question}</h2>
					{#if step.description}
						<p class="text-sm text-muted-foreground mb-5">{step.description}</p>
					{/if}

					<!-- Step content based on type -->
					<div class="max-w-sm mx-auto">
						{#if step.type === 'select'}
							{@const selectStep = step as AppOnboardingSelectStep}
							<div class="space-y-2">
								{#each selectStep.options as option}
									{@const isSelected = store.preferences[step.id] === option.id}
									<button
										onclick={() => selectOption(step.id, option.id)}
										class="w-full p-3 rounded-xl border-2 transition-all text-left {isSelected
											? 'border-primary bg-primary/15 shadow-sm shadow-primary/20'
											: 'border-border hover:border-primary/50 bg-surface-elevated-1'}"
									>
										<div class="flex items-center gap-3">
											{#if option.emoji}
												<span class="text-xl">{option.emoji}</span>
											{/if}
											<div class="flex-1">
												<p class="font-medium text-sm">{option.label}</p>
												{#if option.description}
													<p class="text-xs text-muted-foreground">{option.description}</p>
												{/if}
											</div>
											{#if isSelected}
												<svg
													class="w-5 h-5 text-primary flex-shrink-0"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													stroke-width="2.5"
												>
													<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
												</svg>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						{:else if step.type === 'toggle'}
							{@const toggleStep = step as AppOnboardingToggleStep}
							{@const isEnabled = store.preferences[step.id] ?? toggleStep.defaultValue ?? false}
							<button
								onclick={() => toggleOption(step.id)}
								class="w-full p-4 rounded-xl border-2 transition-all {isEnabled
									? 'border-primary bg-primary/10'
									: 'border-border bg-surface-elevated-1'}"
							>
								<div class="flex items-center justify-between">
									<span class="font-medium text-sm">
										{isEnabled
											? toggleStep.enabledLabel || 'Aktiviert'
											: toggleStep.disabledLabel || 'Deaktiviert'}
									</span>
									<div
										class="relative w-11 h-6 rounded-full transition-colors {isEnabled
											? 'bg-primary'
											: 'bg-muted'}"
									>
										<div
											class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform {isEnabled
												? 'translate-x-5'
												: 'translate-x-0'}"
										></div>
									</div>
								</div>
							</button>
						{:else if step.type === 'info'}
							{#if step.bullets}
								<ul class="text-left space-y-2">
									{#each step.bullets as bullet}
										<li class="flex items-start gap-2 text-sm">
											<span class="text-primary mt-0.5">•</span>
											<span class="text-muted-foreground">{bullet}</span>
										</li>
									{/each}
								</ul>
							{/if}
						{/if}
					</div>
				</div>
			{/if}
		</main>

		<!-- Footer with navigation -->
		<footer class="border-t px-5 py-3 flex-shrink-0">
			<div class="flex justify-between">
				{#if store.isFirstStep}
					<div></div>
				{:else}
					<button
						onclick={handlePrev}
						class="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
					>
						Zurück
					</button>
				{/if}
				<button
					onclick={handleNext}
					disabled={store.saving}
					class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
				>
					{#if store.saving}
						Speichern...
					{:else if store.isLastStep}
						Fertig
					{:else}
						Weiter
					{/if}
				</button>
			</div>
		</footer>
	</div>
</div>
