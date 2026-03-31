import { createAuthClient } from '@/supabase/supabaseClient';

/**
 * Optimized query to fetch memos filtered by multiple tags
 * Replaces N+1 query pattern with a single efficient query
 */
export async function fetchMemosByTags(tagIds: string[]): Promise<string[]> {
	const supabase = await createAuthClient();

	// Single query that gets all memos that have ALL the specified tags
	const { data, error } = await supabase.rpc('get_memos_with_all_tags', {
		tag_ids: tagIds,
	});

	if (error) {
		console.error('Error fetching memos by tags:', error);
		return [];
	}

	return data || [];
}

/**
 * SQL function to be added to Supabase:
 *
 * CREATE OR REPLACE FUNCTION get_memos_with_all_tags(tag_ids uuid[])
 * RETURNS TABLE(memo_id uuid) AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT DISTINCT mt.memo_id
 *   FROM memo_tags mt
 *   WHERE mt.tag_id = ANY(tag_ids)
 *   GROUP BY mt.memo_id
 *   HAVING COUNT(DISTINCT mt.tag_id) = array_length(tag_ids, 1);
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 */
