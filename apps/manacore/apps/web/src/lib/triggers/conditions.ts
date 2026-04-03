/**
 * Trigger Condition Evaluator
 *
 * Evaluates whether a data record matches a condition rule.
 */

export type ConditionOp = 'contains' | 'equals' | 'startsWith' | 'matches';

export function evaluateCondition(
	data: Record<string, unknown>,
	field: string,
	op: ConditionOp,
	value: string
): boolean {
	const fieldValue = String(data[field] ?? '').toLowerCase();
	const checkValue = value.toLowerCase();
	switch (op) {
		case 'contains':
			return fieldValue.includes(checkValue);
		case 'equals':
			return fieldValue === checkValue;
		case 'startsWith':
			return fieldValue.startsWith(checkValue);
		case 'matches':
			try {
				return new RegExp(checkValue, 'i').test(String(data[field] ?? ''));
			} catch {
				return false;
			}
		default:
			return false;
	}
}
