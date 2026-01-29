<script lang="ts">
	import { Gear } from '@manacore/shared-icons';
</script>

<header
	class="sticky top-0 z-40 bg-[var(--color-background-page)]/95 backdrop-blur border-b border-[var(--color-border)]"
>
	<div class="container mx-auto px-4 max-w-lg">
		<div class="flex items-center justify-between h-14">
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
					<span class="text-white font-bold text-sm">N</span>
				</div>
				<span class="font-semibold text-[var(--color-text-primary)]">NutriPhi</span>
			</div>

			<a
				href="/settings"
				class="p-2 rounded-lg hover:bg-[var(--color-background-card)] transition-colors"
				title="Einstellungen"
			>
				<Gear class="w-5 h-5 text-[var(--color-text-secondary)]" />
			</a>
		</div>
	</div>
</header>
