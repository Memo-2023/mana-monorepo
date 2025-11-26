import { Injectable } from '@nestjs/common';
import { SupabaseProvider } from '../../supabase/supabase.provider';
import { RequestContextService } from '../../common/services/request-context.service';

@Injectable()
export class SupabaseJsonbAuthService {
  constructor(
    private supabaseProvider: SupabaseProvider,
    private requestContextService: RequestContextService,
  ) {}

  /* Character Methods with Authentication */

  async createCharacter(userId: string, characterData: any, token?: string) {
    // If token is provided, store it in context
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    // Initialize empty images array if not provided
    if (!characterData.images_data) {
      characterData.images_data = [];
    }

    // Log debug info
    console.log('createCharacter - userId:', userId);
    console.log(
      'createCharacter - has token from context:',
      !!this.requestContextService.getToken(),
    );

    // Direct insert with authenticated client - RLS will handle permissions
    const { data, error } = await supabase
      .from('characters')
      .insert([{ ...characterData, user_id: userId }])
      .select()
      .single();

    if (error) {
      console.error('createCharacter error:', error);
      throw error;
    }

    console.log('createCharacter success - character id:', data?.id);
    return data;
  }

  async getCharacterById(id: string, token?: string) {
    // If token is provided, store it in context
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    // Log for debugging
    console.log('getCharacterById - id:', id);
    console.log(
      'getCharacterById - has token from context:',
      !!this.requestContextService.getToken(),
    );

    // The authenticated client should already have the user's token
    // so RLS will be automatically applied
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('getCharacterById error:', error);
      throw error;
    }

