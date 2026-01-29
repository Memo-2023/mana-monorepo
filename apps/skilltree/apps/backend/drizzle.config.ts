import 'dotenv/config';
import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'skilltree',
	outDir: './drizzle',
});
