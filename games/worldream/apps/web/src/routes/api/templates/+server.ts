import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';
import type { TemplateFilter } from '$lib/types/customFields';

// GET /api/templates - Get custom field templates
export const GET: RequestHandler = async (event) => {
	const { url, locals } = event;
	const session = await locals.getSession();
	const supabase = createClient(event);

	try {
		// Parse query parameters
		const category = url.searchParams.get('category');
		const applicableTo = url.searchParams.get('applicable_to');
		const tags = url.searchParams.get('tags')?.split(',').filter(Boolean);
		const worldSlug = url.searchParams.get('world_slug');
		const isPublic = url.searchParams.get('is_public') === 'true';
		const search = url.searchParams.get('search');
		const sortBy = url.searchParams.get('sort_by') || 'usage_count';
		const sortOrder = url.searchParams.get('sort_order') || 'desc';
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		// Build query
		let query = supabase.from('custom_field_templates').select('*');

		// Apply filters
		if (isPublic) {
			query = query.eq('is_public', true);
		} else if (session?.user) {
			// Show public templates and user's own templates
			query = query.or(`is_public.eq.true,author_id.eq.${session.user.id}`);
		} else {
			// Only public templates for anonymous users
			query = query.eq('is_public', true);
		}

		if (category) {
			query = query.eq('category', category);
		}

		if (applicableTo) {
			query = query.contains('applicable_to', [applicableTo]);
		}

		if (tags && tags.length > 0) {
			query = query.overlaps('tags', tags);
		}

		if (worldSlug) {
			query = query.eq('world_slug', worldSlug);
		}

		if (search) {
			query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
		}

		// Apply sorting
		const validSortFields = ['usage_count', 'created_at', 'updated_at', 'name'];
		if (validSortFields.includes(sortBy)) {
			query = query.order(sortBy, { ascending: sortOrder === 'asc' });
		}

		// Apply pagination
		query = query.range(offset, offset + limit - 1);

		const { data: templates, error: fetchError } = await query;

		if (fetchError) {
			console.error('Error fetching templates:', fetchError);
			throw error(500, 'Failed to fetch templates');
		}

		return json({
			templates: templates || [],
			total: templates?.length || 0,
			limit,
			offset,
		});
	} catch (err) {
		console.error('Error in templates endpoint:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Internal server error');
	}
};

// POST /api/templates - Create a new template
export const POST: RequestHandler = async (event) => {
	const { request, locals } = event;
	const session = await locals.getSession();

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	const supabase = createClient(event);

	try {
		const body = await request.json();

		// Validate required fields
		if (!body.name || !body.slug || !body.fields || !Array.isArray(body.fields)) {
			throw error(400, 'Missing required fields');
		}

		// Create template
		const { data: template, error: createError } = await supabase
			.from('custom_field_templates')
			.insert({
				...body,
				author_id: session.user.id,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (createError) {
			if (createError.code === '23505') {
				// Unique constraint violation
				throw error(409, 'A template with this slug already exists');
			}
			throw error(500, 'Failed to create template');
		}

		return json(template);
	} catch (err) {
		console.error('Error creating template:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Internal server error');
	}
};
