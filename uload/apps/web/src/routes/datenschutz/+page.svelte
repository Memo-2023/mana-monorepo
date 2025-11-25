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
			<h1 class="mb-8 text-3xl font-bold text-theme-text">Datenschutzerklärung</h1>

			<div class="space-y-6 text-theme-text">
				<section>
					<h2 class="mb-3 text-xl font-semibold">1. Datenschutz auf einen Blick</h2>

					<h3 class="mt-4 mb-2 font-semibold">Allgemeine Hinweise</h3>
					<p class="text-theme-text-muted">
						Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
						personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
						Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">Datenerfassung auf dieser Website</h3>
					<p class="mb-2 text-theme-text-muted">
						<strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
					</p>
					<p class="mb-4 text-theme-text-muted">
						Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
						Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
					</p>

					<p class="mb-2 text-theme-text-muted">
						<strong>Wie erfassen wir Ihre Daten?</strong>
					</p>
					<p class="mb-4 text-theme-text-muted">
						Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann
						es sich z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben. Andere Daten
						werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere
						IT-Systeme erfasst.
					</p>

					<p class="mb-2 text-theme-text-muted">
						<strong>Wofür nutzen wir Ihre Daten?</strong>
					</p>
					<p class="mb-4 text-theme-text-muted">
						Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu
						gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
					</p>

					<p class="mb-2 text-theme-text-muted">
						<strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong>
					</p>
					<p class="text-theme-text-muted">
						Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck
						Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht,
						die Berichtigung oder Löschung dieser Daten zu verlangen.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">2. Hosting</h2>
					<p class="text-theme-text-muted">
						Wir hosten die Inhalte unserer Website bei folgendem Anbieter: [Hosting-Anbieter
						einfügen]
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">
						3. Allgemeine Hinweise und Pflichtinformationen
					</h2>

					<h3 class="mt-4 mb-2 font-semibold">Datenschutz</h3>
					<p class="text-theme-text-muted">
						Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir
						behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen
						Datenschutzvorschriften sowie dieser Datenschutzerklärung.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">Hinweis zur verantwortlichen Stelle</h3>
					<p class="mb-2 text-theme-text-muted">
						Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
					</p>
					<div class="mb-4 space-y-1 text-theme-text-muted">
						<p>[Ihr Name oder Firmenname]</p>
						<p>[Ihre Adresse]</p>
						<p>Telefon: [Ihre Telefonnummer]</p>
						<p>E-Mail: [Ihre E-Mail-Adresse]</p>
					</div>

					<h3 class="mt-4 mb-2 font-semibold">Speicherdauer</h3>
					<p class="text-theme-text-muted">
						Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt
						wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die
						Datenverarbeitung entfällt.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">
						Gesetzlich vorgeschriebener Datenschutzbeauftragter
					</h3>
					<p class="text-theme-text-muted">
						Wir haben für unser Unternehmen einen Datenschutzbeauftragten bestellt.
					</p>
					<div class="mt-2 space-y-1 text-theme-text-muted">
						<p>[Name des Datenschutzbeauftragten]</p>
						<p>[Adresse]</p>
						<p>Telefon: [Telefonnummer]</p>
						<p>E-Mail: [E-Mail-Adresse]</p>
					</div>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">4. Datenerfassung auf dieser Website</h2>

					<h3 class="mt-4 mb-2 font-semibold">Cookies</h3>
					<p class="mb-4 text-theme-text-muted">
						Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine Datenpakete
						und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für
						die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem
						Endgerät gespeichert.
					</p>
					<p class="text-theme-text-muted">
						Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert
						werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte
						Fälle oder generell ausschließen sowie das automatische Löschen der Cookies beim
						Schließen des Browsers aktivieren.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">Server-Log-Dateien</h3>
					<p class="mb-2 text-theme-text-muted">
						Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten
						Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
					</p>
					<ul class="mb-4 list-inside list-disc space-y-1 text-theme-text-muted">
						<li>Browsertyp und Browserversion</li>
						<li>verwendetes Betriebssystem</li>
						<li>Referrer URL</li>
						<li>Hostname des zugreifenden Rechners</li>
						<li>Uhrzeit der Serveranfrage</li>
						<li>IP-Adresse</li>
					</ul>
					<p class="text-theme-text-muted">
						Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die
						Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">Registrierung auf dieser Website</h3>
					<p class="mb-4 text-theme-text-muted">
						Sie können sich auf dieser Website registrieren, um zusätzliche Funktionen auf der Seite
						zu nutzen. Die dazu eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des
						jeweiligen Angebotes oder Dienstes, für den Sie sich registriert haben.
					</p>
					<p class="text-theme-text-muted">
						Die bei der Registrierung abgefragten Pflichtangaben müssen vollständig angegeben
						werden. Anderenfalls werden wir die Registrierung ablehnen.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">5. Soziale Medien</h2>
					<p class="text-theme-text-muted">
						Auf unseren Seiten sind Plugins der sozialen Netzwerke eingebunden. Wenn Sie eine
						unserer Seiten besuchen, die ein solches Plugin enthält, baut Ihr Browser eine direkte
						Verbindung mit den Servern der Netzwerke auf.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">6. Analyse-Tools und Werbung</h2>

					<h3 class="mt-4 mb-2 font-semibold">Google Analytics</h3>
					<p class="text-theme-text-muted">
						Diese Website nutzt Funktionen des Webanalysedienstes Google Analytics. Anbieter ist die
						Google Ireland Limited („Google"), Gordon House, Barrow Street, Dublin 4, Irland.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">7. Newsletter</h2>
					<p class="text-theme-text-muted">
						Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von
						Ihnen eine E-Mail-Adresse sowie Informationen, welche uns die Überprüfung gestatten,
						dass Sie der Inhaber der angegebenen E-Mail-Adresse sind und mit dem Empfang des
						Newsletters einverstanden sind.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">8. Plugins und Tools</h2>

					<h3 class="mt-4 mb-2 font-semibold">YouTube mit erweitertem Datenschutz</h3>
					<p class="text-theme-text-muted">
						Diese Website bindet Videos der Website YouTube ein. Betreiber der Seiten ist die Google
						Ireland Limited („Google"), Gordon House, Barrow Street, Dublin 4, Irland.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">Google Fonts</h3>
					<p class="text-theme-text-muted">
						Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten so genannte Web Fonts,
						die von Google bereitgestellt werden.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">9. Online-Zahlungsanbieter</h2>

					<h3 class="mt-4 mb-2 font-semibold">Stripe</h3>
					<p class="text-theme-text-muted">
						Anbieter dieses Zahlungsdienstes ist die Stripe Payments Europe, Ltd., 1 Grand Canal
						Street Lower, Grand Canal Dock, Dublin, Irland (im Folgenden „Stripe").
					</p>
					<p class="mt-2 text-theme-text-muted">
						Bei der Zahlung via Stripe werden die von Ihnen im Rahmen des Kaufvorgangs eingegebenen
						Zahlungsdaten (z.B. Name, E-Mail-Adresse, Kreditkartennummer, Bankleitzahl, evtl.
						Rechnungsadresse) von Stripe zur Zahlungsabwicklung gespeichert.
					</p>
					<p class="mt-2 text-theme-text-muted">
						Die Übermittlung Ihrer Daten an Stripe erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b
						DSGVO (Vertragsabwicklung) sowie im Interesse einer möglichst effizienten
						Zahlungsabwicklung (Art. 6 Abs. 1 lit. f DSGVO).
					</p>
					<p class="mt-2 text-theme-text-muted">
						Weitere Informationen entnehmen Sie der Datenschutzerklärung von Stripe unter folgendem
						Link:
						<a
							href="https://stripe.com/de/privacy"
							target="_blank"
							rel="noopener noreferrer"
							class="text-theme-primary hover:underline">https://stripe.com/de/privacy</a
						>
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">10. Ihre Rechte</h2>
					<p class="mb-4 text-theme-text-muted">
						Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf:
					</p>
					<ul class="list-inside list-disc space-y-1 text-theme-text-muted">
						<li>
							Auskunft über Ihre bei uns gespeicherten Daten und deren Verarbeitung (Art. 15 DSGVO)
						</li>
						<li>Berichtigung unrichtiger personenbezogener Daten (Art. 16 DSGVO)</li>
						<li>Löschung Ihrer bei uns gespeicherten Daten (Art. 17 DSGVO)</li>
						<li>Einschränkung der Datenverarbeitung (Art. 18 DSGVO)</li>
						<li>Widerspruch gegen die Verarbeitung Ihrer Daten (Art. 21 DSGVO)</li>
						<li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
					</ul>
				</section>
			</div>

			<div
				class="mt-8 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
			>
				<p class="font-semibold">⚠️ Wichtiger Hinweis:</p>
				<p>
					Bitte ersetzen Sie alle Platzhalter in eckigen Klammern [ ] mit Ihren tatsächlichen Daten
					und passen Sie die Datenschutzerklärung an Ihre spezifischen Dienste und
					Datenverarbeitungen an.
				</p>
			</div>
		</div>
	</div>
</div>

<Footer />
