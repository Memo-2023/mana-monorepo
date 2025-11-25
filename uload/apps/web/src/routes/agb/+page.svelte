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
			<h1 class="mb-8 text-3xl font-bold text-theme-text">Allgemeine Geschäftsbedingungen (AGB)</h1>

			<div class="space-y-6 text-theme-text">
				<section>
					<h2 class="mb-3 text-xl font-semibold">§ 1 Geltungsbereich</h2>
					<p class="text-theme-text-muted">
						(1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") gelten für alle über
						unsere Website uload geschlossenen Verträge zwischen uns und unseren Nutzern
						(nachfolgend "Nutzer" oder "Sie").
					</p>
					<p class="mt-2 text-theme-text-muted">
						(2) Maßgeblich ist die jeweils zum Zeitpunkt des Vertragsschlusses gültige Fassung der
						AGB.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(3) Abweichende Bedingungen des Nutzers werden nicht anerkannt, es sei denn, wir stimmen
						ihrer Geltung ausdrücklich schriftlich zu.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">§ 2 Vertragsgegenstand</h2>
					<p class="text-theme-text-muted">
						(1) Gegenstand des Vertrages ist die Bereitstellung eines URL-Verkürzungsdienstes
						(uload) sowie damit verbundene Zusatzfunktionen.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(2) Der Nutzer kann über unseren Dienst lange URLs in kurze, leicht zu teilende Links
						umwandeln.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(3) Je nach gewähltem Tarif stehen dem Nutzer verschiedene Funktionen zur Verfügung, wie
						z.B. Statistiken, benutzerdefinierte Links, QR-Codes und erweiterte
						Verwaltungsfunktionen.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">§ 3 Registrierung und Nutzerkonto</h2>
					<p class="text-theme-text-muted">
						(1) Für die vollständige Nutzung unseres Dienstes ist eine Registrierung erforderlich.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(2) Bei der Registrierung müssen alle Pflichtfelder wahrheitsgemäß und vollständig
						ausgefüllt werden.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(3) Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und vor dem Zugriff
						Dritter zu schützen.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(4) Der Nutzer haftet für alle unter seinem Nutzerkonto vorgenommenen Handlungen.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">§ 4 Leistungen und Verfügbarkeit</h2>
					<p class="text-theme-text-muted">
						(1) Wir stellen unseren Dienst mit einer Verfügbarkeit von 99% im Jahresmittel zur
						Verfügung.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(2) Hiervon ausgenommen sind Zeiten, in denen der Server aufgrund von technischen oder
						sonstigen Problemen, die nicht in unserem Einflussbereich liegen (höhere Gewalt,
						Verschulden Dritter etc.), nicht erreichbar ist.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(3) Wir behalten uns vor, den Zugang zum Dienst bei Wartungsarbeiten vorübergehend zu
						beschränken.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">§ 5 Preise und Zahlung</h2>
					<p class="text-theme-text-muted">(1) Die Nutzung des Basisdienstes ist kostenlos.</p>
					<p class="mt-2 text-theme-text-muted">
						(2) Für erweiterte Funktionen (Premium-Tarife) fallen die auf unserer Website
						angegebenen Gebühren an.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(3) Die Abrechnung erfolgt wahlweise monatlich oder jährlich im Voraus.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(4) Die Zahlung erfolgt über die auf der Website angebotenen Zahlungsmethoden (z.B.
						Kreditkarte, PayPal, Stripe).
					</p>
					<p class="mt-2 text-theme-text-muted">
						(5) Bei Zahlungsverzug behalten wir uns vor, den Zugang zu Premium-Funktionen zu
						sperren.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">§ 6 Pflichten des Nutzers</h2>
					<p class="mb-2 text-theme-text-muted">Der Nutzer verpflichtet sich:</p>
					<ul class="list-inside list-disc space-y-1 text-theme-text-muted">
						<li>
							keine rechtswidrigen, beleidigenden, verleumderischen oder anderweitig unzulässigen
							Inhalte zu verlinken
						</li>
						<li>keine Links zu erstellen, die gegen geltendes Recht verstoßen</li>
						<li>keine automatisierten Anfragen ohne unsere ausdrückliche Genehmigung zu senden</li>
						<li>den Dienst nicht für Spam oder Phishing zu verwenden</li>
						<li>keine schädliche Software oder Malware zu verbreiten</li>
						<li>
							die Rechte Dritter, insbesondere Marken-, Urheber- und Persönlichkeitsrechte zu
							beachten
						</li>
					</ul>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">§ 7 Haftung</h2>
					<p class="text-theme-text-muted">
						(1) Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(2) Bei leichter Fahrlässigkeit haften wir nur bei Verletzung einer wesentlichen
						Vertragspflicht (Kardinalpflicht) und nur in Höhe des vorhersehbaren, typischerweise
						eintretenden Schadens.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(3) Die Haftung für Datenverlust wird auf den typischen Wiederherstellungsaufwand
						beschränkt, der bei regelmäßiger und gefahrentsprechender Anfertigung von
						Sicherungskopien eingetreten wäre.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(4) Die vorstehenden Haftungsbeschränkungen gelten nicht bei Verletzung von Leben,
						Körper und Gesundheit sowie bei Ansprüchen nach dem Produkthaftungsgesetz.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">§ 8 Laufzeit und Kündigung</h2>
					<p class="text-theme-text-muted">
						(1) Der Vertrag über die kostenlose Nutzung wird auf unbestimmte Zeit geschlossen und
						kann von beiden Parteien jederzeit ohne Einhaltung einer Frist gekündigt werden.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(2) Premium-Tarife haben eine Mindestlaufzeit entsprechend des gewählten
						Abrechnungszeitraums (monatlich oder jährlich).
					</p>
					<p class="mt-2 text-theme-text-muted">
						(3) Premium-Tarife verlängern sich automatisch um den gewählten Abrechnungszeitraum,
						wenn sie nicht mit einer Frist von 14 Tagen zum Ende der Laufzeit gekündigt werden.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(4) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(5) Kündigungen bedürfen der Textform (z.B. E-Mail).
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">§ 9 Datenschutz</h2>
					<p class="text-theme-text-muted">
						(1) Wir erheben, verarbeiten und nutzen personenbezogene Daten nur im Rahmen der
						gesetzlichen Bestimmungen.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(2) Einzelheiten zur Datenverarbeitung sind unserer Datenschutzerklärung zu entnehmen.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">§ 10 Änderungen der AGB</h2>
					<p class="text-theme-text-muted">
						(1) Wir behalten uns vor, diese AGB jederzeit zu ändern.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(2) Änderungen werden dem Nutzer per E-Mail mitgeteilt.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(3) Die Änderungen gelten als genehmigt, wenn der Nutzer nicht innerhalb von vier Wochen
						nach Mitteilung der Änderungen widerspricht.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(4) Bei Widerspruch steht beiden Parteien ein Sonderkündigungsrecht zu.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">§ 11 Streitbeilegung</h2>
					<p class="text-theme-text-muted">
						(1) Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
						bereit, die Sie unter
						<a
							href="https://ec.europa.eu/consumers/odr/"
							target="_blank"
							rel="noopener noreferrer"
							class="text-theme-primary hover:underline">https://ec.europa.eu/consumers/odr/</a
						> finden.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(2) Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
						Verbraucherschlichtungsstelle teilzunehmen.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">§ 12 Schlussbestimmungen</h2>
					<p class="text-theme-text-muted">
						(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(2) Ist der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder
						öffentlich-rechtliches Sondervermögen, ist ausschließlicher Gerichtsstand für alle
						Streitigkeiten aus diesem Vertrag unser Geschäftssitz.
					</p>
					<p class="mt-2 text-theme-text-muted">
						(3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die
						Wirksamkeit der übrigen Bestimmungen unberührt.
					</p>
				</section>

				<section class="pt-4">
					<p class="text-sm text-theme-text-muted">
						Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}
					</p>
				</section>
			</div>

			<div
				class="mt-8 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
			>
				<p class="font-semibold">⚠️ Wichtiger Hinweis:</p>
				<p>
					Diese AGB sind ein Muster und sollten von einem Rechtsanwalt auf Ihre spezifischen
					Bedürfnisse angepasst werden.
				</p>
			</div>
		</div>
	</div>
</div>

<Footer />
