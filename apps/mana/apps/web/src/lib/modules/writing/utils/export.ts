/**
 * Export helpers — turn a draft + its current version into something
 * the user can share outside the app. M10 exports: Markdown string,
 * .md/.txt file download, print/PDF via the browser, and hand-off to
 * the articles module as a saved read-later entry.
 *
 * Kept as pure utilities (no Svelte state) so they compose cleanly from
 * the DetailView export menu + future AI tools / MCP endpoints.
 */

import type { Draft, DraftVersion } from '../types';

/**
 * Assemble the user-facing Markdown for a draft. The title becomes an H1;
 * the version body is appended verbatim. We trim trailing whitespace so
 * the clipboard doesn't end with empty lines.
 */
export function draftToMarkdown(draft: Draft, version: DraftVersion | null): string {
	const title = draft.title || draft.briefing.topic || 'Unbenannt';
	const body = (version?.content ?? '').trimEnd();
	return `# ${title}\n\n${body}\n`.trimEnd() + '\n';
}

export function draftToPlainText(draft: Draft, version: DraftVersion | null): string {
	const title = draft.title || draft.briefing.topic || 'Unbenannt';
	const body = (version?.content ?? '').trimEnd();
	return `${title}\n\n${body}\n`.trimEnd() + '\n';
}

/**
 * Browser-safe file download via a synthetic anchor. Revokes the blob
 * URL asynchronously so the download completes first; Safari + Firefox
 * are both fine with revoke-on-next-tick.
 */
export function downloadFile(filename: string, content: string, mime: string): void {
	if (typeof document === 'undefined') return;
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Sanitise a draft title into a valid, short filename stem. */
export function fileStem(title: string): string {
	const cleaned = title
		.normalize('NFKD')
		.replace(/[^\w\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')
		.toLowerCase()
		.slice(0, 80);
	return cleaned || 'draft';
}

/**
 * Wrapper around the Clipboard API with a fallback for insecure
 * contexts (HTTP on anything other than localhost). Returns true on
 * success so the caller can show a "Kopiert" confirmation.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard && window.isSecureContext) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {
		// fall through to the legacy path
	}
	// Legacy fallback — works on http, deprecated but still widely
	// supported. The hidden textarea avoids layout shift.
	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.setAttribute('readonly', '');
	textarea.style.position = 'fixed';
	textarea.style.top = '-1000px';
	textarea.style.opacity = '0';
	document.body.appendChild(textarea);
	textarea.select();
	try {
		document.execCommand('copy');
		document.body.removeChild(textarea);
		return true;
	} catch {
		document.body.removeChild(textarea);
		return false;
	}
}
