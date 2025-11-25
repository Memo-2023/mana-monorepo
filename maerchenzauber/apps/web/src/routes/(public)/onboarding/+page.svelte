<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	// Current step in onboarding
	let currentStep = $state(0);

	// Onboarding slides
	const slides = [
		{
			title: 'Willkommen bei Märchenzauber',
			description: 'Erstelle personalisierte Geschichten für deine Kinder mit der Kraft der KI.',
			icon: 'sparkles',
			color: 'from-pink-500 to-purple-600'
		},
		{
			title: 'Erstelle Charaktere',
			description: 'Gestalte einzigartige Charaktere mit Namen, Aussehen und Persönlichkeit - oder nutze dein Kind als Hauptfigur!',
			icon: 'users',
			color: 'from-purple-500 to-indigo-600'
		},
		{
			title: 'Generiere Geschichten',
			description: 'Wähle ein Thema, einen Stil und lass die KI magische Geschichten mit wunderschönen Illustrationen erstellen.',
			icon: 'book',
			color: 'from-indigo-500 to-blue-600'
		},
		{
			title: 'Teile dein Feedback',
			description: 'Hilf uns, Märchenzauber zu verbessern! Stimme für Features ab und teile deine Ideen mit der Community.',
			icon: 'heart',
			color: 'from-rose-500 to-pink-600'
		}
	];

	function nextStep() {
		if (currentStep < slides.length - 1) {
			currentStep++;
		} else {
			completeOnboarding();
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	function skipOnboarding() {
		completeOnboarding();
	}

	function completeOnboarding() {
		if (browser) {
			localStorage.setItem('maerchenzauber-onboarding-complete', 'true');
		}
		goto('/login');
	}

	// Check if onboarding was already completed
	$effect(() => {
		if (browser) {
			const completed = localStorage.getItem('maerchenzauber-onboarding-complete');
			if (completed === 'true') {
				goto('/login');
			}
		}
	});
</script>

<svelte:head>
	<title>Willkommen | Märchenzauber</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
	<!-- Skip button -->
	<div class="absolute right-4 top-4">
		<button
			onclick={skipOnboarding}
			class="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
		>
			Überspringen
		</button>
	</div>

	<!-- Main content -->
	<div class="flex flex-1 flex-col items-center justify-center px-6 py-12">
		<!-- Icon -->
		<div class="mb-8 flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br {slides[currentStep].color} shadow-2xl">
			{#if slides[currentStep].icon === 'sparkles'}
				<svg class="h-16 w-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
				</svg>
			{:else if slides[currentStep].icon === 'users'}
				<svg class="h-16 w-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
			{:else if slides[currentStep].icon === 'book'}
				<svg class="h-16 w-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
			{:else if slides[currentStep].icon === 'heart'}
				<svg class="h-16 w-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
				</svg>
			{/if}
		</div>

		<!-- Text content -->
		<div class="max-w-md text-center">
			<h1 class="mb-4 text-3xl font-bold text-gray-800 dark:text-white">
				{slides[currentStep].title}
			</h1>
			<p class="text-lg text-gray-600 dark:text-gray-300">
				{slides[currentStep].description}
			</p>
		</div>

		<!-- Progress dots -->
		<div class="mt-12 flex gap-2">
			{#each slides as _, index}
				<button
					onclick={() => (currentStep = index)}
					class="h-2.5 rounded-full transition-all duration-300 {currentStep === index ? 'w-8 bg-gradient-to-r ' + slides[currentStep].color : 'w-2.5 bg-gray-300 dark:bg-gray-600'}"
					aria-label="Gehe zu Schritt {index + 1}"
				></button>
			{/each}
		</div>
	</div>

	<!-- Navigation buttons -->
	<div class="flex items-center justify-between px-6 pb-12">
		<button
			onclick={prevStep}
			class="rounded-xl px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-0 dark:text-gray-400 dark:hover:text-gray-200"
			disabled={currentStep === 0}
		>
			Zurück
		</button>

		<button
			onclick={nextStep}
			class="rounded-xl bg-gradient-to-r {slides[currentStep].color} px-8 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
		>
			{currentStep === slides.length - 1 ? 'Loslegen' : 'Weiter'}
		</button>
	</div>
</div>
