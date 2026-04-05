/**
 * Automations module — collection accessors.
 */

import { db } from '$lib/data/database';
import type { LocalAutomation } from './types';

export const automationTable = db.table<LocalAutomation>('automations');
