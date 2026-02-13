<script lang="ts">
	// Completion step with celebration
</script>

<div class="text-center max-w-md mx-auto">
	<!-- Celebration animation -->
	<div class="mb-8 relative">
		<div
			class="inline-flex h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 items-center justify-center shadow-lg shadow-green-500/25 animate-bounce"
		>
			<svg class="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</div>

		<!-- Confetti-like decorations -->
		<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
			<span class="text-2xl animate-pulse">🎉</span>
		</div>
		<div class="absolute top-4 left-8">
			<span class="text-xl animate-bounce" style="animation-delay: 0.1s;">✨</span>
		</div>
		<div class="absolute top-4 right-8">
			<span class="text-xl animate-bounce" style="animation-delay: 0.2s;">🌟</span>
		</div>
	</div>

	<h2 class="text-3xl font-bold mb-3">Alles bereit!</h2>
	<p class="text-lg text-muted-foreground mb-8">
		Du kannst jetzt loslegen und alle Mana-Apps nutzen.
	</p>

	<!-- Quick actions -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
		<a
			href="/dashboard"
			class="p-4 rounded-xl bg-card border hover:border-primary/50 hover:shadow-md transition-all group"
		>
			<div class="flex items-center gap-3">
				<div
					class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
				>
					<svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
						/>
					</svg>
				</div>
				<div>
					<div class="font-semibold group-hover:text-primary transition-colors">Dashboard</div>
					<div class="text-xs text-muted-foreground">Dein Überblick</div>
				</div>
			</div>
		</a>

		<a
			href="/apps"
			class="p-4 rounded-xl bg-card border hover:border-primary/50 hover:shadow-md transition-all group"
		>
			<div class="flex items-center gap-3">
				<div
					class="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors"
				>
					<svg
						class="h-5 w-5 text-blue-600 dark:text-blue-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
						/>
					</svg>
				</div>
				<div>
					<div class="font-semibold group-hover:text-blue-600 transition-colors">Alle Apps</div>
					<div class="text-xs text-muted-foreground">Entdecke mehr</div>
				</div>
			</div>
		</a>

		<a
			href="/credits"
			class="p-4 rounded-xl bg-card border hover:border-primary/50 hover:shadow-md transition-all group"
		>
			<div class="flex items-center gap-3">
				<div
					class="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors"
				>
					<svg
						class="h-5 w-5 text-yellow-600 dark:text-yellow-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<div>
					<div class="font-semibold group-hover:text-yellow-600 transition-colors">Credits</div>
					<div class="text-xs text-muted-foreground">150 Gratis-Credits</div>
				</div>
			</div>
		</a>

		<a
			href="/settings"
			class="p-4 rounded-xl bg-card border hover:border-primary/50 hover:shadow-md transition-all group"
		>
			<div class="flex items-center gap-3">
				<div
					class="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors"
				>
					<svg
						class="h-5 w-5 text-gray-600 dark:text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				</div>
				<div>
					<div
						class="font-semibold group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
					>
						Einstellungen
					</div>
					<div class="text-xs text-muted-foreground">Personalisieren</div>
				</div>
			</div>
		</a>
	</div>

	<p class="text-sm text-muted-foreground">
		Klicke auf "Los geht's!" um zum Dashboard zu gelangen.
	</p>
</div>
