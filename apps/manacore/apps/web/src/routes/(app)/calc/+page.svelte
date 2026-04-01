<script lang="ts">
	import {
		Calculator,
		Flask,
		Code,
		Ruler,
		Coins,
		PiggyBank,
		Calendar,
		Percent,
	} from '@manacore/shared-icons';

	const quickLinks = [
		{
			href: '/calc/standard',
			icon: Calculator,
			label: 'Standard',
			description: 'Grundrechenarten',
			color: 'bg-pink-500',
		},
		{
			href: '/calc/scientific',
			icon: Flask,
			label: 'Wissenschaftlich',
			description: 'sin, cos, log & mehr',
			color: 'bg-violet-500',
		},
		{
			href: '/calc/programmer',
			icon: Code,
			label: 'Programmierer',
			description: 'HEX, BIN, OCT',
			color: 'bg-cyan-500',
		},
		{
			href: '/calc/converter',
			icon: Ruler,
			label: 'Einheiten',
			description: 'Umrechnen',
			color: 'bg-emerald-500',
		},
		{
			href: '/calc/currency',
			icon: Coins,
			label: 'Währung',
			description: 'Wechselkurse',
			color: 'bg-amber-500',
		},
		{
			href: '/calc/finance',
			icon: PiggyBank,
			label: 'Finanzen',
			description: 'Zins & Kredit',
			color: 'bg-blue-500',
		},
		{
			href: '/calc/date',
			icon: Calendar,
			label: 'Datum',
			description: 'Tage berechnen',
			color: 'bg-orange-500',
		},
		{
			href: '/calc/percentage',
			icon: Percent,
			label: 'Prozent & Trinkgeld',
			description: 'Aufteilen & Berechnen',
			color: 'bg-rose-500',
		},
	];
</script>

<svelte:head>
	<title>Calc - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	<header class="mb-8">
		<h1 class="text-2xl font-bold text-foreground">Calc</h1>
		<p class="text-muted-foreground mt-1 text-sm">Dein Taschenrechner-Hub</p>
	</header>

	<!-- Quick display -->
	<div class="mb-8 rounded-xl border border-border bg-card p-6">
		<div class="flex items-center gap-4">
			<div class="rounded-full bg-primary/10 p-3">
				<Calculator size={32} class="text-primary" />
			</div>
			<div>
				<div class="text-4xl font-bold tabular-nums font-mono text-foreground">0</div>
				<div class="text-muted-foreground text-sm">Wähle einen Rechner-Modus</div>
			</div>
		</div>
	</div>

	<!-- Quick Links Grid -->
	<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
		{#each quickLinks as link}
			<a
				href={link.href}
				class="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg group"
			>
				<div class="flex flex-col items-center gap-3 text-center">
					<div
						class="{link.color} rounded-full p-3 text-white transition-transform group-hover:scale-110"
					>
						<link.icon size={24} />
					</div>
					<div>
						<div class="font-medium text-foreground">{link.label}</div>
						<div class="text-xs text-muted-foreground">{link.description}</div>
					</div>
				</div>
			</a>
		{/each}
	</div>
</div>
