/**
 * Calculate subtask progress as a string like "2/5".
 * Returns null if there are no subtasks.
 */
export function getSubtaskProgress(subtasks?: { isCompleted: boolean }[]): string | null {
	if (!subtasks || subtasks.length === 0) return null;
	const completed = subtasks.filter((s) => s.isCompleted).length;
	return `${completed}/${subtasks.length}`;
}
