Technische und organisatorische Maßnahmen,
Infrastruktur und Datenströme (TOMs)
gemäß Art. 32 DSGVO
Version: 2.3
Datum: 15.07.2025
Verantwortlicher: Nils Weiser

1. Allgemeine Angaben
   Unternehmen:
   Memoro GmbH
   Reichenaustraße 11a
   78467 Konstanz
   E-Mail: kontakt@memoro.ai
   Telefon: +49 176 444 343 85
   Datenschutzbeauftragter:
   Nils Weiser
   E-Mail: kontakt@memoro.ai
   Telefon: +49 176 444 343 85
   Einleitung: Infrastruktur und Datenflüsse
   Dieses Dokument beschreibt transparent unsere technische Infrastruktur und die Verarbeitung
   Ihrer Daten. Unser oberstes Credo ist der Schutz Ihrer Privatsphäre: Wir werden Ihre Daten
   niemals einsehen oder verkaufen. Wir setzen gezielt auf Lösungen, die höchsten europäischen
   Datenschutzstandards entsprechen und reduzieren stetig die Abhängigkeit von außereuropäischen
   Anbietern.
   Der Weg Ihrer Daten bei Memoro: Von der Aufnahme zur Analyse
1. Aufnahme und Speicherung: Wenn Sie eine Memo aufzeichnen, wird die Audiodatei
   zunächst sicher auf Ihrem Endgerät gespeichert. Sobald eine Internetverbindung besteht,
   wird die Aufnahme verschlüsselt zu unserem Backend-Dienstleister Supabase
   hochgeladen. Die Datenbank und die darin gespeicherten Audiodateien befinden sich
   physisch in einem Rechenzentrum in Frankfurt, Deutschland.
1. Transkription: Um Ihre Sprachaufnahme in Text umzuwandeln, wird die Audiodatei an
   eine Instanz von Microsoft Azure in Schweden gesendet. Wir nutzen diesen Standort, da
   dort die neuesten und qualitativ hochwertigsten Transkriptionsmodelle verfügbar sind. Ihre
   Daten verlassen dabei zu keinem Zeitpunkt den Europäischen Wirtschaftsraum.
1. Dateikonvertierung (bei Bedarf): In seltenen Fällen, in denen Ihr Endgerät
   Audioaufnahmen in einem nicht-standardisierten Format speichert, wird die Datei zur
   Konvertierung an Google Cloud in Frankfurt gesendet. Google konvertiert lediglich das

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 1 / 23

Dateiformat, ohne den Inhalt zu analysieren oder dauerhaft zu speichern. 4. Analyse und Erstellung von "Memories": Das erstellte Transkript wird zurück an unsere
Supabase-Datenbank in Frankfurt gesendet. Aus diesem Text werden Analyseabschnitte
("Memories") generiert. Für diesen Schritt nutzen wir je nach Anforderung die
leistungsfähigsten KI-Modelle:
○ Google Gemini: Die Verarbeitung findet auf Servern in Belgien statt. Google
garantiert, dass diese Daten nicht für das Training von Modellen verwendet werden.
Die Daten werden nach spätestens 30 Tagen gelöscht.
○ OpenAI-Modelle via Microsoft Azure: Die Verarbeitung erfolgt auf unserer Instanz
in Schweden, um von den fortschrittlichsten verfügbaren Modellen zu profitieren.
Microsoft garantiert, dass diese Daten nicht für das Training von Modellen
verwendet werden. Die Daten werden nach spätestens 30 Tagen gelöscht.
○ Erklärung: Die Daten werden bei Google Gemini und Microsoft Azure nicht aktiv
gespeichert, sondern befinden sich lediglich in deren internen Caching- und
Logging-Systemen. Diese Systeme löschen die Daten automatisch nach maximal
30 Tagen. Memoro hat keinen Zugriff auf diese zwischengespeicherten Daten, und
sie werden ausschließlich für interne Sicherheits- und Qualitätssicherungszwecke
der Anbieter vorgehalten, jedoch nicht für Modelltraining verwendet. 5. Die finalen Analysen werden wiederum sicher in unserer Supabase-Datenbank in
Frankfurt gespeichert.
Welche Daten werden verarbeitet?
Wenn Sie Memoro nutzen, werden folgende Kategorien von Daten an unser Backend (gehostet bei
Supabase in Frankfurt) übermittelt und dort verarbeitet:
● Inhaltsdaten: Die von Ihnen aufgezeichneten Audiodateien, die daraus erstellten
Transkripte sowie die finalen Analyseabschnitte ("Memories").
● Account-Daten: Ihre E-Mail-Adresse und Ihr Name (falls angegeben) zur Erstellung und
Verwaltung Ihres Nutzerkontos. Das Passwort wird ausschließlich als verschlüsselter
Hash-Wert gespeichert.
● Nutzungs- und Metadaten: Zeitstempel der Aufnahmen, Dateiformate, Gerätemodell (zur
Fehleranalyse) und Interaktionsdaten innerhalb der App (z.B. welche Funktionen genutzt
werden), um unseren Dienst zu verbessern.
● Technische Verbindungsdaten: Ihre IP-Adresse, die zur Herstellung der Verbindung zu
unseren Servern temporär verarbeitet wird, sowie Authentifizierungstokens zur Sicherung
Ihres Accounts.
Unsere Unterauftragsverarbeiter (Subdienstleister)
● Supabase: (Backend & Datenbank), Serverstandort: Frankfurt, DE.
● Microsoft Azure: (Transkription & KI-Analyse), Serverstandort: Schweden, EU.
● Google Cloud: (Dateikonvertierung & KI-Analyse), Serverstandort: Frankfurt, DE.
● PostHog: (Produktanalyse, Open Source), Serverstandort: EU-Hosting. (Deaktivierbar für
Organisationskunden, je nach AVV).
Ihre Kontrolle und unser Versprechen

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 2 / 23

Sie behalten stets die volle Kontrolle über Ihre Daten.
● Vollständige Löschung: Von Ihnen gelöschte Daten werden unwiderruflich und vollständig
von allen unseren Systemen entfernt.
● Anonymisierungsoptionen: Funktionen wie die Sprechererkennung können von Ihnen
deaktiviert werden, um die Rückverfolgbarkeit zu reduzieren.
Diese Vorkehrungen gewährleisten, in Kombination mit den detaillierten Maßnahmen dieses
Dokuments, eine sichere und DSGVO-konforme Verarbeitung Ihrer Daten.
Organisationsspezifische Anpassungen: Für Unternehmens- und Organisationskunden bieten
wir maßgeschneiderte Datenschutzlösungen, einschließlich automatischer Löschfristen und
angepasster Datenverarbeitungsprozesse gemäß individuellen Compliance-Anforderungen. 2. Zweck des Dokuments
Dieses Dokument beschreibt die technischen und organisatorischen Maßnahmen (TOMs) der
Memoro GmbH gemäß Art. 32 DSGVO. Ziel ist die Gewährleistung eines angemessenen
Schutzniveaus für personenbezogene Daten.
Dieses Dokument ist Bestandteil des Verzeichnisses von Verarbeitungstätigkeiten gemäß Art.
30 DSGVO. 3. Geltungsbereich
Die hier dokumentierten Maßnahmen gelten für:

- Alle IT-Systeme und Prozesse der Memoro GmbH
- Verarbeitung personenbezogener Daten innerhalb der Memoro App
- Die gesamte Infrastruktur, einschließlich externer Dienstleister

4. Rechtsgrundlagen
   Die TOMs basieren auf Art. 32 DSGVO (Sicherheit der Verarbeitung), der angemessene
   Schutzmaßnahmen sowie deren regelmäßige Überprüfung fordert.
5. Beschreibung der Technischen Maßnahmen (IT-Sicherheit)
   Gemäß Art. 32 DSGVO setzt die Memoro GmbH folgende technische Maßnahmen um, um die
   Sicherheit und den Schutz personenbezogener Daten zu gewährleisten.
   5.1 Zugangskontrolle und Authentifizierung
   5.1.1 Zugang zu Cloud-Diensten

