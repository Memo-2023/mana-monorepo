<script lang="ts">
	// Credits explanation step
</script>

<div class="max-w-xl mx-auto">
	<div class="text-center mb-8">
		<div
			class="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 items-center justify-center mb-4 shadow-lg shadow-orange-500/25"
		>
			<svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
		<h2 class="text-2xl font-bold mb-2">Das Credits-System</h2>
		<p class="text-muted-foreground">Einfach und transparent für alle AI-Features.</p>
	</div>

	<div class="space-y-4">
		<!-- How it works -->
		<div class="p-5 rounded-xl bg-card border">
			<h3 class="font-semibold mb-3 flex items-center gap-2">
				<span
					class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm text-primary"
					>1</span
				>
				So funktioniert's
			</h3>
			<ul class="space-y-2 text-sm text-muted-foreground">
				<li class="flex items-start gap-2">
					<svg
						class="h-4 w-4 text-green-500 mt-0.5 shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span>Du hast ein Credit-Guthaben für alle Mana-Apps</span>
				</li>
				<li class="flex items-start gap-2">
					<svg
						class="h-4 w-4 text-green-500 mt-0.5 shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span>AI-Features wie Chat, Bildgenerierung etc. kosten Credits</span>
				</li>
				<li class="flex items-start gap-2">
					<svg
						class="h-4 w-4 text-green-500 mt-0.5 shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span>Einfache Preisregel: <strong class="text-foreground">1 Mana = 1 Cent</strong></span>
				</li>
			</ul>
		</div>

		<!-- Free credits -->
		<div
			class="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800"
		>
			<h3 class="font-semibold mb-3 flex items-center gap-2">
				<span
					class="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-sm text-white"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
						/>
					</svg>
				</span>
				Gratis-Credits
			</h3>
			<div class="grid grid-cols-2 gap-4">
				<div class="bg-white dark:bg-background rounded-lg p-3 text-center">
					<div class="text-2xl font-bold text-green-600">150</div>
					<div class="text-xs text-muted-foreground">Willkommensbonus</div>
				</div>
				<div class="bg-white dark:bg-background rounded-lg p-3 text-center">
					<div class="text-2xl font-bold text-green-600">+5</div>
					<div class="text-xs text-muted-foreground">Täglich gratis</div>
				</div>
			</div>
		</div>

		<!-- Credit packages -->
		<div class="p-5 rounded-xl bg-card border">
			<h3 class="font-semibold mb-3 flex items-center gap-2">
				<span
					class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm text-primary"
					>2</span
				>
				Credit-Pakete
			</h3>
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
				<div class="p-3 rounded-lg bg-muted text-center">
					<div class="font-bold">100</div>
					<div class="text-xs text-muted-foreground">€1</div>
				</div>
				<div class="p-3 rounded-lg bg-muted text-center">
					<div class="font-bold">500</div>
					<div class="text-xs text-muted-foreground">€5</div>
				</div>
				<div class="p-3 rounded-lg bg-muted text-center">
					<div class="font-bold">1.500</div>
					<div class="text-xs text-muted-foreground">€15</div>
				</div>
				<div class="p-3 rounded-lg bg-muted text-center">
					<div class="font-bold">5.000</div>
					<div class="text-xs text-muted-foreground">€50</div>
				</div>
			</div>
		</div>

		<!-- Pro tip -->
		<div
			class="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
		>
			<div class="flex gap-3">
				<svg
					class="h-5 w-5 text-blue-500 shrink-0 mt-0.5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
					/>
				</svg>
				<p class="text-sm text-blue-800 dark:text-blue-200">
					<strong>Tipp:</strong> Mit einer Mana Quelle M erhältst du monatlich 1.000 Mana ab 9,99€/Monat.
				</p>
			</div>
		</div>
	</div>
</div>
