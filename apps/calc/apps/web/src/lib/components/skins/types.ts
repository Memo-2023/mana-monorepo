/**
 * Shared interface for all calculator skin components.
 */
export interface CalcSkinProps {
	expression: string;
	display: string;
	error: string;
	onButton: (btn: string) => void;
	onClear: () => void;
	onBackspace: () => void;
	onEquals: () => void;
}
