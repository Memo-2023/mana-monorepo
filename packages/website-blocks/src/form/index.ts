import type { BlockSpec } from '../types';
import Form from './Form.svelte';
import FormInspector from './FormInspector.svelte';
import { FormSchema, FORM_DEFAULTS, type FormProps, type FormField } from './schema';

export const formBlockSpec: BlockSpec<FormProps> = {
	type: 'form',
	label: 'Formular',
	icon: 'clipboard',
	category: 'form',
	schema: FormSchema,
	schemaVersion: 1,
	defaults: FORM_DEFAULTS,
	Component: Form,
	Inspector: FormInspector,
};

export type { FormProps, FormField };
export { FormSchema, FORM_DEFAULTS };
