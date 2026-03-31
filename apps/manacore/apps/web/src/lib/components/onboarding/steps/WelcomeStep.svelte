<script lang="ts">
	import { Palette, SquaresFour, CurrencyCircleDollar } from '@manacore/shared-icons';

	// Welcome step - introduces ManaCore
</script>

<div class="text-center">
	<!-- Hero Icon -->
	<div class="mb-4">
		<div
			class="inline-flex h-16 w-16 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 items-center justify-center shadow-lg shadow-primary/25"
		>
			<span class="text-3xl text-primary-foreground font-bold">M</span>
		</div>
	</div>

	<h2 class="text-xl font-bold mb-2">Willkommen bei ManaCore!</h2>
	<p class="text-sm text-muted-foreground mb-4">
		Dein zentrales Dashboard für alle Mana-Apps. Verwalte deine Aufgaben, Termine, Kontakte und mehr
		- alles an einem Ort.
	</p>

	<!-- Feature highlights - using surface-elevated-1 (one level below the modal) -->
	<div class="space-y-2 text-left">
		<div class="p-3 rounded-lg bg-surface-elevated-1 border flex items-start gap-3">
			<div
				class="h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0"
			>
				<SquaresFour size={16} class="text-blue-600 dark:text-blue-400" />
			</div>
			<div>
				<h3 class="font-medium text-sm">Alle Apps</h3>
				<p class="text-xs text-muted-foreground">Todo, Kalender, Chat, Picture und mehr.</p>
			</div>
		</div>

		<div class="p-3 rounded-lg bg-surface-elevated-1 border flex items-start gap-3">
			<div
				class="h-8 w-8 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0"
			>
				<CurrencyCircleDollar size={16} class="text-green-600 dark:text-green-400" />
			</div>
			<div>
				<h3 class="font-medium text-sm">Credits-System</h3>
				<p class="text-xs text-muted-foreground">Ein Guthaben für alle AI-Features.</p>
			</div>
		</div>

		<div class="p-3 rounded-lg bg-surface-elevated-1 border flex items-start gap-3">
			<div
				class="h-8 w-8 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0"
			>
				<Palette size={20} class="text-purple-600 dark:text-purple-400" />
			</div>
			<div>
				<h3 class="font-medium text-sm">Personalisierung</h3>
				<p class="text-xs text-muted-foreground">Themes und Einstellungen nach deinem Geschmack.</p>
			</div>
		</div>
	</div>
</div>
