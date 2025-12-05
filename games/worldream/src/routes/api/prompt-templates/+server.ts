import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PromptTemplate, NodeKind } from '$lib/types/content';

export const GET: RequestHandler = async ({ url, locals }) => {
	const supabase = locals.supabase;
	const { session } = await locals.safeGetSession();
	const kind = url.searchParams.get('kind') as NodeKind | null;
	const world_slug = url.searchParams.get('world_slug');

	let query = supabase
		.from('prompt_templates')
		.select('*')
		.order('usage_count', { ascending: false });

	if (kind) {
		query = query.eq('kind', kind);
	}

	if (world_slug) {
		query = query.eq('world_slug', world_slug);
	}

	// Get user's own templates and public templates
	if (session) {
		query = query.or(`owner_id.eq.${session.user.id},is_public.eq.true`);
	} else {
		query = query.eq('is_public', true);
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

	const template: Partial<PromptTemplate> = {
		...body,
		owner_id: session.user.id,
	};

	const { data, error } = await supabase
		.from('prompt_templates')
		.insert(template)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json(data, { status: 201 });
};