- Systeme und Daten werden bevorzugt über europäische Cloud-Dienstleister oder
  solche mit Sitz in Ländern mit Angemessenheitsbeschluss verarbeitet. Bei Dienstleistern in
  Drittländern ohne Angemessenheitsbeschluss werden geeignete Garantien gemäß Art. 46
  DSGVO (z.B. Standardvertragsklauseln, Zertifizierungen nach dem Data Privacy
  Framework) implementiert, wie in Abschnitt 10 detailliert.
- Jeder Zugriff erfolgt über individuell vergebene Benutzerkonten, es gibt keine
  gemeinsam genutzten Logins.
  Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 3 / 23

- Multi-Faktor-Authentifizierung (MFA) ist für alle kritischen Systeme aktiviert.
- Verwaltung von Zugangsdaten über einen Passwort-Manager (1Password) mit
  Sicherheitsüberwachung.
  5.1.2 Sicherheitsvorgaben für Endgeräte
- Nutzung eines Passwort-Managers (1Password) ist verpflichtend für alle
  Mitarbeitenden.
- Watchtower-Funktion von 1Password erkennt unsichere oder kompromittierte
  Passwörter und alarmiert Nutzer.
- Alle Geräte müssen aktuelle Sicherheitsupdates installiert haben.
- Es sind Firewall und Virenschutz-Software aktiviert.
  5.1.3 Berechtigungsmanagement
- Nutzerzugriffe werden über Google Workspace verwaltet.
- Berechtigungen werden nach dem Need-to-Know-Prinzip vergeben und regelmäßig
  überprüft.
- Kritische Änderungen an Berechtigungen erfolgen dokumentiert und mit Zustimmung
  einer berechtigten Person.
  5.2 Datenverschlüsselung
- Transportverschlüsselung (TLS 1.2/1.3) für alle Cloud-Kommunikationen.
- AES-256-Verschlüsselung für gespeicherte Daten innerhalb der eingesetzten
  Cloud-Dienste.
- Ende-zu-Ende-Verschlüsselung für besonders sensible Daten innerhalb der Systeme.
  5.3 Netzwerksicherheit
- Zugriff auf Cloud-Dienste wird durch Sicherheitsrichtlinien gesteuert, um unbefugten
  Zugriff zu verhindern.
- Bestimmte sicherheitskritische Dienste erfordern zusätzliche Freigaben, um Zugriff
  auf sensible Daten zu ermöglichen.
- Sicherheitsmechanismen der Cloud-Plattformen werden zur Erkennung verdächtiger
  Aktivitäten genutzt.
  5.4 Backup- und Notfallmanagement
  5.4.1 3-2-1-Backup-Strategie
- Tägliche Backups aller personenbezogenen Daten mit Versionierung und
  Zugriffsbeschränkungen.
- Daten werden gemäß der 3-2-1-Backup-Strategie gesichert:
- 3 Kopien der Daten werden auf unterschiedlichen Speicherorten vorgehalten.
- 2 verschiedene Medientypen werden für die Sicherung verwendet (z. B.
  Cloud-Storage & verschlüsselte Offline-Backups).
- 1 Backup befindet sich an einem separaten Standort zur Ausfallsicherheit.
- Backups sind verschlüsselt und nur für berechtigte Personen zugänglich.

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 4 / 23

5.4.2 Notfall- und Wiederherstellungsmaßnahmen

- Alle Cloud-Dienste sind auf Hochverfügbarkeit ausgelegt, um Ausfälle und
  Datenverluste zu minimieren.
- Datenwiederherstellung wird regelmäßig getestet, um die Integrität der Backups zu
  gewährleisten.
- Notfallprozesse sind dokumentiert und werden regelmäßig aktualisiert.
  5.5 Protokollierung und Monitoring
  5.5.1 Logging von Zugriffen und Änderungen
- Alle Zugriffe auf Cloud-Dienste werden automatisch protokolliert (Google Workspace
  Security Logs).
- Verdächtige Aktivitäten werden erkannt und gemeldet.
- Revisionssichere Speicherung von Audit-Logs, um Zugriffe nachverfolgen zu können.
  5.5.2 Sicherheitsüberwachung
- Google Security- und Überwachungsfunktionen werden zur Erkennung von
  Sicherheitsbedrohungen eingesetzt.
- Automatische Benachrichtigungen bei sicherheitskritischen Ereignissen.
- Regelmäßige Überprüfung der Protokolle durch den Datenschutzbeauftragten.

6. Organisatorische Maßnahmen (Prozesse & Richtlinien)
   Die Memoro GmbH setzt neben technischen Schutzmaßnahmen auch organisatorische
   Maßnahmen um, um die Sicherheit und den Datenschutz der verarbeiteten personenbezogenen
   Daten zu gewährleisten.
   6.1 Datenschutzrichtlinien und Schulungen

- Interne Datenschutzrichtlinien sind dokumentiert und für alle Mitarbeitenden verbindlich.
- Alle Mitarbeitenden müssen eine Verpflichtung zur Vertraulichkeit und zum
  Datenschutz gemäß Art. 5 und Art. 32 DSGVO unterzeichnen.
- Regelmäßige Datenschutz- und IT-Sicherheitsschulungen für alle Mitarbeitenden.
- Datenschutz-Themen sind Bestandteil des Onboardings für neue Mitarbeitende.
  6.2 Verwaltung von Benutzerrechten
- Zugriff auf personenbezogene Daten erfolgt nach dem Prinzip der minimalen
  Berechtigungen (Need-to-Know-Prinzip).
- Rechte werden dokumentiert und regelmäßig überprüft.
- Kritische Änderungen an Zugriffsrechten erfolgen nur mit dokumentierter Genehmigung.
- Alle Zugriffe werden protokolliert und regelmäßig auf unbefugte Aktivitäten überprüft.
  6.3 Umgang mit externen Dienstleistern
- Die Memoro GmbH nutzt externe Dienstleister und Cloud-Anbieter, um bestimmte
  Verarbeitungstätigkeiten durchzuführen.
- Eine Liste der relevanten externen Dienstleister wird geführt und regelmäßig aktualisiert.

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 5 / 23

- Externe Dienstleister mit Zugriff auf personenbezogene Daten müssen
  DSGVO-konform sein und die gesetzlichen Anforderungen erfüllen.
- Die datenschutzrechtliche Absicherung erfolgt je nach Anbieter durch:
- Einen Auftragsverarbeitungsvertrag (AVV) gemäß Art. 28 DSGVO, sofern der
  Dienstleister als Auftragsverarbeiter tätig ist.
- Datenverarbeitungsbedingungen (DPA), falls der Anbieter eine standardisierte
  Regelung zur DSGVO-Compliance bereitstellt.
- Standardvertragsklauseln (SCC) gemäß Art. 46 DSGVO, falls personenbezogene
  Daten in ein Drittland ohne Angemessenheitsbeschluss übermittelt werden.
- Transfer Impact Assessments (TIA) zur Risikobewertung bei Datenübermittlungen
  in Drittländer.

- Vor der Beauftragung neuer Dienstleister wird geprüft, ob eine
  Datenschutz-Folgenabschätzung (DSFA) gemäß Art. 35 DSGVO erforderlich ist.
- Datenübermittlungen an Dritte erfolgen nur auf einer rechtlichen Grundlage, z. B.
  Einwilligung, vertragliche Notwendigkeit oder gesetzliche Verpflichtung.
  6.3.2 Nutzung von Payment-/Abo-Dienstleistern
- Für die Abwicklung von In-App-Käufen und Abo-Verwaltung wird ein externer Dienstleister
  genutzt.
- Ein Auftragsverarbeitungsvertrag (AVV) gemäß Art. 28 DSGVO ist vorhanden.
- Bei Übermittlungen in Drittländer (USA) werden Standardvertragsklauseln (SCC)
  eingesetzt.
- Die Datenübertragung erfolgt TLS-verschlüsselt, und es findet nur eine
  pseudonymisierte bzw. minimierte Übermittlung relevanter Abodaten statt.
