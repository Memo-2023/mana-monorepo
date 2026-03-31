export function getErrorMessage(
	error: unknown,
	fallback: string = 'Ein Fehler ist aufgetreten'
): string {
	return error instanceof Error ? error.message : fallback;
}
