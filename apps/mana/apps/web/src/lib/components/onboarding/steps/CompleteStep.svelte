<script lang="ts">
	import { Check, Gear, House, SquaresFour, CurrencyCircleDollar } from '@mana/shared-icons';

	// Completion step with celebration
</script>

<div class="text-center max-w-md mx-auto">
	<!-- Celebration animation -->
	<div class="mb-8 relative">
		<div
			class="inline-flex h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 items-center justify-center shadow-lg shadow-green-500/25 animate-bounce"
		>
			<Check size={20} class="text-white" />
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
			href="/"
			class="p-4 rounded-xl bg-card border hover:border-primary/50 hover:shadow-md transition-all group"
		>
			<div class="flex items-center gap-3">
				<div
					class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
				>
					<House size={20} class="text-primary" />
				</div>
				<div>
					<div class="font-semibold group-hover:text-primary transition-colors">Dashboard</div>
					<div class="text-xs text-muted-foreground">Dein Überblick</div>
				</div>
			</div>
		</a>

		<a
			href="/"
			class="p-4 rounded-xl bg-card border hover:border-primary/50 hover:shadow-md transition-all group"
		>
			<div class="flex items-center gap-3">
				<div
					class="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors"
				>
					<SquaresFour size={20} class="text-blue-600 dark:text-blue-400" />
				</div>
				<div>
					<div class="font-semibold group-hover:text-blue-600 transition-colors">Workbench</div>
					<div class="text-xs text-muted-foreground">Deine Apps entdecken</div>
				</div>
			</div>
		</a>

		<a
			href="/?app=credits"
			class="p-4 rounded-xl bg-card border hover:border-primary/50 hover:shadow-md transition-all group"
		>
			<div class="flex items-center gap-3">
				<div
					class="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors"
				>
					<CurrencyCircleDollar size={20} class="text-yellow-600 dark:text-yellow-400" />
				</div>
				<div>
					<div class="font-semibold group-hover:text-yellow-600 transition-colors">Credits</div>
					<div class="text-xs text-muted-foreground">150 Gratis-Credits</div>
				</div>
			</div>
		</a>

		<a
			href="/?app=settings"
			class="p-4 rounded-xl bg-card border hover:border-primary/50 hover:shadow-md transition-all group"
		>
			<div class="flex items-center gap-3">
				<div
					class="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors"
				>
					<Gear size={20} class="text-gray-600 dark:text-gray-400" />
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