- Das Einhalten von Sicherheits- und Compliance-Standards (z. B. SOC 2, ISO 27001)
  wird regelmäßig überprüft.
  6.4 Datenschutz-Folgenabschätzung (DSFA)
- Für Verarbeitungen mit hohem Risiko für die Rechte und Freiheiten betroffener Personen
  wird eine Datenschutz-Folgenabschätzung gemäß Art. 35 DSGVO durchgeführt.
- Die DSFA erfolgt nach einer standardisierten internen Bewertung und wird in kritischen
  Fällen mit der Aufsichtsbehörde abgestimmt.

  6.5 Grundsätze zur Datenaufbewahrung und Löschkonzept
  Die Memoro GmbH folgt strikt den Grundsätzen der Datenminimierung und Speicherbegrenzung
  gemäß Art. 5 Abs. 1 lit. e DSGVO. Personenbezogene Daten werden nur so lange in einer Form
  gespeichert, die die Identifizierung der betroffenen Personen ermöglicht, wie es für die Zwecke, für
  die sie verarbeitet werden, erforderlich ist.
  Dieses Kapitel beschreibt das verbindliche Löschkonzept der Memoro GmbH und ersetzt eine
  separate Richtlinie zur Datenaufbewahrung. Es legt die konkreten Fristen für die Löschung der
  verschiedenen Datenkategorien fest.
  6.5.1 Reguläre Speicher- und Löschfristen
  Die folgenden Fristen gelten für die in den aktiven Systemen der Memoro GmbH verarbeiteten

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 6 / 23

Daten:

Datenkategorie Zweck der Verarbeitung Speicherdauer & Löschfrist
Inhaltsdaten
(Audioaufnahmen,
Transkripte &
Analysen/"Memories")

Bereitstellung der
Kernfunktionalität der
Memoro App; dauerhafter
Zugriff für den Nutzer auf
seine Inhalte.

Gespeichert, solange das
Nutzerkonto besteht. Die
Daten werden
unverzüglich gelöscht,
wenn der Nutzer die
jeweilige Memo oder seinen
gesamten Account löscht.

Account-Daten (z.B.
E-Mail-Adresse, Name,
Passwort-Hash)

Authentifizierung,
Verwaltung des
Nutzerkontos und
Kommunikation mit dem
Nutzer.

Gespeichert, solange das
Nutzerkonto besteht. Bei
Löschanfrage des Accounts
werden diese Daten
innerhalb von 30 Tagen aus
den aktiven Systemen
entfernt.

Technische
Protokolldaten (z.B.
IP-Adressen, Server-Logs)

Gewährleistung der
Sicherheit, Stabilität und
Funktionsfähigkeit der
Infrastruktur; Erkennung
und Abwehr von Angriffen.

Die Speicherung erfolgt für
maximal 90 Tage. Danach
werden die Daten
automatisch gelöscht oder
vollständig anonymisiert.

Produktanalysedaten (via
PostHog)

Verbesserung der
Nutzererfahrung und
Optimierung der
App-Funktionen.

Die Daten werden
pseudonymisiert erfasst und
nach spätestens 12
Monaten automatisch
gelöscht.

Zahlungs- &
Vertragsdaten (bei
Abonnements)

Abwicklung von
Abonnements; Erfüllung
vertraglicher Pflichten.

Daten zum
Abonnementstatus werden
bis zur Beendigung des
Vertragsverhältnisses
gespeichert.

6.5.1.1 Sonderregelungen für Organisationskunden
Für Organisationskunden können im Rahmen des Auftragsverarbeitungsvertrags (AVV)
abweichende Löschfristen vereinbart werden. Diese Sonderregelungen haben Vorrang vor den
Standardfristen und können umfassen:

Automatische Löschung nach definierten Zeiträumen:

- Organisationen können festlegen, dass alle Inhaltsdaten (Audioaufnahmen, Transkripte und

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 7 / 23

Analysen) ihrer Mitarbeiter automatisch nach einem vereinbarten Zeitraum gelöscht werden

- Die Löschung erfolgt unwiderruflich und umfasst alle zugehörigen Daten des jeweiligen
  Memos
- Mitarbeiter werden vorab über die organisationsspezifischen Löschfristen informiert
  Die konkreten Löschfristen und -modalitäten werden im jeweiligen AVV dokumentiert und technisch
  implementiert."

  6.5.2 Gesetzliche Aufbewahrungspflichten
  Ungeachtet der oben genannten Löschfristen können gesetzliche Aufbewahrungspflichten eine
  längere Speicherung bestimmter Daten erfordern. Insbesondere kaufmännische oder
  steuerrechtliche Vorgaben (z.B. aus dem Handelsgesetzbuch (HGB) oder der Abgabenordnung
  (AO)) können eine Aufbewahrung von rechnungsrelevanten Unterlagen von bis zu 10 Jahren
  vorschreiben. Sollten Daten der Memoro GmbH solchen Pflichten unterliegen, werden sie für die
  Dauer der gesetzlichen Frist aufbewahrt. Nach Ablauf der Frist erfolgt die Löschung. Diese Daten
  werden für die Dauer der Aufbewahrung für andere Zwecke gesperrt.
  6.5.3 Umgang mit Daten in Backups
  Zur Gewährleistung der Datensicherheit und für den Notfall (Disaster Recovery) werden
  regelmäßig verschlüsselte Backups unserer Systeme erstellt. Für Daten in Backups gilt folgendes
  spezielles Löschverfahren:

1. Keine selektive Löschung: Aus technischen Gründen ist es nicht möglich, einzelne
   Datensätze aus bestehenden Backup-Archiven zu entfernen.
2. Sperrung im Live-System: Sobald ein Nutzer seine Daten im aktiven System löscht, sind
   diese nicht mehr zugänglich und werden nicht mehr verarbeitet.
3. Endgültige Löschung durch Überschreibung: Die in Backups enthaltenen, zur Löschung
   markierten Daten werden im Zuge des regulären Backup-Zyklus endgültig und unwiderruflich
   überschrieben. Die maximale Vorhaltezeit für Backups beträgt 30 Tage.
4. Zweckbindung: Während ihrer Speicherfrist werden Backups ausschließlich für den Zweck
   der Datensicherheit und Wiederherstellung vorgehalten und nicht für operative
   Geschäftsprozesse genutzt.
   6.5.4 Ausübung des Rechts auf Löschung
   Jeder Nutzer kann sein Recht auf Löschung ("Recht auf Vergessenwerden" gemäß Art. 17
   DSGVO) jederzeit ausüben. Die Löschung einzelner Memos oder des gesamten Accounts kann
   direkt in den Einstellungen der Memoro App vorgenommen werden. Für darüberhinausgehende
   Löschanfragen steht unser Datenschutzbeauftragter zur Verfügung. Die Löschung erfolgt
   fristgerecht gemäß den oben beschriebenen Prozessen.
   6.6 Umgang mit Datenschutzverletzungen

- Datenschutzverletzungen werden intern dokumentiert und gemäß Art. 33 DSGVO
  bewertet.
- Falls erforderlich, erfolgt eine Meldung an die zuständige Aufsichtsbehörde innerhalb
  von 72 Stunden.
  Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 8 / 23

- Betroffene Personen werden gemäß Art. 34 DSGVO informiert, wenn ein hohes Risiko
  besteht.
- Vorfallsmanagement-Prozesse sind definiert und beinhalten Eskalationsstufen für
  kritische Sicherheitsereignisse.
  6.7 Nachweise und Protokolle
- Liste der eingesetzten IT-Systeme und Verarbeitungsprozesse ist dokumentiert.
- Schulungsnachweise und Verpflichtungserklärungen werden revisionssicher archiviert.
- Zugriffsprotokolle und Audit-Logs werden regelmäßig überprüft.
- Interne und externe Datenschutzprüfungen sind dokumentiert und erfolgen regelmäßig.

7. Nachweise und Protokolle
   Die Memoro GmbH dokumentiert alle relevanten Datenschutzmaßnahmen und führt regelmäßige
   Prüfungen durch, um die Einhaltung der DSGVO nachweisen zu können.
   7.1 Verzeichnis von Verarbeitungstätigkeiten

