import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import type { CustomFieldData, CustomFieldSchema } from '$lib/types/customFields';

// GET /api/nodes/[slug]/custom-data - Get custom field data for a node
export const GET: RequestHandler = async ({ params, locals }) => {
	const { slug } = params;
	const session = await locals.getSession();

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Get the node with its custom data
		const { data: node, error: fetchError } = await supabase
			.from('content_nodes')
			.select('id, slug, custom_data, custom_schema, owner_id, visibility')
			.eq('slug', slug)
			.single();

		if (fetchError) {
			throw error(404, 'Node not found');
		}

		// Check permissions
		const canView =
			node.owner_id === session.user.id ||
			node.visibility === 'public' ||
			(node.visibility === 'shared' && session.user);

		if (!canView) {
			throw error(403, 'Access denied');
		}

		// Calculate formula fields if schema exists
		let processedData = node.custom_data || {};
		if (node.custom_schema) {
			processedData = await calculateFormulas(node.custom_schema, processedData);
		}

		return json({
			data: processedData,
			schema: node.custom_schema,
		});
	} catch (err) {
		console.error('Error fetching custom data:', err);
		throw error(500, 'Failed to fetch custom data');
	}
};

// PUT /api/nodes/[slug]/custom-data - Update all custom data
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { slug } = params;
	const session = await locals.getSession();

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const body = await request.json();
		const customData = body.data as CustomFieldData;

		// Get the node to check ownership and schema
		const { data: node, error: fetchError } = await supabase
			.from('content_nodes')
			.select('id, owner_id, custom_schema')
			.eq('slug', slug)
			.single();

		if (fetchError || !node) {
			throw error(404, 'Node not found');
		}

		// Check ownership
		if (node.owner_id !== session.user.id) {
			throw error(403, 'Only the owner can modify custom data');
		}

		// Validate data against schema
		if (node.custom_schema) {
			const validation = validateData(node.custom_schema, customData);
			if (!validation.valid) {
				throw error(400, JSON.stringify(validation.errors));
			}
		}

		// Update the custom data
		const { error: updateError } = await supabase
			.from('content_nodes')
			.update({
				custom_data: customData,
				updated_at: new Date().toISOString(),
			})
			.eq('slug', slug);

		if (updateError) {
			throw error(500, 'Failed to update custom data');
		}

		// Calculate formulas and return processed data
		const processedData = node.custom_schema
			? await calculateFormulas(node.custom_schema, customData)
			: customData;

		return json({
			success: true,
			data: processedData,
		});
	} catch (err) {
		console.error('Error updating custom data:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to update custom data');
	}
};

// PATCH /api/nodes/[slug]/custom-data - Partial update of custom data
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { slug } = params;
	const session = await locals.getSession();

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const body = await request.json();
		const updates = body.data as Partial<CustomFieldData>;

		// Get the current node data
		const { data: node, error: fetchError } = await supabase
			.from('content_nodes')
			.select('id, owner_id, custom_schema, custom_data')
			.eq('slug', slug)
			.single();

		if (fetchError || !node) {
			throw error(404, 'Node not found');
		}

		// Check ownership
		if (node.owner_id !== session.user.id) {
			throw error(403, 'Only the owner can modify custom data');
		}

		// Merge with existing data
		const mergedData = {
			...(node.custom_data || {}),
			...updates,
		};

		// Validate merged data against schema
		if (node.custom_schema) {
			const validation = validateData(node.custom_schema, mergedData);
			if (!validation.valid) {
				throw error(400, JSON.stringify(validation.errors));
			}
		}

		// Update the custom data
		const { error: updateError } = await supabase
			.from('content_nodes')
			.update({
				custom_data: mergedData,
				updated_at: new Date().toISOString(),
			})
			.eq('slug', slug);

		if (updateError) {
			throw error(500, 'Failed to update custom data');
		}

		// Calculate formulas and return processed data
		const processedData = node.custom_schema
			? await calculateFormulas(node.custom_schema, mergedData)
			: mergedData;

		return json({
			success: true,
			data: processedData,
		});
	} catch (err) {
		console.error('Error patching custom data:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to patch custom data');
	}
};

