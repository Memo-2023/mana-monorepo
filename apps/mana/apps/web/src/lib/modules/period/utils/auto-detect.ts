/**
 * Auto-Detection — leitet Period-Start und Period-End aus Tageslogs ab.
 *
 * Konservative Heuristiken:
 *  - Period-Start: Blutung (light/medium/heavy) ohne offenen Zyklus → neuer Zyklus
 *    nur, wenn der letzte Zyklus mindestens 10 Tage abgeschlossen ist (vermeidet
 *    Zwischenblutungs-Fehlinterpretation).
 *  - Period-End: 2 trockene Tage in Folge nach dem letzten Bleeding-Tag → setze
 *    periodEndDate auf den letzten Bleeding-Tag.
 */

import type { Cycle, CycleDayLog, Flow } from '../types';
import { daysBetween } from './phase';

/** Welche Flow-Werte zählen als "Blutung" (= Periode)? */
export function isBleedingFlow(flow: Flow): boolean {
	return flow === 'light' || flow === 'medium' || flow === 'heavy';
}

/** Mindestabstand (Tage) zwischen Ende einer Periode und Start eines neuen Zyklus. */
export const MIN_GAP_FOR_NEW_CYCLE = 10;
/** Wieviele zusammenhängende trockene Tage nach Bleeding für Period-End-Detection. */
export const DRY_DAYS_FOR_PERIOD_END = 2;

/**
 * Soll für diesen Tageseintrag ein neuer Zyklus angelegt werden?
 *
 * Ja, wenn:
 *  - flow ist eine echte Blutung (nicht none/spotting), UND
 *  - es gibt keinen Zyklus, ODER der letzte Zyklus hat eine periodEndDate UND
 *    logDate liegt mindestens MIN_GAP_FOR_NEW_CYCLE Tage danach.
 *
 * Verhindert false positives für Tage innerhalb eines bestehenden Zyklus.
 */
export function shouldStartNewCycle(logDate: string, flow: Flow, cycles: Cycle[]): boolean {
	if (!isBleedingFlow(flow)) return false;

	const real = cycles.filter((c) => !c.isPredicted && !c.isArchived);
	if (real.length === 0) return true;

	const latest = [...real].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];

	// logDate vor dem letzten Zyklus → wir bauen keinen "vergangenen" Zyklus auto
	if (logDate < latest.startDate) return false;

	// Aktueller Zyklus läuft noch — Blutung gehört dazu (Mid-Cycle-Spotting o.ä.)
	if (!latest.periodEndDate) return false;

	// Aktueller Zyklus ist abgeschlossen → wenn genug Abstand, ist das eine neue Periode
	return daysBetween(logDate, latest.periodEndDate) >= MIN_GAP_FOR_NEW_CYCLE;
}

/**
 * Wenn der aktuelle Tag (logDate) trocken ist, prüfe ob die Periode beendet werden soll.
 *
 * Gibt das Datum des letzten Bleeding-Tags zurück (= das zu setzende periodEndDate),
 * wenn alle Bedingungen erfüllt sind. Sonst null.
 *
 * Bedingungen:
 *  - flow === 'none' (nicht spotting — spotting könnte Periode-Ende-Zeichen sein)
 *  - Es gibt einen offenen Zyklus (periodEndDate ist null)
 *  - Im aktuellen Zyklus existiert ein letzter Bleeding-Tag
 *  - Zwischen letztem Bleeding-Tag und logDate liegen mindestens DRY_DAYS_FOR_PERIOD_END Tage
 */
export function detectPeriodEnd(
	logDate: string,
	flow: Flow,
	openCycle: Cycle | null,
	logsInCycle: CycleDayLog[]
): string | null {
	if (flow !== 'none') return null;
	if (!openCycle || openCycle.periodEndDate) return null;

	// Tage des Zyklus nach Datum sortieren, alle bis einschließlich logDate
	const sorted = [...logsInCycle]
		.filter((l) => l.logDate <= logDate)
		.sort((a, b) => a.logDate.localeCompare(b.logDate));

	// Letzter Tag mit Blutung
	let lastBleedingDay: string | null = null;
	for (const log of sorted) {
		if (isBleedingFlow(log.flow)) lastBleedingDay = log.logDate;
	}
	if (!lastBleedingDay) return null;

	if (daysBetween(logDate, lastBleedingDay) >= DRY_DAYS_FOR_PERIOD_END) {
		return lastBleedingDay;
	}
	return null;
}
