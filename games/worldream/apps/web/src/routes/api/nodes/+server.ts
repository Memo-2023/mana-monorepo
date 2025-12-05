import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ContentNode, NodeKind } from '$lib/types/content';

export const GET: RequestHandler = async ({ url, locals }) => {
	const supabase = locals.supabase;
	const kind = url.searchParams.get('kind') as NodeKind | null;
	const world_slug = url.searchParams.get('world_slug');
	const search = url.searchParams.get('search');
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const offset = parseInt(url.searchParams.get('offset') || '0');

	let query = supabase
		.from('content_nodes')
		.select('*')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (kind) {
		query = query.eq('kind', kind);
	}

	if (world_slug) {
		query = query.eq('world_slug', world_slug);
	}

	if (search) {
		query = query.textSearch('search_tsv', search);
	}

	const { data, error } = await query;

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json(data);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const supabase = locals.supabase;

	const node: Partial<ContentNode> = {
		...body,
		owner_id: session.user.id,
	};

	const { data, error } = await supabase.from('content_nodes').insert(node).select().single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json(data, { status: 201 });
};