- Ein Verzeichnis aller Verarbeitungstätigkeiten gemäß Art. 30 DSGVO wird geführt und
  regelmäßig aktualisiert.
- Dieses enthält insbesondere:
- Zweck und Rechtsgrundlagen der Verarbeitung
- Kategorien betroffener Personen und personenbezogener Daten
- Empfänger von Daten, einschließlich externer Dienstleister
- Technische und organisatorische Maßnahmen (TOMs)

  7.2 Schulungen und Verpflichtungserklärungen

- Alle Mitarbeitenden werden regelmäßig zu Datenschutz und IT-Sicherheit geschult.
- Die Schulungsinhalte und Teilnehmerlisten werden dokumentiert.
- Alle Mitarbeitenden müssen eine Verpflichtung zur Vertraulichkeit gemäß Art. 5 und 32
  DSGVO unterzeichnen.
  7.3 Zugriffskontrollen und Berechtigungsmanagement
- Vergabe und Änderungen von Zugriffsrechten werden dokumentiert.
- Regelmäßige Überprüfung der Zugriffsrechte, um nicht mehr benötigte Berechtigungen
  zu entfernen.
- Protokollierung von administrativen Änderungen und sicherheitskritischen Zugriffen.
  7.4 Protokollierung von Zugriffen und Änderungen
- Zugriffsprotokolle auf Cloud-Dienste (Google Workspace Security Logs, Audit-Logs von
  Cloud-Anbietern) werden revisionssicher gespeichert.
- Alle sicherheitskritischen Änderungen an Daten, Zugriffsrechten und Einstellungen werden
  automatisch protokolliert.
- Protokolldaten werden regelmäßig ausgewertet, um verdächtige Aktivitäten frühzeitig zu
  erkennen.

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 9 / 23

7.5 Datenschutz-Audits und Prüfberichte

- Interne Datenschutzprüfungen werden regelmäßig durchgeführt und dokumentiert.
- Falls erforderlich, werden externe Datenschutzprüfungen oder Zertifizierungen in
  Betracht gezogen.
- Ergebnisse von Audits werden mit Maßnahmen zur kontinuierlichen Verbesserung
  verbunden.
  7.6 Umgang mit Datenschutzvorfällen
- Dokumentation aller Datenschutzvorfälle mit Risikobewertung und ergriffenen
  Gegenmaßnahmen.
- Falls eine Meldung an die Aufsichtsbehörde gemäß Art. 33 DSGVO erforderlich ist,
  erfolgt dies innerhalb der vorgeschriebenen 72-Stunden-Frist.
- Betroffene Personen werden gemäß Art. 34 DSGVO informiert, falls ein hohes Risiko für
  ihre Rechte und Freiheiten besteht.
  7.7 Speicherfristen für Nachweise und Protokolle
- Schulungsnachweise und Verpflichtungserklärungen werden mindestens 3 Jahre
  aufbewahrt.
- Zugriffsprotokolle und sicherheitskritische Logs werden für mindestens 12 Monate
  gespeichert, sofern keine längeren Speicherfristen erforderlich sind.
- Datenschutzprüfungen und Audit-Berichte werden mindestens 5 Jahre archiviert.

8. Regelmäßige Aktualisierung und Kontrolle
   Die Memoro GmbH stellt sicher, dass alle technischen und organisatorischen Maßnahmen (TOMs)
   regelmäßig überprüft, aktualisiert und an neue rechtliche und technische Anforderungen angepasst
   werden.
   8.1 Verantwortlichkeit für die Wartung des Dokuments

- Die Verantwortung für die Aktualisierung der TOM-Dokumentation liegt bei der
  Geschäftsführung und dem Datenschutzbeauftragten.
- Anpassungen erfolgen in Abstimmung mit IT-Sicherheit, Compliance und relevanten
  Fachabteilungen.
  8.2 Regelmäßige Überprüfung der TOMs
- Jährliche Kontrolle und Aktualisierung der TOMs, um neue gesetzliche, technische oder
  organisatorische Änderungen zu berücksichtigen.
- Zusätzliche Überprüfung erfolgt bei:
- Änderungen in der IT-Infrastruktur oder den eingesetzten Cloud-Diensten.
- Änderungen in den Verarbeitungstätigkeiten oder den verarbeiteten Daten.
- Relevanten Gesetzesänderungen oder neuen regulatorischen Anforderungen.
- Ergebnissen interner oder externer Datenschutzprüfungen.

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 10 / 23

8.3 Audit- und Kontrollmechanismen

- Interne Datenschutz- und Sicherheitsaudits werden mindestens einmal jährlich
  durchgeführt.
- Externe Datenschutzprüfungen oder Zertifizierungen werden nach Bedarf in Betracht
  gezogen.
- Ergebnisse aus Audits und Prüfungen werden dokumentiert und für zukünftige
  Optimierungen genutzt.
  8.4 Änderungsmanagement und Dokumentation
- Jede Änderung an den TOMs wird dokumentiert und in einer Änderungshistorie
  festgehalten.
- Änderungen werden mit Versionsnummer, Datum und verantwortlicher Person
  gekennzeichnet.
- Mitarbeitende werden über wesentliche Änderungen informiert, insbesondere wenn
  diese Auswirkungen auf Sicherheits- oder Datenschutzmaßnahmen haben.
  8.5 Sensibilisierung und Schulung
- Mitarbeitende werden regelmäßig über aktualisierte Sicherheits- und
  Datenschutzmaßnahmen informiert.
- Jährliche Datenschutz- und IT-Sicherheitsschulungen werden aktualisiert, um neue
  Maßnahmen oder gesetzliche Änderungen abzubilden.
  8.6 Notfallkontrolle und Reaktionsstrategie
- Unvorhergesehene Sicherheitsvorfälle oder Datenschutzverletzungen lösen eine
  sofortige Überprüfung der TOMs aus.
- Falls erforderlich, werden Sofortmaßnahmen zur Risikominimierung implementiert.
- Lessons Learned aus Vorfällen fließen in die Weiterentwicklung der
  Sicherheitsmaßnahmen ein.

9. Risikoanalyse
   9.1 Ziel der Risikoanalyse
   Die Risikoanalyse dient dazu, potenzielle Datenschutz- und Sicherheitsrisiken im Zusammenhang
   mit der Verarbeitung personenbezogener Daten innerhalb der Memoro GmbH zu identifizieren
   und geeignete Maßnahmen zur Risikominimierung zu definieren. Sie erfüllt die Anforderungen aus
   Art. 32 DSGVO (Sicherheit der Verarbeitung) sowie Art. 35 DSGVO
   (Datenschutz-Folgenabschätzung – DSFA) für risikobehaftete Verarbeitungstätigkeiten.
   Memoro verfolgt einen risikobasierten Ansatz, bei dem Bedrohungen anhand ihrer
   Eintrittswahrscheinlichkeit und möglichen Auswirkungen bewertet werden. Ziel ist es,
   Sicherheitslücken frühzeitig zu erkennen und durch technische und organisatorische Maßnahmen
   zu minimieren.

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 11 / 23

9.2 Identifizierte Risiken und Gegenmaßnahmen
9.2.1 Technische Risiken
Risiko Beschreibung Gegenmaßnahmen
Datenverlust durch
Systemausfall

Verlust gespeicherter Daten
durch Hard- oder
Softwarefehler

Tägliche Backups, 3-2-1

Backup-Strategie, Notfall-
Wiederherstellungspläne

Unbefugter Zugriff auf
Sprachaufnahmen &
Transkripte

Kompromittierung
persönlicher Daten durch
Angreifer

AES-256 Verschlüsselung,
Zugriff nur für autorisierte
Nutzer,
Zero-Trust-Sicherheitsmode
ll

Hackerangriffe (DDoS,
Brute-Force)

Versuch, Memoro-Dienste
durch Überlastung oder
Hacking zu stören

DDoS-Schutz, Firewalls mit
Intrusion Detection System
(IDS), Rate Limiting