    console.log('getCharacterById success - found character:', !!data);
    return data;
  }

  async getUserCharacters(userId: string, token?: string, includeArchived: boolean = false) {
    // If token is provided, store it in context
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log('getUserCharacters - userId:', userId);
    console.log('getUserCharacters - includeArchived:', includeArchived);
    console.log(
      'getUserCharacters - has token from context:',
      !!this.requestContextService.getToken(),
    );

    // With RLS, this should automatically filter to the authenticated user's characters
    // Conditionally filter out archived characters based on includeArchived parameter
    let query = supabase
      .from('characters')
      .select('*');

    // Only filter out archived characters if includeArchived is false
    // Include characters where archived is NULL or false (not explicitly archived)
    if (!includeArchived) {
      query = query.or('archived.is.null,archived.eq.false');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('getUserCharacters error:', error);
      throw error;
    }

    console.log(
      'getUserCharacters success - found characters:',
      data?.length || 0,
    );
    return data || [];
  }

  async updateCharacter(characterId: string, updateData: any, token?: string) {
    // If token is provided, store it in context
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log('updateCharacter - characterId:', characterId);
    console.log('updateCharacter - updateData:', JSON.stringify(updateData));
    console.log(
      'updateCharacter - has token from context:',
      !!this.requestContextService.getToken(),
    );

    // Map frontend fields to database columns
    const mappedData: any = {
      updated_at: new Date().toISOString(),
    };

    // Only include fields that exist in the database
    if (updateData.name !== undefined) mappedData.name = updateData.name;
    if (updateData.original_description !== undefined)
      mappedData.original_description = updateData.original_description;
    if (updateData.character_description_prompt !== undefined)
      mappedData.character_description_prompt =
        updateData.character_description_prompt;
    if (updateData.image_url !== undefined)
      mappedData.image_url = updateData.image_url;
    if (updateData.source_image_url !== undefined)
      mappedData.source_image_url = updateData.source_image_url;
    if (updateData.is_animal !== undefined)
      mappedData.is_animal = updateData.is_animal;
    if (updateData.animal_type !== undefined)
      mappedData.animal_type = updateData.animal_type;
    if (updateData.images_data !== undefined)
      mappedData.images_data = updateData.images_data;

    // Publishing and sharing fields
    if (updateData.is_published !== undefined)
      mappedData.is_published = updateData.is_published;
    if (updateData.sharing_preference !== undefined)
      mappedData.sharing_preference = updateData.sharing_preference;
    if (updateData.published_at !== undefined)
      mappedData.published_at = updateData.published_at;
    if (updateData.share_code !== undefined)
      mappedData.share_code = updateData.share_code;

    // Archiving field
    if (updateData.archived !== undefined)
      mappedData.archived = updateData.archived;

    // Also check for snake_case versions (in case frontend sends them)
    if (updateData.originalDescription !== undefined)
      mappedData.original_description = updateData.originalDescription;
    if (updateData.characterDescriptionPrompt !== undefined)
      mappedData.character_description_prompt =
        updateData.characterDescriptionPrompt;
    if (updateData.imageUrl !== undefined)
      mappedData.image_url = updateData.imageUrl;
    if (updateData.sourceImageUrl !== undefined)
      mappedData.source_image_url = updateData.sourceImageUrl;
    if (updateData.isAnimal !== undefined)
      mappedData.is_animal = updateData.isAnimal;
    if (updateData.animalType !== undefined)
      mappedData.animal_type = updateData.animalType;
    if (updateData.imagesData !== undefined)
      mappedData.images_data = updateData.imagesData;

    console.log('updateCharacter - mapped data:', JSON.stringify(mappedData));

    // Direct update with authenticated client - RLS will handle permissions
    const { data, error } = await supabase
      .from('characters')
      .update(mappedData)
      .eq('id', characterId)
      .select()
      .single();

    if (error) {
      console.error('updateCharacter Supabase error:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', Object.keys(error || {}));

      // Create a proper error object
      const errorObj = new Error(
        error?.message || error?.toString() || 'Database update failed',
      );
      (errorObj as any)['code'] = error?.code;
      (errorObj as any)['details'] = error?.details;
      (errorObj as any)['hint'] = error?.hint;
      throw errorObj;
    }

    console.log('updateCharacter success');
    return data;
  }

  async deleteCharacter(characterId: string, token?: string) {
    // If token is provided, store it in context
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log('deleteCharacter - characterId:', characterId);
    console.log(
      'deleteCharacter - has token from context:',
      !!this.requestContextService.getToken(),
    );

    // Direct delete with authenticated client - RLS will handle permissions
    const { data, error } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId)
      .select()
      .single();

    if (error) {
      console.error('deleteCharacter error:', error);
      throw error;
    }

    console.log('deleteCharacter success');
    return data;
  }

  /**
   * Get a shared character (authenticated endpoint)
   * Uses admin client to bypass RLS and fetch any character by ID
   * User must be authenticated, but backend uses service account for database access
   */
  async getSharedCharacter(characterId: string) {
    // Use admin client to bypass RLS - allows fetching any character
    const supabase = this.supabaseProvider.getAdminClient();

    console.log('getSharedCharacter - characterId:', characterId);

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (error) {
      console.error('getSharedCharacter error:', error);
      throw error;
    }

    console.log('getSharedCharacter success - fetched with service account');
    return data;
  }

  /**
   * Import/copy a shared character to the user's library
   * Creates a new character with a new ID owned by the importing user
   */
  async importCharacter(
    characterId: string,
    userId: string,
    token: string,
  ) {
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log(
      `importCharacter - user ${userId} importing character ${characterId}`,
    );

    // First, get the original character
    const originalCharacter = await this.getSharedCharacter(characterId);

    if (!originalCharacter) {
      throw new Error('Character not found or not available for sharing');
    }

    // Check if user is trying to import their own character
    if (originalCharacter.user_id === userId) {
      throw new Error('Cannot import your own character');
    }

    // Check if user already imported this character
    const { data: existingImport } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', userId)
      .eq('cloned_from', characterId)
      .single();

    if (existingImport) {
      throw new Error('You have already imported this character');
    }

    // Create new character data (copy of original but with new user_id and id)
    const newCharacterData = {
      name: originalCharacter.name,
      user_description: originalCharacter.user_description,
      character_description: originalCharacter.character_description,
      character_description_prompt: originalCharacter.character_description_prompt,
      image_url: originalCharacter.image_url,
      source_image_url: originalCharacter.source_image_url,
      blur_hash: originalCharacter.blur_hash,
      images_data: originalCharacter.images_data,
      is_animal: originalCharacter.is_animal,
      animal_type: originalCharacter.animal_type,
      // Sharing fields - keep as private by default
      is_published: false,
      sharing_preference: 'private',
      // Track import metadata (using existing cloned_from field)
      cloned_from: originalCharacter.id,
      imported_from_user_id: originalCharacter.user_id,
      imported_at: new Date().toISOString(),
    };

    // Create the character using the existing createCharacter method
    const importedCharacter = await this.createCharacter(
      userId,
      newCharacterData,
      token,
    );

    // Increment the times_shared counter on the original character
    await supabase
      .from('characters')
      .update({
        times_shared: (originalCharacter.times_shared || 0) + 1,
      })
      .eq('id', characterId);

    console.log(
      `importCharacter success - new character id: ${importedCharacter.id}`,
    );
    return importedCharacter;
  }

  /* Story Methods with Authentication */

  async createStory(userId: string, storyData: any, token?: string) {
    // If token is provided, store it in context
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log('createStory - userId:', userId);
    console.log(
      'createStory - has token from context:',
      !!this.requestContextService.getToken(),
    );

    // Direct insert with authenticated client - RLS will handle permissions
    const { data, error } = await supabase
      .from('stories')
      .insert([{ ...storyData, user_id: userId }])
      .select()
      .single();

    if (error) {
      console.error('createStory error:', error);
      throw error;
    }

    console.log('createStory success - story id:', data?.id);
    return data;
  }

  async getStoryById(id: string, token?: string) {
    // If token is provided, store it in context
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log('getStoryById - id:', id);
    console.log(
      'getStoryById - has token from context:',
      !!this.requestContextService.getToken(),
    );

    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('getStoryById error:', error);
      throw error;
    }

    console.log('getStoryById success');
    return data;
  }

  async getUserStories(userId: string, token?: string, includeArchived: boolean = false) {
    // If token is provided, store it in context
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log('getUserStories - userId:', userId);
    console.log('getUserStories - includeArchived:', includeArchived);
    console.log(
      'getUserStories - has token from context:',
      !!this.requestContextService.getToken(),
    );

    // Fetch both user's own stories and central/public stories
    // The RLS policy will handle filtering based on visibility
    // Conditionally filter out archived stories based on includeArchived parameter
    let query = supabase
      .from('stories')
      .select('*');

    // Only filter out archived stories if includeArchived is false
    if (!includeArchived) {
      query = query.not('archived', 'eq', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('getUserStories error:', error);
      throw error;
    }

    console.log('getUserStories success - found stories:', data?.length || 0);
    return data || [];
  }

  async getCentralStories(token?: string) {
    // If token is provided, store it in context
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log('getCentralStories - fetching central stories');

    // Get stories from the central-stories collection
    const { data: collectionData, error: collectionError } = await supabase
      .from('story_collections')
      .select('id')
      .eq('slug', 'central-stories')
      .eq('is_active', true)
      .single();

    if (collectionError || !collectionData) {
      console.log('No central stories collection found');
      return [];
    }

    // Get stories in the collection with their positions
    const { data, error } = await supabase
      .from('collection_stories')
      .select(
        `
        position,
        stories (*)
      `,
      )
      .eq('collection_id', collectionData.id)
      .order('position', { ascending: true });

    if (error) {
      console.error('getCentralStories error:', error);
      throw error;
    }

    // Extract stories from the joined data
    const stories =
      data?.map((item) => ({
        ...item.stories,
        collection_position: item.position,
        is_central: true,
      })) || [];

    console.log('getCentralStories success - found stories:', stories.length);
    return stories;
  }

  async getPublicStories(
    token?: string,
    filter: 'popular' | 'new' | 'featured' = 'popular',
    page = 1,
    limit = 20,
  ) {
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();
    const offset = (page - 1) * limit;

    console.log(
      `getPublicStories - filter: ${filter}, page: ${page}, limit: ${limit}`,
    );

    let query = supabase
      .from('stories')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .eq('sharing_preference', 'public')
      .range(offset, offset + limit - 1);

    // Apply filter-specific sorting
    switch (filter) {
      case 'popular':
        // Order by published_at first (since vote_count may not exist yet)
        query = query
          .order('published_at', { ascending: false })
          .order('created_at', { ascending: false });
        break;
      case 'new':
        query = query
          .order('published_at', { ascending: false })
          .order('created_at', { ascending: false });
        break;
      case 'featured':
        // For featured, use published date
        query = query
          .order('published_at', { ascending: false })
          .order('created_at', { ascending: false });
        break;
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('getPublicStories database error:', error);
      console.error('getPublicStories error details:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details,
      });
      throw error;
    }

    console.log(
      `getPublicStories success - found ${
        data?.length || 0
      } stories, total: ${count}`,
    );
    console.log('Stories data sample:', data?.slice(0, 2));

    return {
      stories: data || [],
      total: count || 0,
      hasMore: offset + limit < (count || 0),
    };
  }

  async getStoryCollections(token?: string) {
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log('getStoryCollections - fetching collections');

    const { data, error } = await supabase
      .from('story_collections')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('getStoryCollections error:', error);
      throw error;
    }

    console.log(
      'getStoryCollections success - found collections:',
      data?.length || 0,
    );
    return data || [];
  }

  async getCollectionStories(collectionId: string, token?: string) {
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log(
      `getCollectionStories - fetching stories for collection ${collectionId}`,
    );

    const { data, error } = await supabase
      .from('collection_stories')
      .select(
        `
        position,
        stories (*)
      `,
      )
      .eq('collection_id', collectionId)
      .order('position', { ascending: true });

    if (error) {
      console.error('getCollectionStories error:', error);
      throw error;
    }

    // Extract stories from the joined data
    const stories =
      data?.map((item) => ({
        ...item.stories,
        collection_position: item.position,
      })) || [];

    console.log(
      'getCollectionStories success - found stories:',
      stories.length,
    );
    return stories;
  }

  async voteForStory(
    storyId: string,
    userId: string,
    voteType: 'like' | 'love' | 'star' = 'like',
    token?: string,
  ) {
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log(
      `voteForStory - user ${userId} voting for story ${storyId} with type ${voteType}`,
    );

    // Insert vote
    const { data: voteData, error: voteError } = await supabase
      .from('story_votes')
      .insert({
        story_id: storyId,
        user_id: userId,
        vote_type: voteType,
      })
      .select()
      .single();

    if (voteError) {
      // Check if it's a duplicate vote
      if (voteError.code === '23505') {
        // Unique constraint violation
        console.log('User has already voted for this story');
        return { alreadyVoted: true };
      }
      console.error('voteForStory error:', voteError);
      throw voteError;
    }

    console.log('voteForStory success');
    return voteData;
  }

  async unvoteStory(storyId: string, userId: string, token?: string) {
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log(
      `unvoteStory - user ${userId} removing vote from story ${storyId}`,
    );

    const { error } = await supabase
      .from('story_votes')
      .delete()
      .eq('story_id', storyId)
      .eq('user_id', userId);

    if (error) {
      console.error('unvoteStory error:', error);
      throw error;
    }

    console.log('unvoteStory success');
    return { success: true };
  }

  async getStoriesWithCollections(userId: string, token?: string) {
    // If token is provided, store it in context
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log('getStoriesWithCollections - userId:', userId);

    // Get user's own stories
    const { data: userStories, error: userError } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (userError) {
      console.error('getStoriesWithCollections user stories error:', userError);
      throw userError;
    }

    // Get central stories
    const centralStories = await this.getCentralStories(token);

    // Combine and mark them appropriately
    const result = {
      userStories: userStories || [],
      centralStories: centralStories || [],
      allStories: [...(centralStories || []), ...(userStories || [])],
    };

    console.log(
      'getStoriesWithCollections success - user:',
      result.userStories.length,
      'central:',
      result.centralStories.length,
    );
    return result;
  }

  async updateStory(storyId: string, updateData: any, token?: string) {
    // If token is provided, store it in context
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log('updateStory - storyId:', storyId);
    console.log(
      'updateStory - has token from context:',
      !!this.requestContextService.getToken(),
    );

    const { data, error } = await supabase
      .from('stories')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', storyId)
      .select()
      .single();

    if (error) {
      console.error('updateStory error:', error);
      throw error;
    }

    console.log('updateStory success');
    return data;
  }

  async deleteStory(storyId: string, token?: string) {
    // If token is provided, store it in context
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log('deleteStory - storyId:', storyId);
    console.log(
      'deleteStory - has token from context:',
      !!this.requestContextService.getToken(),
    );

    const { data, error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId)
      .select()
      .single();

    if (error) {
      console.error('deleteStory error:', error);
      throw error;
    }

    console.log('deleteStory success');
    return data;
  }

  /* Public Character Methods */

  async getPublicCharacters(
    filter = 'popular',
    limit = 20,
    offset = 0,
    collectionId?: string,
  ) {
    const supabase = this.supabaseProvider.getClient();

    console.log(
      `getPublicCharacters - filter: ${filter}, limit: ${limit}, offset: ${offset}`,
    );

    let query = supabase
      .from('characters')
      .select('*')
      .eq('sharing_preference', 'public')
      .eq('is_published', true)
      .range(offset, offset + limit - 1);

    // Apply sorting based on filter
    switch (filter) {
      case 'popular':
        query = query.order('total_vote_score', { ascending: false });
        break;
      case 'new':
        query = query.order('published_at', { ascending: false });
        break;
      case 'featured':
        // For now, featured is same as popular
        // Later we can add a featured flag
        query = query.order('total_vote_score', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Collection filtering can be added later if needed

    const { data, error } = await query;

    if (error) {
      console.error('getPublicCharacters error:', error);
      throw error;
    }

    console.log(
      `getPublicCharacters success - found ${data?.length || 0} characters`,
    );
    return data || [];
  }

  async getPublicCharacterById(characterId: string) {
    const supabase = this.supabaseProvider.getClient();

    console.log('getPublicCharacterById - characterId:', characterId);

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .in('sharing_preference', ['public', 'link_only'])
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('getPublicCharacterById error:', error);
      return null;
    }

    console.log('getPublicCharacterById success');
    return data;
  }

  async getCharacterByShareCode(shareCode: string) {
    const supabase = this.supabaseProvider.getClient();

    console.log('getCharacterByShareCode - shareCode:', shareCode);

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('share_code', shareCode)
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('getCharacterByShareCode error:', error);
      return null;
    }

    console.log('getCharacterByShareCode success');
    return data;
  }

  async voteForCharacter(
    characterId: string,
    userId: string,
    voteType: 'like' | 'love' | 'star',
    token?: string,
  ) {
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log(
      `voteForCharacter - user ${userId} voting ${voteType} for character ${characterId}`,
    );

    // First check if user already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('character_votes')
      .select('*')
      .eq('character_id', characterId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error checking existing vote:', checkError);
      throw checkError;
    }

    // Calculate vote weight
    const voteWeight = voteType === 'star' ? 3 : voteType === 'love' ? 2 : 1;

    let voteData;
    let voteError;

    if (existingVote) {
      // Update existing vote
      const { data, error } = await supabase
        .from('character_votes')
        .update({
          vote_type: voteType,
          vote_weight: voteWeight,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingVote.id)
        .select()
        .single();

      voteData = data;
      voteError = error;
    } else {
      // Insert new vote
      const { data, error } = await supabase
        .from('character_votes')
        .insert([
          {
            character_id: characterId,
            user_id: userId,
            vote_type: voteType,
            vote_weight: voteWeight,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      voteData = data;
      voteError = error;
    }

    if (voteError) {
      // If character_votes table doesn't exist, just log and continue
      // This allows the system to work even before the table is created
      if (voteError.code === '42P01') {
        console.log('character_votes table does not exist yet, skipping vote');
        return { success: true, pending: true };
      }
      console.error('voteForCharacter error:', voteError);
      throw voteError;
    }

    // Update character's total vote score
    // This could be done via database trigger for better performance
    await this.updateCharacterVoteScore(characterId);

    console.log('voteForCharacter success');
    return voteData;
  }

  async removeVote(characterId: string, userId: string, token?: string) {
    if (token) {
      this.requestContextService.setToken(token);
    }

    const supabase = this.supabaseProvider.getClient();

    console.log(
      `removeVote - user ${userId} removing vote from character ${characterId}`,
    );

    const { error } = await supabase
      .from('character_votes')
      .delete()
      .eq('character_id', characterId)
      .eq('user_id', userId);

    if (error) {
      // If table doesn't exist, just log and continue
      if (error.code === '42P01') {
        console.log(
          'character_votes table does not exist yet, skipping remove vote',
        );
        return { success: true, pending: true };
      }
      console.error('removeVote error:', error);
      throw error;
    }

    // Update character's total vote score
    await this.updateCharacterVoteScore(characterId);

    console.log('removeVote success');
    return { success: true };
  }

  async updateCharacterVoteScore(characterId: string) {
    const supabase = this.supabaseProvider.getClient();

    // Calculate total vote score
    const { data: votes, error: votesError } = await supabase
      .from('character_votes')
      .select('vote_weight')
      .eq('character_id', characterId);

    if (votesError) {
      // If table doesn't exist, just skip
      if (votesError.code === '42P01') {
        return;
      }
      console.error('Error fetching votes for score update:', votesError);
      return;
    }

    const totalScore =
      votes?.reduce((sum, vote) => sum + (vote.vote_weight || 1), 0) || 0;

    // Update character with new score
    const { error: updateError } = await supabase
      .from('characters')
      .update({ total_vote_score: totalScore })
      .eq('id', characterId);

    if (updateError) {
      console.error('Error updating character vote score:', updateError);
    }
  }
}
