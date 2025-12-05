import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import type { CustomFieldSchema, ValidationResult } from '$lib/types/customFields';

// GET /api/nodes/[slug]/schema - Get custom field schema for a node
export const GET: RequestHandler = async ({ params, locals }) => {
	const { slug } = params;
	const session = await locals.getSession();

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Get the node with its custom schema
		const { data: node, error: fetchError } = await supabase
			.from('content_nodes')
			.select('id, slug, custom_schema, schema_version, owner_id, visibility')
			.eq('slug', slug)
			.single();

		if (fetchError) {
			throw error(404, 'Node not found');
		}

		// Check permissions
		const canView =
			node.owner_id === session.user.id ||
			node.visibility === 'public' ||
			(node.visibility === 'shared' && session.user); // TODO: Check actual share permissions

		if (!canView) {
			throw error(403, 'Access denied');
		}

		return json({
			schema: node.custom_schema || null,
			version: node.schema_version || 1,
		});
	} catch (err) {
		console.error('Error fetching schema:', err);
		throw error(500, 'Failed to fetch schema');
	}
};

// PUT /api/nodes/[slug]/schema - Update the entire schema
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { slug } = params;
	const session = await locals.getSession();

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const body = await request.json();
		const schema = body.schema as CustomFieldSchema;

		// Validate schema structure
		if (!schema || !Array.isArray(schema.fields)) {
			throw error(400, 'Invalid schema structure');
		}

		// Get the node to check ownership
		const { data: node, error: fetchError } = await supabase
			.from('content_nodes')
			.select('id, owner_id, schema_version')
			.eq('slug', slug)
			.single();

		if (fetchError || !node) {
			throw error(404, 'Node not found');
		}

		// Check ownership
		if (node.owner_id !== session.user.id) {
			throw error(403, 'Only the owner can modify the schema');
		}

		// Validate the schema using the database function
		const { data: isValid, error: validationError } = await supabase.rpc('validate_custom_schema', {
			p_schema: schema,
		});

		if (validationError || !isValid) {
			throw error(
				400,
				'Invalid schema: ' + (validationError?.message || 'Schema validation failed')
			);
		}

		// Update the schema
		const newVersion = (node.schema_version || 0) + 1;
		const { error: updateError } = await supabase
			.from('content_nodes')
			.update({
				custom_schema: schema,
				schema_version: newVersion,
				updated_at: new Date().toISOString(),
			})
			.eq('slug', slug);

		if (updateError) {
			throw error(500, 'Failed to update schema');
		}

		// If there's existing custom_data, validate it against the new schema
		// This could trigger data migration or warnings
		const { data: nodeData, error: dataError } = await supabase
			.from('content_nodes')
			.select('custom_data')
			.eq('slug', slug)
			.single();

		let validationResult: ValidationResult = { valid: true, errors: [] };
		if (nodeData?.custom_data) {
			// TODO: Implement data validation against new schema
			// For now, we'll just pass through
		}

		return json({
			success: true,
			version: newVersion,
			validation: validationResult,
		});
	} catch (err) {
		console.error('Error updating schema:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to update schema');
	}
};

// DELETE /api/nodes/[slug]/schema - Clear the schema
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { slug } = params;
	const session = await locals.getSession();

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Get the node to check ownership
		const { data: node, error: fetchError } = await supabase
			.from('content_nodes')
			.select('id, owner_id')
			.eq('slug', slug)
			.single();

		if (fetchError || !node) {
			throw error(404, 'Node not found');
		}

		// Check ownership
		if (node.owner_id !== session.user.id) {
			throw error(403, 'Only the owner can delete the schema');
		}

		// Clear the schema and data
		const { error: updateError } = await supabase
			.from('content_nodes')
			.update({
				custom_schema: null,
				custom_data: null,
				schema_version: 0,
				updated_at: new Date().toISOString(),
			})
			.eq('slug', slug);

		if (updateError) {
			throw error(500, 'Failed to clear schema');
		}

		return json({ success: true });
	} catch (err) {
		console.error('Error clearing schema:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to clear schema');
	}
};