Missbrauch von
API-Schnittstellen

Exploits durch unbefugte
API-Nutzung

OAuth 2.0-Authentifizierung,
Rate Limits für API-Zugriffe,
regelmäßige
Sicherheitsüberprüfungen

Externe
Cloud-Sicherheitsrisiken

Datenleck oder Ausfall durch
Anbieter wie Google Cloud
oder Azure

Cloud-Sicherheitsüberprüfu
ng (SOC2, ISO 27001),
regelmäßige
Penetrationstests

9.2.2 Organisatorische Risiken
Risiko Beschreibung Gegenmaßnahmen
Fehlende
Datenschutzschulungen

Mitarbeitende könnten
unbeabsichtigt
Datenschutzverstöße
begehen

Regelmäßige Datenschutz-
und

IT-Sicherheitsschulungen,
verpflichtende Zertifizierungen

Fehlende Kontrolle über
externe Dienstleister

Risiken durch Cloud-Anbieter,
Auftragsverarbeiter oder Dritte

Auftragsverarbeitungsverträ
ge (AVV) mit Dienstleistern,
regelmäßige
Compliance-Prüfungen

9.2.3 Datenschutzrechtliche Risiken
Risiko Beschreibung Gegenmaßnahmen
Fehlende oder unklare
Einwilligung

Nutzer könnten nicht
ausreichend über

Transparente
Datenschutzerklärung,

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 12 / 23

Risiko Beschreibung Gegenmaßnahmen

Datenverarbeitung informiert
sein

aktive Einwilligung vor
Aufnahme,
DSGVO-konformes Opt-in

Fehlende
Datenschutz-Folgenabschät
zung (DSFA)

KI-gestützte Verarbeitung
könnte ein hohes Risiko für
Betroffene darstellen

DSFA regelmäßig
aktualisieren, unabhängige
Datenschutzprüfung einholen

Nichteinhaltung
organisationsspezifischer
Löschfristen

Versäumnis der
automatischen Löschung nach
vereinbarten Zeiträumen

Automatisierte Löschprozesse
mit täglicher Überprüfung;
Monitoring und Alerting bei
Löschfehlern; redundante
Löschmechanismen;
monatliche
Compliance-Reports

9.2.4 Betriebsrisiken
Risiko Beschreibung Gegenmaßnahmen
Skalierungsprobleme bei
hohem Nutzeraufkommen

Überlastung der Infrastruktur
könnte zu
Performance-Einbußen führen

Dynamische Skalierung und
Lasttests zur Optimierung

Datenverfügbarkeit &
Wiederherstellung

Unzureichende Notfallplanung
könnte zu Datenverlust führen

Notfall-Wiederherstellungsplä
ne (Disaster Recovery
Plans), jährliche Tests der
Backups

9.3 Kontinuierliche Überprüfung und Verbesserung
Die identifizierten Risiken werden regelmäßig im Rahmen von internen Audits und
Datenschutzprüfungen evaluiert. Falls erforderlich, werden Maßnahmen zur Risikominimierung
aktualisiert und dokumentiert.
Die Risikoanalyse wird:

- Mindestens einmal jährlich aktualisiert oder wenn sich wesentliche Änderungen in den
  Verarbeitungstätigkeiten ergeben.
- In Zusammenarbeit mit IT-Sicherheit und Datenschutzbeauftragten überprüft.
- Als Grundlage für Datenschutz-Folgenabschätzungen (DSFA) nach Art. 35 DSGVO
  verwendet.

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 13 / 23

10. Zertifizierungen
    10.1 Microsoft Azure Compliance
    Die Memoro GmbH nutzt Microsoft Azure als Teil ihrer Infrastruktur. Microsoft Azure stellt
    umfassende technische und organisatorische Sicherheitsmaßnahmen (TOMs) bereit, die eine
    sichere und DSGVO-konforme Verarbeitung personenbezogener Daten gewährleisten.
    Microsoft verpflichtet sich vertraglich zur Einhaltung der Datenschutz-Grundverordnung
    (DSGVO) durch die Microsoft Online Services Terms, die Standardvertragsklauseln (SCC)
    und die EU Data Boundary. Weitere Details sind unter Microsoft Azure Compliance abrufbar.
    Globale und EU-spezifische Compliance-Zertifizierungen
    Microsoft Azure erfüllt eine Vielzahl an internationalen und europäischen Sicherheitsstandards:

- ISO/IEC 27001 – Informationssicherheits-Managementsystem (ISMS)
- ISO/IEC 27017 – Sicherheitskontrollen für Cloud-Dienste
- ISO/IEC 27018 – Schutz personenbezogener Daten in Public Clouds
- ISO/IEC 27701 – Privacy Information Management System (PIMS)
- ISO 22301 – Business Continuity Management (BCMS)
- ISO 9001 – Qualitätsmanagementsystem
- SOC 1, SOC 2, SOC 3 – Prüfberichte zur Sicherheitsvalidierung
- PCI DSS – Schutz von Zahlungsverkehrsdaten
- CSA STAR – Ergänzende Cloud-Sicherheitsbewertungen
- EU GDPR/DSGVO-konform – Standardvertragsklauseln (SCC), EU Cloud CoC (Scope
  Europe zertifiziert)
  Datenschutzmaßnahmen in Azure
- Volle Kontrolle über Kundendaten – Microsoft verarbeitet Daten nur gemäß vertraglicher
  Vereinbarung.
- Keine Nutzung für Werbezwecke – Kundendaten werden nicht für Marketingzwecke
  verwendet.
- Regionale Speicherung – Microsoft bietet die Möglichkeit der Speicherung von Daten
  innerhalb der EU gemäß EU Data Boundary.
- Revisionssichere Löschung – Microsoft stellt Tools zur Verfügung, die eine
  revisionssichere Löschung gemäß Kundenanforderungen ermöglichen.
  Verschlüsselung und Datensicherheit
- Datenverschlüsselung im Ruhezustand (at rest)
- AES-256-Verschlüsselung
- FIPS 140-2-konforme Verschlüsselung
- Unterstützung von kundengemanagten Schlüsseln (Azure Key Vault)
- Azure Confidential Computing – Hardwarebasierte Verschlüsselung zur Isolierung
  sensibler Daten

- Datenverschlüsselung während der Übertragung (in transit)
- TLS 1.2/1.3 für sichere Datenkommunikation
- IEEE 802.1AE MAC Security zur Netzwerksicherheit

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 14 / 23

Zugriffskontrollen und Berechtigungen

- Azure Role-Based Access Control (RBAC) für granulare Berechtigungen
- Azure Information Protection (AIP) für den Schutz sensibler Daten
- Multi-Faktor-Authentifizierung (MFA) für privilegierte Konten
- Zero Trust Security Model – Zugriffskontrolle durch kontinuierliche Authentifizierung und
  Geräteintegritätsprüfungen
  Microsoft Azure KI-Compliance
  Microsoft aktualisiert regelmäßig seine Compliance-Maßnahmen, um neue regulatorische
  Anforderungen wie den EU AI Act zu erfüllen.
  Externe regulatorische Vorgaben
- EU AI Act (ab 2025)
- Transparenzpflichten (z. B. Kennzeichnung KI-generierter Inhalte)
- Strenge Dokumentationsanforderungen für Hochrisiko-KI
- Verbot der automatisierten Emotionserkennung in Bildung/Arbeitsplatz sowie
  Echtzeit-Fernbiometrie durch Strafverfolgung (Art. 5 EU AI Act)

- ISO 42001:2023 (KI-Managementsysteme)
- Risikobewertung, Ethikrichtlinien und Nachvollziehbarkeit von KI-Entscheidungen

Microsoft-interne KI-Governance

- Responsible AI Standard (Version 2)
- Bias-Erkennung und Fairness-Prüfung in Azure Machine Learning
- Explainability-APIs für transparente Entscheidungsfindung
- Content Safety zur Verhinderung von Missbrauch (z. B. Schutz vor Prompt Injection)
- Azure OpenAI EU-Region – Der Azure OpenAI Service wird in EU-Rechenzentren
  gemäß EU Data Boundary betrieben.
  Notfallmanagement und Incident Response
  Microsoft implementiert ein strukturiertes Incident Response Model:

