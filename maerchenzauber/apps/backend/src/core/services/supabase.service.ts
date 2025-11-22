import { Injectable } from '@nestjs/common';
import { SupabaseProvider } from '../../supabase/supabase.provider';

@Injectable()
export class SupabaseService {
  constructor(private supabaseProvider: SupabaseProvider) {}

  async getProjects() {
    const supabase = this.supabaseProvider.getClient();

    const { data, error } = await supabase.from('projects').select('*');

    if (error) throw error;
    return data;
  }

  async createProject(projectData: any, userId: string) {
    const supabase = this.supabaseProvider.getClient();

    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...projectData, created_by: userId }])
      .select();

    if (error) throw error;
    return data[0];
  }

  async getProject(id: string) {
    const supabase = this.supabaseProvider.getClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateProject(id: string, projectData: any) {
    const supabase = this.supabaseProvider.getClient();

    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  }

  async deleteProject(id: string) {
    const supabase = this.supabaseProvider.getClient();

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) throw error;
    return { success: true };
  }
}
