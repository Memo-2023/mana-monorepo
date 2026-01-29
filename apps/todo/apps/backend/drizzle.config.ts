import 'dotenv/config';
import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'todo',
	outDir: './drizzle',
});