1. Erkennung einer Sicherheitsverletzung
2. Analyse der Bedrohung und Bewertung der Auswirkungen
3. Reaktionsmaßnahmen, um das Risiko zu minimieren
4. Stabilisierung der betroffenen Systeme
5. Schließung des Vorfalls mit Lessons Learned
   Microsoft verpflichtet sich, Kunden innerhalb von 72 Stunden über Datenschutzverletzungen zu
   informieren. Microsoft bietet forensische Unterstützung, aber die finale DSGVO-Meldepflicht
   gemäß Art. 33 DSGVO bleibt beim Kunden (Memoro GmbH).
   Gemeinsame Verantwortung für Datenschutz und Sicherheit
   Das Shared Responsibility Model definiert klare Abgrenzungen zwischen Microsoft und Kunden:

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 15 / 23

Microsoft Verantwortung Kundenverantwortung
Sichere Cloud-Infrastruktur Konfiguration und Absicherung der

Cloud-Umgebung

Netzwerksicherheit & Compliance Zugangskontrollen und Datenverschlüsselung
Zertifizierungen & Audit-Berichte Eigenständige Prüfung von
Compliance-Anforderungen

10.2 Google Cloud Compliance
Die Memoro GmbH nutzt Google Cloud als Teil ihrer Infrastruktur. Google Cloud stellt
umfangreiche technische und organisatorische Sicherheitsmaßnahmen (TOMs) bereit, um
Datenschutz, Compliance und regulatorische Anforderungen in der EU zu gewährleisten.
Google verpflichtet sich zur Einhaltung der Datenschutz-Grundverordnung (DSGVO) durch
Standardvertragsklauseln (SCCs) sowie technische Maßnahmen wie EU Data Boundaries für
bestimmte Dienste. Weitere Details sind unter Google Cloud Compliance abrufbar.
Globale und EU-spezifische Compliance-Zertifizierungen
Google Cloud erfüllt folgende internationale und europäischen Sicherheitsstandards:

- ISO/IEC 27001 – Informationssicherheits-Managementsystem (ISMS)
- ISO/IEC 27017 – Cloud-spezifische Sicherheitskontrollen
- ISO/IEC 27018 – Schutz personenbezogener Daten in Public Clouds
- ISO/IEC 27701 – Datenschutzmanagementsystem für DSGVO-Anforderungen
- ISO 9001 – Qualitätsmanagementsystem
- SOC 1, SOC 2, SOC 3 – Prüfberichte zur Sicherheitsvalidierung
- PCI DSS – Schutz von Zahlungsverkehrsdaten
- CSA STAR – Ergänzende Cloud-Sicherheitsbewertungen
- EU GDPR/DSGVO-konform – Standardvertragsklauseln (SCC), EU Cloud Code of
  Conduct
  Regionale Zertifizierungen und Compliance
- DSGVO (GDPR) – Google Cloud erfüllt DSGVO-Anforderungen durch
  Standardvertragsklauseln (SCCs) und optionale Datenlokalisierung über EU Data
  Boundaries für bestimmte Dienste.
- EU Cloud Code of Conduct (Scope Europe zertifiziert) – Konformität mit
  DSGVO-Standards für Google Cloud Platform.
- C5:2020 (BSI, Deutschland) – Zertifizierung des Bundesamts für Sicherheit in der
  Informationstechnik.
  EU Data Boundaries und Datenlokalisierung
  Google Cloud bietet EU Data Boundaries zur Speicherung und Verarbeitung von Daten innerhalb
  der EU an. Dabei gelten folgende Einschränkungen:

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 16 / 23

- Unterstützte Dienste: Compute Engine und Vertex AI, die Memoro nutzt, werden
  vollständig in der EU betrieben, in Belgien.
- Technische Maßnahmen zur Absicherung:
- VPC Service Controls begrenzen Datenbewegungen außerhalb der EU.
- IAM-Richtlinien steuern Zugriffskontrollen für Datenverarbeitung in der EU.
- Client-seitige Verschlüsselung stellt sicher, dass Daten nur mit
  kundenspezifischen Schlüsseln verarbeitet werden.
  Technische Sicherheitsmaßnahmen und Infrastruktur
- Datenverschlüsselung – Alle Daten werden im Ruhezustand (AES-256) und während
  der Übertragung (TLS 1.2/1.3) verschlüsselt.
- Zugriffskontrolle – IAM (Identity and Access Management), VPC Service Controls und
  Firebase Security Rules gewährleisten granulare Berechtigungsstrukturen.
- Audit-Logs und Monitoring – Google Cloud Logging/Stackdriver und das Security
  Command Center ermöglichen eine kontinuierliche Sicherheitsüberwachung.
  10.4 Supabase Compliance und Datenschutzmaßnahmen
  Die Memoro GmbH nutzt Supabase als Backend-Plattform, die Datenbankdienste,
  Authentifizierung, Speicherlösungen und Serverless-Funktionen bereitstellt. Supabase verpflichtet
  sich zur Einhaltung der Datenschutz-Grundverordnung (DSGVO) und anderer relevanter
  Datenschutzgesetze. Die Verarbeitung personenbezogener Daten durch Supabase ist durch ein
  Data Processing Addendum (DPA), Version vom 02. Juni 2025, geregelt, das
  Standardvertragsklauseln (SCCs) für internationale Datentransfers beinhaltet.
  Datenübertragung und Speicherorte: Der primäre Speicherort für alle Kundendaten der Memoro
  GmbH (insbesondere Audioaufnahmen, Transkripte, Analysen und Nutzer-Accountdaten) befindet
  sich ausschließlich in einem Rechenzentrum in Frankfurt, Deutschland.
  Mögliche Datenübermittlung in Drittländer (USA): Obwohl unsere Kundendaten die EU
  physisch nicht verlassen, ist Supabase ein Unternehmen mit Sitz in den USA. Daher kann in
  folgenden, eng begrenzten Fällen ein Zugriff auf Daten aus den USA oder eine Übermittlung von
  Metadaten stattfinden:
  ● Wartungs- und Supportarbeiten: Wenn technische Unterstützung durch
  Supabase-Mitarbeiter erforderlich ist, die ihren Sitz außerhalb der EU (z.B. in den USA)
  haben, kann ein Zugriff auf die in der EU gespeicherten Daten notwendig sein. Dieser
  Zugriff erfolgt nach dem "Need-to-know"-Prinzip und ist streng reglementiert.
  ● Nutzung von Subdienstleistern durch Supabase: Supabase selbst nutzt
  Unterauftragsverarbeiter (z.B. für Monitoring oder Support-Tickets), die ihren Sitz in den
  USA haben könnten. Hierbei werden in der Regel nur Metadaten oder
  Support-Kommunikation verarbeitet, nicht jedoch die Kern-Nutzerdaten (Aufnahmen,
  Transkripte).
  ● Anforderungen durch US-Behörden (z.B. via CLOUD Act): Ein Restrisiko, dass
  US-Behörden Zugriff auf Daten von US-Unternehmen verlangen, kann rechtlich nicht
  vollständig ausgeschlossen werden.
  Rechtsgrundlage und Schutzmaßnahmen: Für all diese potenziellen Übermittlungsszenarien
  dient der mit Supabase geschlossene Auftragsverarbeitungsvertrag (AVV) inklusive der

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 17 / 23

EU-Standardvertragsklauseln (SCCs) als rechtliche Grundlage. Diese Maßnahmen, kombiniert
mit den technischen Vorkehrungen von Supabase (z.B. Verschlüsselung), stellen sicher, dass das
Datenschutzniveau dem der EU entspricht.
Wichtige Compliance-Aspekte und Zertifizierungen:

- SOC 2 Type 2: Supabase ist SOC 2 Typ 2 konform, was die Sicherheit, Verfügbarkeit,
  Verarbeitungsintergrität, Vertraulichkeit und den Datenschutz der Kundendaten durch
  unabhängige Prüfung bestätigt.
