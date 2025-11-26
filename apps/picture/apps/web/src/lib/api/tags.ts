import { supabase } from '$lib/supabase';
import type { Database } from '@picture/shared/types';

type Tag = Database['public']['Tables']['tags']['Row'];
type TagInsert = Database['public']['Tables']['tags']['Insert'];

export async function getAllTags(): Promise<Tag[]> {
	const { data, error } = await supabase
		.from('tags')
		.select('*')
		.order('name', { ascending: true });

	if (error) throw error;
	return data || [];
}

export async function createTag(tag: Omit<TagInsert, 'id' | 'created_at'>): Promise<Tag> {
	const { data, error } = await supabase
		.from('tags')
		.insert(tag)
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function updateTag(id: string, updates: Partial<TagInsert>): Promise<Tag> {
	const { data, error } = await supabase
		.from('tags')
		.update(updates)
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function deleteTag(id: string): Promise<void> {
	const { error } = await supabase
		.from('tags')
		.delete()
		.eq('id', id);

	if (error) throw error;
}

export async function getImageTags(imageId: string): Promise<Tag[]> {
	const { data, error } = await supabase
		.from('image_tags')
		.select('tag:tags(*)')
		.eq('image_id', imageId);

	if (error) throw error;
	return data?.map((item: any) => item.tag).filter(Boolean) || [];
}

export async function addTagToImage(imageId: string, tagId: string): Promise<void> {
	const { error } = await supabase
		.from('image_tags')
		.insert({ image_id: imageId, tag_id: tagId });

	if (error) throw error;
}

export async function removeTagFromImage(imageId: string, tagId: string): Promise<void> {
	const { error } = await supabase
		.from('image_tags')
		.delete()
		.eq('image_id', imageId)
		.eq('tag_id', tagId);

	if (error) throw error;
}

export async function getImagesByTag(tagId: string) {
	const { data, error } = await supabase
		.from('image_tags')
		.select('image:images(*)')
		.eq('tag_id', tagId);

	if (error) throw error;
	return data?.map((item: any) => item.image).filter(Boolean) || [];
}
