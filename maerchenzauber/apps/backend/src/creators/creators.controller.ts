import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@mana-core/nestjs-integration';
import { JwtPayload } from '../types/jwt-payload.interface';
import { SupabaseProvider } from '../supabase/supabase.provider';

interface CreateCreatorDto {
  name: string;
  type: 'author' | 'illustrator';
  description: string;
  systemPrompt: string;
  profilePicture?: string;
  extraPromptBeginning?: string;
  extraPromptEnd?: string;
}

interface UpdateCreatorDto extends Partial<CreateCreatorDto> {
  isActive?: boolean;
}

@Controller('creators')
export class CreatorsController {
  constructor(private readonly supabaseProvider: SupabaseProvider) {}

  /**
   * Check if user is admin (simplified - you might want to enhance this)
   */
  private isAdmin(user: JwtPayload): boolean {
    // For now, check if email ends with @memoro.de or specific admin emails
    const adminEmails = ['till@memoro.de', 'nils@memoro.de'];
    return adminEmails.includes(user.email?.toLowerCase() || '');
  }

  /**
   * Get all creators
   */
  @Get()
  async getCreators() {
    try {
      const supabase = this.supabaseProvider.getClient();
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        creators: data || [],
        total: data?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching creators:', error);
      throw new HttpException(
        'Failed to fetch creators',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get single creator by ID
   */
  @Get(':id')
  async getCreator(@Param('id') id: string) {
    try {
      const supabase = this.supabaseProvider.getClient();
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new HttpException('Creator not found', HttpStatus.NOT_FOUND);
        }
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error fetching creator:', error);
      throw new HttpException(
        'Failed to fetch creator',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create new creator (admin only)
   */
  @Post()
  @UseGuards(AuthGuard)
  async createCreator(
    @Body() createDto: CreateCreatorDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Check admin permission
    if (!this.isAdmin(user)) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    try {
      const supabase = this.supabaseProvider.getClient();

      // Generate creator_id from name
      const creatorId =
        createDto.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') +
        '-' +
        Date.now();

      const newCreator = {
        creator_id: creatorId,
        name: createDto.name,
        type: createDto.type,
        description: createDto.description,
        system_prompt: createDto.systemPrompt,
        profile_picture: createDto.profilePicture || null,
        extra_prompt_beginning: createDto.extraPromptBeginning || null,
        extra_prompt_end: createDto.extraPromptEnd || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('creators')
        .insert(newCreator)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        creator: data,
        message: 'Creator erfolgreich erstellt',
      };
    } catch (error) {
      console.error('Error creating creator:', error);
      throw new HttpException(
        'Failed to create creator',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update creator (admin only)
   */
  @Put(':id')
  @UseGuards(AuthGuard)
  async updateCreator(
    @Param('id') id: string,
    @Body() updateDto: UpdateCreatorDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Check admin permission
    if (!this.isAdmin(user)) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    try {
      const supabase = this.supabaseProvider.getClient();

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Map DTO fields to database columns
      if (updateDto.name !== undefined) updateData.name = updateDto.name;
      if (updateDto.type !== undefined) updateData.type = updateDto.type;
      if (updateDto.description !== undefined)
        updateData.description = updateDto.description;
      if (updateDto.systemPrompt !== undefined)
        updateData.system_prompt = updateDto.systemPrompt;
      if (updateDto.profilePicture !== undefined)
        updateData.profile_picture = updateDto.profilePicture;
      if (updateDto.extraPromptBeginning !== undefined)
        updateData.extra_prompt_beginning = updateDto.extraPromptBeginning;
      if (updateDto.extraPromptEnd !== undefined)
        updateData.extra_prompt_end = updateDto.extraPromptEnd;

      const { data, error } = await supabase
        .from('creators')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new HttpException('Creator not found', HttpStatus.NOT_FOUND);
        }
        throw error;
      }

      return {
        success: true,
        creator: data,
        message: 'Creator erfolgreich aktualisiert',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error updating creator:', error);
      throw new HttpException(
        'Failed to update creator',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete creator (admin only)
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteCreator(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    // Check admin permission
    if (!this.isAdmin(user)) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    try {
      const supabase = this.supabaseProvider.getClient();

      const { error } = await supabase.from('creators').delete().eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          throw new HttpException('Creator not found', HttpStatus.NOT_FOUND);
        }
        throw error;
      }

      return {
        success: true,
        message: 'Creator erfolgreich gelöscht',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error deleting creator:', error);
      throw new HttpException(
        'Failed to delete creator',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