- HIPAA: Supabase ist HIPAA-konform. Die Speicherung von geschützten
  Gesundheitsinformationen (Protected Health Information - PHI) ist auf der gehosteten
  Plattform möglich, sofern ein Business Associate Agreement (BAA) mit Supabase
  abgeschlossen wird und die Memoro GmbH ihre HIPAA-Verpflichtungen im Rahmen des
  Shared Responsibility Modells erfüllt.
- Data Processing Addendum (DPA): Ein DPA (Version 02. Juni 2025) ist vorhanden und
  regelt die Auftragsverarbeitung. Supabase agiert hierbei als Auftragsverarbeiter für die
  Memoro GmbH. Das DPA enthält detaillierte Angaben zu den technischen und
  organisatorischen Maßnahmen (Schedule 1), den eingesetzten Unterauftragsverarbeitern
  (Schedule 3) und den Standardvertragsklauseln (Schedule 2).
  Technische und Organisatorische Maßnahmen (gemäß Supabase DPA Schedule 1 und
  Compliance-Informationen):
  Datenverschlüsselung:
- Alle Kundendaten werden im Ruhezustand (at rest) mit AES-256 verschlüsselt.
- Daten während der Übertragung (in transit) werden via TLS (mindestens TLS 1.2)
  verschlüsselt.
- Sensible Informationen wie Zugriffstoken und Schlüssel werden auf Anwendungsebene
  verschlüsselt, bevor sie in der Datenbank gespeichert werden.
- Zugangskontrolle und Authentifizierung:
- Multi-Faktor-Authentifizierung (MFA) kann für Supabase-Nutzerkonten aktiviert werden.
- Interne Zugriffskontrollen basieren auf dem Prinzip der geringsten Rechte (Least Privilege).
- Starke Passwörter und obligatorische Zwei-Faktor-Authentifizierung (nicht SMS-basiert) für
  interne Ressourcen bei Supabase.
- Rollenbasierte Zugriffskontrolle (Role-based access control - RBAC) ermöglicht die
  granulare Rechtevergabe für Organisationsmitglieder auf spezifische Ressourcen.
  Backup- und Notfallmanagement:
- Tägliche Backups für alle kostenpflichtigen Kundendatenbanken.
- Point-in-Time Recovery (PITR) ist als Add-on für Pro-Plan-Kunden verfügbar, um
  Datenbanken zu jedem beliebigen Zeitpunkt wiederherzustellen.
- Backups werden verschlüsselt und auf unabhängigen Systemen gespeichert.
  Netzwerksicherheit und DDoS-Schutz:
- Schutz vor Distributed Denial of Service (DDoS)-Angriffen auf CDN-Ebene durch
  Cloudflare.
- Einsatz von fail2ban zur Verhinderung von Brute-Force-Logins.

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 18 / 23

- Möglichkeit zur Konfiguration von Ratenbegrenzungen (Rate Limits) für kritische
  API-Routen und Ausgabenlimits (Spend Caps).
- Segmentierung von Kundenprojekten und internen Supabase-Diensten durch Firewalls.
  Protokollierung und Monitoring (Audit Trails):
- Protokollierung von Nutzeraktionen und Interaktionen.
- Traffic-Flow-Logs.
  Vulnerability Management und Tests:
- Regelmäßige Penetrationstests durch externe Sicherheitsexperten.
- Einsatz von Tools wie GitHub, Vanta und Snyk zur Code-Überprüfung auf Schwachstellen.
- Internes Monitoring und ein Breach Response Plan, der regelmäßig getestet wird.
  Umgang mit Sicherheitsvorfällen:
- Supabase benachrichtigt die Memoro GmbH ohne unangemessene Verzögerung
  (innerhalb von 48 Stunden nach Kenntnisnahme) über Sicherheitsvorfälle (Security
  Incidents), die Kundendaten betreffen.
  Datenlöschung:
- Nach Vertragsende können Daten innerhalb einer Frist von 30 Tagen durch die Memoro
  GmbH exportiert werden. Anschließend werden die Daten durch Supabase gelöscht.
  Unterauftragsverarbeiter (Sub-processors):
  Supabase setzt verschiedene Unterauftragsverarbeiter für Hosting, Support und andere Dienste
  ein. Eine aktuelle Liste ist im DPA (Schedule 3) enthalten. Zu den wichtigsten gehören:
- Supabase Pte. Ltd (Support)
- Amazon Web Services, Inc. (Hosting)
- Google, LLC (Hosting)
- Cloudflare, Inc. (Hosting, CDN)
  Die Memoro GmbH wird mindestens 30 Tage im Voraus über geplante Änderungen bei den
  Unterauftragsverarbeitern informiert und hat ein Einspruchsrecht. Ein Restrisiko durch den US
  CLOUD Act bei Datenverarbeitung durch US-amerikanische Subprozessoren kann trotz SCCs und
  weiterer Maßnahmen nicht vollständig ausgeschlossen werden.
  Verantwortungsbewusster Einsatz von Supabase durch die Memoro GmbH:
  Die Memoro GmbH setzt Supabase unter Beachtung der Datenschutzgrundsätze ein und ergreift
  folgende Maßnahmen zur Gewährleistung einer sicheren und DSGVO-konformen Nutzung:
- Abschluss und Einhaltung des Data Processing Addendums (DPA) mit Supabase, inklusive
  der Anwendung der aktuellen Standardvertragsklauseln (SCCs) als Rechtsgrundlage für
  Datenübertragungen in die USA.
- Transparente Information der Nutzer über die Datenverarbeitung durch Supabase im
  Rahmen der Datenschutzerklärung der Memoro App gemäß Art. 13 DSGVO, insbesondere
  über mögliche Datentransfers in die USA.
  Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 19 / 23

- Konfiguration der Supabase-Dienste nach dem Prinzip der Datenminimierung, sodass nur
  für die jeweiligen Zwecke notwendige Daten verarbeitet werden.
- Implementierung starker Authentifizierungsmechanismen und sorgfältige Verwaltung von
  Zugriffsrechten innerhalb der Supabase-Umgebung.
- Regelmäßige Überprüfung der rechtlichen und technischen Entwicklungen bezüglich
  Supabase und Anpassung der eigenen Datenschutzmaßnahmen bei Bedarf.
- Nutzung der von Supabase bereitgestellten Sicherheitsfeatures wie MFA und rollenbasierte
  Zugriffskontrollen.
  Durch die Kombination aus den von Supabase implementierten Sicherheitsmaßnahmen, den
  vertraglichen Vereinbarungen (DPA und SCCs) und den eigenen organisatorischen und
  technischen Maßnahmen gewährleistet die Memoro GmbH ein hohes Datenschutzniveau beim
  Einsatz von Supabase.
  10.5 PostHog Compliance und Datenschutzmaßnahmen
  Die Memoro GmbH nutzt PostHog als Plattform für Produktanalysen, um das Nutzerverhalten
  innerhalb der Memoro App zu verstehen, die Nutzererfahrung zu verbessern und die Anwendung
  zu optimieren. PostHog wird als Alternative zu traditionellen Analysediensten wie Google Analytics
  eingesetzt, da es als Open Source lizensiert ist und komplett in der EU gehostet werden kann. Bei
  der Nutzung von PostHog Cloud agiert PostHog Inc. als Auftragsverarbeiter (Data Processor) und
  die Memoro GmbH als Verantwortlicher (Data Controller) im Sinne der DSGVO.

Datenhosting und Internationale Datentransfers:

- Hosting: Die Memoro GmbH nutzt das EU-Hosting in Deutschland (Frankfurt) für Posthog,
  um Datentransfers in Drittländer zu vermeiden.
- Datentransfers: Sollten Datenübertragungen in die USA oder andere Drittländer ohne
  Angemessenheitsbeschluss erforderlich sein (z.B. für bestimmte Support-Prozesse durch
  PostHog-Mitarbeiter außerhalb der EU), stützt sich PostHog auf Standardvertragsklauseln
  (SCCs) der EU-Kommission und die Zertifizierung unter dem Data Privacy Framework.

