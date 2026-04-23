import { db } from '$lib/data/database';
import type { LocalWebsite, LocalWebsitePage, LocalWebsiteBlock } from './types';

export const websitesTable = db.table<LocalWebsite>('websites');
export const websitePagesTable = db.table<LocalWebsitePage>('websitePages');
export const websiteBlocksTable = db.table<LocalWebsiteBlock>('websiteBlocks');
