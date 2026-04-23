import { z } from 'zod';

export const FormFieldSchema = z.object({
	/** Internal name — key in the submission payload. */
	name: z
		.string()
		.min(1)
		.max(40)
		.regex(/^[a-z][a-z0-9_]*$/i),
	/** Visible label above the input. */
	label: z.string().min(1).max(120),
	/** HTML input type. `textarea` renders `<textarea>`. */
	type: z.enum(['text', 'email', 'tel', 'url', 'textarea', 'number']).default('text'),
	required: z.boolean().default(false),
	placeholder: z.string().max(120).default(''),
	/** Optional helper line under the input. */
	helpText: z.string().max(280).default(''),
	/** Max length for text/textarea (default 1000). */
	maxLength: z.number().int().positive().max(10_000).default(1000),
});

export type FormField = z.infer<typeof FormFieldSchema>;

export const FormSchema = z.object({
	title: z.string().max(160).default(''),
	description: z.string().max(480).default(''),
	fields: z.array(FormFieldSchema).min(1).max(20).default([]),
	submitLabel: z.string().min(1).max(40).default('Absenden'),
	successMessage: z.string().min(1).max(400).default('Danke! Wir melden uns bald.'),
	/**
	 * Where the submission goes. `inbox` — stored server-side, owner sees
	 * it in /website/[id]/submissions (M4 default). Future targets
	 * (contacts, notify) land in M4.x when server-side tool handlers
	 * exist.
	 */
	target: z.enum(['inbox']).default('inbox'),
});

export type FormProps = z.infer<typeof FormSchema>;

export const FORM_DEFAULTS: FormProps = {
	title: 'Kontakt',
	description: '',
	fields: [
		{
			name: 'name',
			label: 'Name',
			type: 'text',
			required: true,
			placeholder: '',
			helpText: '',
			maxLength: 120,
		},
		{
			name: 'email',
			label: 'E-Mail',
			type: 'email',
			required: true,
			placeholder: 'du@beispiel.de',
			helpText: '',
			maxLength: 200,
		},
		{
			name: 'message',
			label: 'Nachricht',
			type: 'textarea',
			required: true,
			placeholder: '',
			helpText: '',
			maxLength: 2000,
		},
	],
	submitLabel: 'Absenden',
	successMessage: 'Danke! Wir melden uns bald.',
	target: 'inbox',
};
