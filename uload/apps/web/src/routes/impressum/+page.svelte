<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Navigation user={data.user} currentPath={$page.url.pathname} />

<div class="min-h-screen bg-theme-background">
	<div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="rounded-xl border border-theme-border bg-theme-surface p-8 shadow-xl">
			<h1 class="mb-8 text-3xl font-bold text-theme-text">Impressum</h1>

			<div class="space-y-6 text-theme-text">
				<section>
					<h2 class="mb-3 text-xl font-semibold">Angaben gemäß § 5 TMG</h2>
					<div class="space-y-1 text-theme-text-muted">
						<p>[Ihr Name oder Firmenname]</p>
						<p>[Ihre Straße und Hausnummer]</p>
						<p>[Ihre Postleitzahl und Ort]</p>
						<p>Deutschland</p>
					</div>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">Kontakt</h2>
					<div class="space-y-1 text-theme-text-muted">
						<p>Telefon: [Ihre Telefonnummer]</p>
						<p>E-Mail: [Ihre E-Mail-Adresse]</p>
						<p>
							Website: {typeof window !== 'undefined' ? window.location.origin : 'https://uload.de'}
						</p>
					</div>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">Umsatzsteuer-ID</h2>
					<div class="text-theme-text-muted">
						<p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:</p>
						<p>[Ihre USt-IdNr.]</p>
					</div>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">
						Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
					</h2>
					<div class="space-y-1 text-theme-text-muted">
						<p>[Name des Verantwortlichen]</p>
						<p>[Adresse des Verantwortlichen]</p>
					</div>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">EU-Streitschlichtung</h2>
					<div class="text-theme-text-muted">
						<p>
							Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
							bereit:
						</p>
						<p>
							<a
								href="https://ec.europa.eu/consumers/odr/"
								target="_blank"
								rel="noopener noreferrer"
								class="text-theme-primary hover:underline">https://ec.europa.eu/consumers/odr/</a
							>
						</p>
						<p class="mt-2">Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
					</div>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">
						Verbraucherstreitbeilegung/Universalschlichtungsstelle
					</h2>
					<div class="text-theme-text-muted">
						<p>
							Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
							Verbraucherschlichtungsstelle teilzunehmen.
						</p>
					</div>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">Haftungsausschluss</h2>

					<h3 class="mt-4 mb-2 font-semibold">Haftung für Inhalte</h3>
					<p class="text-theme-text-muted">
						Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
						nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
						Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
						Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
						Tätigkeit hinweisen.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">Haftung für Links</h3>
					<p class="text-theme-text-muted">
						Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
						Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
						übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder
						Betreiber der Seiten verantwortlich.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">Urheberrecht</h2>
					<p class="text-theme-text-muted">
						Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
						dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
						der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
						Zustimmung des jeweiligen Autors bzw. Erstellers.
					</p>
				</section>
			</div>

			<div
				class="mt-8 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
			>
				<p class="font-semibold">⚠️ Wichtiger Hinweis:</p>
				<p>
					Bitte ersetzen Sie alle Platzhalter in eckigen Klammern [ ] mit Ihren tatsächlichen Daten.
				</p>
			</div>
		</div>
	</div>
</div>

<Footer />
