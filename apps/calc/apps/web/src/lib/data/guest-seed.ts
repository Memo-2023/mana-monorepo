/**
 * Guest seed data for the Calc app.
 *
 * Sample calculations loaded on first guest visit.
 */

import type { LocalCalculation } from './local-store';

export const guestCalculations: LocalCalculation[] = [
	{
		id: 'calc-demo-1',
		mode: 'standard',
		expression: '42 * 23',
		result: '966',
	},
	{
		id: 'calc-demo-2',
		mode: 'scientific',
		expression: 'sin(π/4)',
		result: '0.7071067812',
	},
	{
		id: 'calc-demo-3',
		mode: 'standard',
		expression: '1024 / 8',
		result: '128',
	},
];
