<svelte:head>
	<title>Hilfe - Arcade</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<h1 class="text-2xl font-bold text-foreground">Hilfe</h1>

	<section class="space-y-4">
		<div class="rounded-xl border border-border bg-card p-4">
			<h2 class="font-semibold text-foreground mb-2">Wie spiele ich?</h2>
			<p class="text-sm text-muted-foreground">
				Wähle ein Spiel auf der Startseite aus und klicke darauf. Das Spiel läuft direkt im Browser.
				Die Steuerung wird auf der Spielseite angezeigt.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-card p-4">
			<h2 class="font-semibold text-foreground mb-2">KI-Spielgenerator</h2>
			<p class="text-sm text-muted-foreground">
				Unter "Erstellen" kannst du eigene Spiele beschreiben und von verschiedenen KI-Modellen
				generieren lassen. Generierte Spiele werden lokal in deinem Browser gespeichert.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-card p-4">
			<h2 class="font-semibold text-foreground mb-2">Statistiken</h2>
			<p class="text-sm text-muted-foreground">
				Deine Highscores, Spielzeiten und Fortschritte werden automatisch gespeichert. Melde dich
				an, um sie geräteübergreifend zu synchronisieren.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-card p-4">
			<h2 class="font-semibold text-foreground mb-2">Tastaturkürzel</h2>
			<div class="grid grid-cols-2 gap-2 mt-2">
				{#each [['Cmd/Ctrl+K', 'Schnellsuche'], ['Esc', 'Suche schließen']] as [key, desc]}
					<div class="flex items-center gap-2">
						<kbd class="px-2 py-0.5 rounded bg-muted text-xs font-mono text-muted-foreground"
							>{key}</kbd
						>
						<span class="text-sm text-foreground">{desc}</span>
					</div>
				{/each}
			</div>
		</div>
	</section>
</div>
