<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Navigation user={data.user} currentPath={$page.url.pathname} />

<div class="min-h-screen bg-theme-background">
	<div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="rounded-xl border border-theme-border bg-theme-surface p-8 shadow-xl">
			<h1 class="mb-8 text-3xl font-bold text-theme-text">Sicherheit</h1>

			<div
				class="mb-6 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400"
			>
				<p class="font-semibold">🔒 Ihre Sicherheit ist unsere Priorität</p>
				<p class="mt-1">
					Bei uload setzen wir modernste Sicherheitsstandards ein, um Ihre Daten und Links zu
					schützen.
				</p>
			</div>

			<div class="space-y-6 text-theme-text">
				<section>
					<h2 class="mb-3 text-xl font-semibold">🛡️ Verschlüsselung</h2>

					<h3 class="mt-4 mb-2 font-semibold">SSL/TLS-Verschlüsselung</h3>
					<p class="text-theme-text-muted">
						Alle Datenübertragungen zwischen Ihrem Browser und unseren Servern sind durch moderne
						SSL/TLS-Verschlüsselung geschützt. Wir verwenden ausschließlich TLS 1.3 und TLS 1.2 mit
						starken Cipher-Suites.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">Verschlüsselte Speicherung</h3>
					<p class="text-theme-text-muted">
						Sensible Daten wie Passwörter werden mit branchenführenden Verschlüsselungsalgorithmen
						(bcrypt mit Salt) gespeichert. Selbst im unwahrscheinlichen Fall eines Datenlecks
						bleiben Ihre Passwörter geschützt.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">Ende-zu-Ende Verschlüsselung für Premium-Nutzer</h3>
					<p class="text-theme-text-muted">
						Premium-Nutzer können optionale Ende-zu-Ende-Verschlüsselung für besonders sensible
						Links aktivieren. Diese Links können nur mit dem richtigen Schlüssel entschlüsselt
						werden.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">🔐 Authentifizierung & Zugriffskontrolle</h2>

					<h3 class="mt-4 mb-2 font-semibold">Sichere Authentifizierung</h3>
					<ul class="list-inside list-disc space-y-1 text-theme-text-muted">
						<li>
							Starke Passwort-Anforderungen (mindestens 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen)
						</li>
						<li>Zwei-Faktor-Authentifizierung (2FA) verfügbar</li>
						<li>Automatische Sitzungsbeendigung nach Inaktivität</li>
						<li>Schutz vor Brute-Force-Angriffen durch Rate-Limiting</li>
					</ul>

					<h3 class="mt-4 mb-2 font-semibold">Passwortgeschützte Links</h3>
					<p class="text-theme-text-muted">
						Erstellen Sie passwortgeschützte Links für zusätzliche Sicherheit. Nur Personen mit dem
						korrekten Passwort können auf die Ziel-URL zugreifen.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">IP-Whitelisting für Enterprise</h3>
					<p class="text-theme-text-muted">
						Enterprise-Kunden können IP-Whitelisting aktivieren, um den Zugriff auf ihre Links nur
						von bestimmten IP-Adressen oder IP-Bereichen zu erlauben.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">🛠️ Infrastruktur-Sicherheit</h2>

					<h3 class="mt-4 mb-2 font-semibold">Hosting & Server</h3>
					<ul class="list-inside list-disc space-y-1 text-theme-text-muted">
						<li>Hosting in ISO 27001 zertifizierten Rechenzentren</li>
						<li>Redundante Server-Architektur für maximale Verfügbarkeit</li>
						<li>Regelmäßige Sicherheitsupdates und Patches</li>
						<li>24/7 Überwachung der Systemintegrität</li>
					</ul>

					<h3 class="mt-4 mb-2 font-semibold">DDoS-Schutz</h3>
					<p class="text-theme-text-muted">
						Unser Service ist durch einen fortschrittlichen DDoS-Schutz abgesichert, der Angriffe
						automatisch erkennt und abwehrt, um die Verfügbarkeit unseres Dienstes zu gewährleisten.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">Web Application Firewall (WAF)</h3>
					<p class="text-theme-text-muted">
						Eine Web Application Firewall schützt vor gängigen Web-Angriffen wie SQL-Injection,
						Cross-Site-Scripting (XSS) und anderen OWASP Top 10 Bedrohungen.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">🔍 Überwachung & Schutz</h2>

					<h3 class="mt-4 mb-2 font-semibold">Malware & Phishing-Schutz</h3>
					<p class="text-theme-text-muted">
						Alle erstellten Links werden automatisch gegen bekannte Malware- und
						Phishing-Datenbanken geprüft. Verdächtige Links werden blockiert und zur manuellen
						Überprüfung markiert.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">Echtzeit-Überwachung</h3>
					<ul class="list-inside list-disc space-y-1 text-theme-text-muted">
						<li>Kontinuierliche Überwachung auf verdächtige Aktivitäten</li>
						<li>Automatische Erkennung von Missbrauchsmustern</li>
						<li>Sofortige Benachrichtigung bei Sicherheitsvorfällen</li>
						<li>Detaillierte Audit-Logs für Enterprise-Kunden</li>
					</ul>

					<h3 class="mt-4 mb-2 font-semibold">Link-Validierung</h3>
					<p class="text-theme-text-muted">
						Regelmäßige Überprüfung aller Ziel-URLs auf Verfügbarkeit und Sicherheit. Gefährliche
						oder kompromittierte Websites werden automatisch blockiert.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">📊 Datenschutz & Compliance</h2>

					<h3 class="mt-4 mb-2 font-semibold">DSGVO-Konformität</h3>
					<p class="text-theme-text-muted">
						Vollständige Einhaltung der Datenschutz-Grundverordnung (DSGVO). Sie haben jederzeit die
						volle Kontrolle über Ihre Daten mit Rechten auf Auskunft, Berichtigung und Löschung.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">Datensparsamkeit</h3>
					<p class="text-theme-text-muted">
						Wir sammeln nur die minimal notwendigen Daten für den Betrieb unseres Services. Keine
						unnötige Datensammlung oder -weitergabe an Dritte.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">Regelmäßige Audits</h3>
					<p class="text-theme-text-muted">
						Unabhängige Sicherheitsaudits und Penetrationstests werden regelmäßig durchgeführt, um
						höchste Sicherheitsstandards zu gewährleisten.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">🔄 Backup & Wiederherstellung</h2>

					<h3 class="mt-4 mb-2 font-semibold">Automatische Backups</h3>
					<ul class="list-inside list-disc space-y-1 text-theme-text-muted">
						<li>Tägliche automatische Backups aller Daten</li>
						<li>Geografisch verteilte Backup-Speicherung</li>
						<li>Verschlüsselte Backup-Archive</li>
						<li>Regelmäßige Wiederherstellungstests</li>
					</ul>

					<h3 class="mt-4 mb-2 font-semibold">Disaster Recovery</h3>
					<p class="text-theme-text-muted">
						Umfassender Disaster-Recovery-Plan mit RPO (Recovery Point Objective) von maximal 24
						Stunden und RTO (Recovery Time Objective) von maximal 4 Stunden.
					</p>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">👤 Ihre Verantwortung</h2>

					<h3 class="mt-4 mb-2 font-semibold">Best Practices für Nutzer</h3>
					<ul class="list-inside list-disc space-y-1 text-theme-text-muted">
						<li>Verwenden Sie starke, einzigartige Passwörter</li>
						<li>Aktivieren Sie die Zwei-Faktor-Authentifizierung</li>
						<li>Teilen Sie Ihre Zugangsdaten niemals mit anderen</li>
						<li>Melden Sie verdächtige Aktivitäten sofort</li>
						<li>Halten Sie Ihre Kontaktinformationen aktuell</li>
						<li>Überprüfen Sie regelmäßig Ihre Account-Aktivitäten</li>
					</ul>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">🚨 Sicherheitsvorfälle melden</h2>

					<h3 class="mt-4 mb-2 font-semibold">Verantwortungsvolle Offenlegung</h3>
					<p class="text-theme-text-muted">
						Wir schätzen die Arbeit von Sicherheitsforschern. Wenn Sie eine Sicherheitslücke
						entdecken, melden Sie diese bitte verantwortungsvoll an:
					</p>
					<div class="mt-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
						<p class="font-mono text-sm text-theme-text">security@uload.de</p>
					</div>
					<p class="mt-2 text-theme-text-muted">
						Bitte geben Sie uns angemessene Zeit zur Behebung, bevor Sie die Schwachstelle
						öffentlich machen.
					</p>

					<h3 class="mt-4 mb-2 font-semibold">Bug Bounty Programm</h3>
					<p class="text-theme-text-muted">
						Für kritische Sicherheitslücken bieten wir Belohnungen im Rahmen unseres Bug Bounty
						Programms. Details finden Sie unter:
					</p>
					<div class="mt-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
						<p class="font-mono text-sm text-theme-text">uload.de/bug-bounty</p>
					</div>
				</section>

				<section>
					<h2 class="mb-3 text-xl font-semibold">📋 Zertifizierungen & Standards</h2>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="rounded-lg border border-theme-border p-4">
							<h3 class="mb-2 font-semibold">ISO 27001</h3>
							<p class="text-sm text-theme-text-muted">
								Informationssicherheits-Management-System zertifiziert
							</p>
						</div>
						<div class="rounded-lg border border-theme-border p-4">
							<h3 class="mb-2 font-semibold">SSL Labs A+</h3>
							<p class="text-sm text-theme-text-muted">
								Höchste Bewertung für SSL/TLS-Konfiguration
							</p>
						</div>
						<div class="rounded-lg border border-theme-border p-4">
							<h3 class="mb-2 font-semibold">OWASP Compliance</h3>
							<p class="text-sm text-theme-text-muted">
								Einhaltung der OWASP-Sicherheitsrichtlinien
							</p>
						</div>
						<div class="rounded-lg border border-theme-border p-4">
							<h3 class="mb-2 font-semibold">PCI DSS Ready</h3>
							<p class="text-sm text-theme-text-muted">
								Bereit für Payment Card Industry Standards
							</p>
						</div>
					</div>
				</section>

				<section class="mt-8">
					<h2 class="mb-3 text-xl font-semibold">📞 Kontakt</h2>
					<p class="text-theme-text-muted">
						Bei Fragen zur Sicherheit unseres Services kontaktieren Sie uns:
					</p>
					<div class="mt-3 space-y-2">
						<p class="text-theme-text-muted">
							<span class="font-semibold">E-Mail:</span> security@uload.de
						</p>
						<p class="text-theme-text-muted">
							<span class="font-semibold">PGP-Schlüssel:</span> Verfügbar auf Anfrage
						</p>
						<p class="text-theme-text-muted">
							<span class="font-semibold">Notfall-Hotline:</span> +49 (0) [Telefonnummer]
						</p>
					</div>
				</section>
			</div>

			<div
				class="mt-8 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
			>
				<p class="font-semibold">💡 Tipp:</p>
				<p>
					Aktivieren Sie die Zwei-Faktor-Authentifizierung in Ihren Account-Einstellungen für
					maximale Sicherheit!
				</p>
			</div>

			<div
				class="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
			>
				<p class="font-semibold">✓ Letzte Sicherheitsüberprüfung:</p>
				<p>
					{new Date().toLocaleDateString('de-DE', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</p>
			</div>
		</div>
	</div>
</div>
