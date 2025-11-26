import { supabase } from '$lib/supabase';
import type { Database } from '@picture/shared/types';

type Model = Database['public']['Tables']['models']['Row'];

export async function getActiveModels() {
	const { data, error } = await supabase
		.from('models')
		.select('*')
		.eq('is_active', true)
		.order('is_default', { ascending: false });

	if (error) throw error;
	return data as Model[];
}

export async function getModelById(id: string) {
	const { data, error } = await supabase.from('models').select('*').eq('id', id).single();

	if (error) throw error;
	return data as Model;
}