Wichtige Compliance-Aspekte und Zertifizierungen:

- SOC 2 Type II: PostHog ist SOC 2 Typ II zertifiziert (Bericht vom 31. Mai 2024). Dies
  bestätigt, dass PostHog über robuste Kontrollen in Bezug auf Sicherheit, Verfügbarkeit,
  Verarbeitungsintegrität, Vertraulichkeit und Datenschutz verfügt. Ein Brückenbrief ist bis
  zum nächsten Bericht verfügbar.
- GDPR (DSGVO): PostHog hat seine Architektur, Datenflüsse und Vereinbarungen
  überprüft, um die DSGVO-Konformität seiner Plattform sicherzustellen. PostHog stellt
  Kunden umfangreiche Kontrollen zur Minimierung der Erfassung personenbezogener
  Daten zur Verfügung.
- CCPA: Für Kunden in Kalifornien agiert PostHog als "Service Provider". Ein CCPA-Zusatz
  ist Bestandteil der Datenschutzerklärung von PostHog.
- Data Processing Agreement (DPA): Die Memoro GmbH schließt mit PostHog ein Data
  Processing Agreement (DPA) ab. PostHog stellt hierfür einen DPA-Generator zur

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 20 / 23

Verfügung. Dieses DPA regelt die Auftragsverarbeitung und beinhaltet die
Standardvertragsklauseln (SCCs) für internationale Datentransfers.

- EU-U.S. Data Privacy Framework: PostHog Inc. ist nach dem EU-U.S. Data Privacy
  Framework (EU-U.S. DPF), der UK-Erweiterung zum EU-U.S. DPF und dem Swiss-U.S.
  Data Privacy Framework zertifiziert.

Technische und Organisatorische Maßnahmen (TOMs) von PostHog (Auswahl):
PostHog implementiert eine Vielzahl von Sicherheitsmaßnahmen und unterhält detaillierte interne
Richtlinien zur Gewährleistung der Datensicherheit und des Datenschutzes, die auch im Rahmen
der SOC 2-Zertifizierung geprüft werden. Dazu gehören unter anderem:

- Zugriffskontrolle: Strenge Zugriffskontrollen und Multi-Faktor-Authentifizierung (MFA) für
  interne Systeme.
- Datenverschlüsselung: Verschlüsselung von Daten während der Übertragung (in transit)
  und im Ruhezustand (at rest).
- Sicherheitsrichtlinien: Umfassende interne Sicherheitsrichtlinien (z.B. Acceptable Use
  Policy, Data Protection Policy, Encryption Policy, Incident Response Plan), die auf Anfrage
  eingesehen werden können.
- Schwachstellenmanagement: Regelmäßige Penetrationstests (zuletzt April 2024) und
  interne Sicherheitsüberprüfungen.
- Incident Response: Ein definierter Incident Response Plan zur Reaktion auf
  Sicherheitsvorfälle.
- Datenminimierung: PostHog erfordert nicht zwingend personenbezogene Daten für
  Produktanalysen und stellt der Memoro GmbH Werkzeuge zur Verfügung, um die
  Erfassung personenbezogener Daten zu minimieren oder zu vermeiden.
- Datenlöschung: PostHog stellt Werkzeuge zur Verfügung, mit denen die Memoro GmbH
  Anfragen zur Löschung von Endnutzerdaten nachkommen kann.
  Unterauftragsverarbeiter (Sub-processors):
  PostHog setzt für die Erbringung seiner Dienste Unterauftragsverarbeiter ein, insbesondere
  Amazon Web Services (AWS) für das Cloud-Hosting. Eine aktuelle Liste der
  Unterauftragsverarbeiter wird im Rahmen des DPA von PostHog geführt und zur Verfügung
  gestellt.

Verantwortungsbewusster Einsatz von PostHog durch die Memoro GmbH:
Die Memoro GmbH stellt einen datenschutzkonformen Einsatz von PostHog durch folgende
Maßnahmen sicher:

- Abschluss eines Data Processing Agreements (DPA): Ein DPA inklusive
  Standardvertragsklauseln (SCCs) wurde mit PostHog abgeschlossen, am 02.06.2025.
- EU-Hosting: Primäre Auswahl des Datenhostings auf Servern innerhalb der EU
  (Deutschland), um Datentransfers in Drittländer zu vermeiden.
- Datenminimierung und Pseudonymisierung: Konfiguration von PostHog mit dem Ziel, keine
  oder möglichst wenige personenbezogene Daten zu erfassen. Wenn möglich, werden

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 21 / 23

Daten pseudonymisiert. Es werden keine sensiblen Daten im Sinne von Art. 9 DSGVO an
PostHog übermittelt.

- Transparenz: Information der Nutzer der Memoro App über den Einsatz von PostHog zu
  Analysezwecken in der Datenschutzerklärung gemäß Art. 13 und 14 DSGVO, inklusive der
  Erläuterung der Zwecke und der Rechte der Betroffenen.
- Einwilligungsmanagement: Sofern für die konkrete Datenerfassung und -verarbeitung durch
  PostHog eine Einwilligung erforderlich ist, wird diese vorab von den Nutzern eingeholt.
- Regelmäßige Überprüfung: Die Konfiguration und Nutzung von PostHog wird regelmäßig
  auf Einhaltung der Datenschutzvorgaben überprüft.
- Datenschutzbeauftragter von PostHog: Für datenschutzrelevante Anfragen an PostHog
  steht deren Datenschutzbeauftragter, Charles Cook (VP Operations), unter
  privacy@posthog.com zur Verfügung.
  Durch diese Maßnahmen gewährleistet die Memoro GmbH, dass der Einsatz von PostHog im
  Einklang mit der DSGVO und den Erwartungen der Nutzer erfolgt und die Sicherheit der
  verarbeiteten Daten sichergestellt ist.

  10.5.1 Sonderregelung für Enterprise-/Organisationsvarianten
  Für spezielle Organisationsvarianten der Memoro App kann die Produktanalyse via PostHog
  vollständig deaktiviert werden. In diesen Fällen:
  ● Werden keine Daten an PostHog übermittelt
  ● Findet keine Nutzungsanalyse statt
  ● Gilt diese Regelung für alle Nutzer der jeweiligen Organisationsvariante
  Die konkrete Konfiguration wird im jeweiligen Auftragsverarbeitungsvertrag mit der Organisation
  festgelegt.

11. Verantwortungsbewusstes Handeln der Memoro GmbH

- Regulatorische Entwicklungen werden aktiv verfolgt – Memoro stellt sicher, dass alle
  eingesetzten Cloud-Dienste mit den neuesten DSGVO-Anforderungen konform sind.
- Transparente Kommunikation – Nutzer werden umfassend über die Nutzung und
  Verarbeitung ihrer Daten informiert.
- Technische Schutzmaßnahmen werden konsequent umgesetzt – Zusätzliche
  Verschlüsselung und Anonymisierung werden in sicherheitsrelevanten Bereichen
  angewendet.
  Diese Maßnahmen gewährleisten eine rechtskonforme und sichere Nutzung von
  Cloud-Diensten innerhalb der Memoro GmbH und stehen im Einklang mit den aktuellen
  Datenschutzanforderungen in Deutschland und der EU.

12. Auftragsverarbeitungsvertrag (AVV)
    Die Memoro GmbH stellt für Organisationskunden einen standardisierten
    Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO zur Verfügung. Dieser regelt:

Memoro - Technische und organisatorische Maßnahmen (TOMs) Seite 22 / 23

● Die spezifischen Verarbeitungstätigkeiten für die jeweilige Organisation
● Besondere Konfigurationen (z.B. Deaktivierung von Analysediensten)
● Zusätzliche technische und organisatorische Maßnahmen
● Unterauftragsverarbeiter-Regelungen
Der aktuelle Muster-AVV kann über kontakt@memoro.ai angefordert werden.
Individuelle Anpassungen werden nach Absprache vorgenommen.
