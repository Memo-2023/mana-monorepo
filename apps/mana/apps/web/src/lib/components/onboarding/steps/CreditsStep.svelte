<script lang="ts">
	import { Check, CurrencyCircleDollar, Gift, Lightbulb } from '@mana/shared-icons';

	// Credits explanation step
</script>

<div class="max-w-xl mx-auto">
	<div class="text-center mb-8">
		<div
			class="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 items-center justify-center mb-4 shadow-lg shadow-orange-500/25"
		>
			<CurrencyCircleDollar size={32} class="text-white" />
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
					<Check size={20} class="text-green-500 mt-0.5 shrink-0" />
					<span>Du hast ein Credit-Guthaben für alle Mana-Apps</span>
				</li>
				<li class="flex items-start gap-2">
					<Check size={20} class="text-green-500 mt-0.5 shrink-0" />
					<span>AI-Features wie Chat, Bildgenerierung etc. kosten Credits</span>
				</li>
				<li class="flex items-start gap-2">
					<Check size={20} class="text-green-500 mt-0.5 shrink-0" />
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
					<Gift size={16} />
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
				<Lightbulb size={20} class="text-blue-500 shrink-0 mt-0.5" />
				<p class="text-sm text-blue-800 dark:text-blue-200">
					<strong>Tipp:</strong> Mit einer Mana Quelle M erhältst du monatlich 1.000 Mana ab 9,99€/Monat.
				</p>
			</div>
		</div>
	</div>
</div>