// Helper function to validate data against schema
function validateData(
	schema: CustomFieldSchema,
	data: CustomFieldData
): { valid: boolean; errors: any[] } {
	const errors: any[] = [];

	for (const field of schema.fields) {
		const value = data[field.key];

		// Check required fields
		if (field.required && (value === undefined || value === null || value === '')) {
			errors.push({
				field: field.key,
				message: `${field.label} is required`,
			});
			continue;
		}

		// Skip validation if field is empty and not required
		if (!field.required && (value === undefined || value === null)) {
			continue;
		}

		// Type-specific validation
		switch (field.type) {
			case 'number':
			case 'range':
				if (typeof value !== 'number') {
					errors.push({
						field: field.key,
						message: `${field.label} must be a number`,
					});
				} else {
					if (field.config.min !== undefined && value < field.config.min) {
						errors.push({
							field: field.key,
							message: `${field.label} must be at least ${field.config.min}`,
						});
					}
					if (field.config.max !== undefined && value > field.config.max) {
						errors.push({
							field: field.key,
							message: `${field.label} must be at most ${field.config.max}`,
						});
					}
				}
				break;

			case 'text':
				if (typeof value !== 'string') {
					errors.push({
						field: field.key,
						message: `${field.label} must be text`,
					});
				} else {
					if (field.config.maxLength && value.length > field.config.maxLength) {
						errors.push({
							field: field.key,
							message: `${field.label} must be at most ${field.config.maxLength} characters`,
						});
					}
					if (field.config.pattern) {
						const regex = new RegExp(field.config.pattern);
						if (!regex.test(value)) {
							errors.push({
								field: field.key,
								message: `${field.label} has invalid format`,
							});
						}
					}
				}
				break;

			case 'select':
				if (field.config.choices) {
					const validValues = field.config.choices.map((c) => c.value);
					if (!validValues.includes(value)) {
						errors.push({
							field: field.key,
							message: `${field.label} has invalid value`,
						});
					}
				}
				break;

			case 'multiselect':
				if (!Array.isArray(value)) {
					errors.push({
						field: field.key,
						message: `${field.label} must be an array`,
					});
				} else if (field.config.choices) {
					const validValues = field.config.choices.map((c) => c.value);
					for (const v of value) {
						if (!validValues.includes(v)) {
							errors.push({
								field: field.key,
								message: `${field.label} contains invalid value: ${v}`,
							});
						}
					}
				}
				break;

			case 'boolean':
				if (typeof value !== 'boolean') {
					errors.push({
						field: field.key,
						message: `${field.label} must be true or false`,
					});
				}
				break;

			case 'list':
				if (!Array.isArray(value)) {
					errors.push({
						field: field.key,
						message: `${field.label} must be a list`,
					});
				} else {
					if (field.config.min_items && value.length < field.config.min_items) {
						errors.push({
							field: field.key,
							message: `${field.label} must have at least ${field.config.min_items} items`,
						});
					}
					if (field.config.max_items && value.length > field.config.max_items) {
						errors.push({
							field: field.key,
							message: `${field.label} must have at most ${field.config.max_items} items`,
						});
					}
				}
				break;
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

// Helper function to calculate formula fields
async function calculateFormulas(
	schema: CustomFieldSchema,
	data: CustomFieldData
): Promise<CustomFieldData> {
	const result = { ...data };

	// For now, just copy formula strings as-is
	// In a real implementation, we'd evaluate them here
	for (const field of schema.fields) {
		if (field.type === 'formula' && field.config.formula) {
			// TODO: Implement actual formula evaluation
			// For now, just store the formula
			result[field.key] = `[Formula: ${field.config.formula}]`;
		}
	}

	return result;
}
