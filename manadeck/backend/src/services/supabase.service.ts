import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private supabaseServiceRole: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    // Client for public operations
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // Client for service-level operations (optional, only if service key is provided)
    if (supabaseServiceKey) {
      this.supabaseServiceRole = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
    }

    this.logger.log('Supabase service initialized');
  }

  // Get client with user's token for RLS
  getClientWithUserToken(token: string): SupabaseClient {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY')!;

    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  // Example methods for deck operations
  async getUserDecks(userId: string, token?: string) {
    const client = token ? this.getClientWithUserToken(token) : this.supabase;

    const { data, error } = await client
      .from('decks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching user decks:', error);
      throw error;
    }

    return data;
  }

  async createDeck(userId: string, deckData: any, token?: string) {
    const client = token ? this.getClientWithUserToken(token) : this.supabase;

    const { data, error } = await client
      .from('decks')
      .insert({
        ...deckData,
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating deck:', error);
      throw error;
    }

    return data;
  }

  async updateDeck(deckId: string, userId: string, deckData: any, token?: string) {
    const client = token ? this.getClientWithUserToken(token) : this.supabase;

    const { data, error } = await client
      .from('decks')
      .update({
        ...deckData,
        updated_at: new Date(),
      })
      .eq('id', deckId)
      .eq('user_id', userId) // Ensure user owns the deck
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating deck:', error);
      throw error;
    }

    return data;
  }

  async deleteDeck(deckId: string, userId: string, token?: string) {
    const client = token ? this.getClientWithUserToken(token) : this.supabase;

    const { error } = await client
      .from('decks')
      .delete()
      .eq('id', deckId)
      .eq('user_id', userId); // Ensure user owns the deck

    if (error) {
      this.logger.error('Error deleting deck:', error);
      throw error;
    }

    return { success: true };
  }

  // Example methods for card operations
  async getUserCards(userId: string, token?: string) {
    const client = token ? this.getClientWithUserToken(token) : this.supabase;

    const { data, error } = await client
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching user cards:', error);
      throw error;
    }

    return data;
  }

  async createCard(userId: string, cardData: any, token?: string) {
    const client = token ? this.getClientWithUserToken(token) : this.supabase;

    const { data, error } = await client
      .from('cards')
      .insert({
        ...cardData,
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating card:', error);
      throw error;
    }

    return data;
  }

  // Public methods (no auth required)
  async getFeaturedDecks(limit = 10) {
    const { data, error } = await this.supabase
      .from('decks')
      .select('*')
      .eq('is_featured', true)
      .eq('is_public', true)
      .limit(limit)
      .order('featured_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching featured decks:', error);
      throw error;
    }

    return data;
  }

  async getLeaderboard(limit = 10) {
    const { data, error } = await this.supabase
      .from('user_stats')
      .select('*')
      .order('total_wins', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Error fetching leaderboard:', error);
      throw error;
    }

    return data;
  }

  async getDeckTemplates(category?: string) {
    let query = this.supabase
      .from('deck_templates')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('popularity', { ascending: false });

    if (error) {
      this.logger.error('Error fetching deck templates:', error);
      throw error;
    }

    return data;
  }

  // Service-level operations (using service role key)
  async adminGetAllUsers() {
    if (!this.supabaseServiceRole) {
      throw new Error('Service role key not configured');
    }

    const { data, error } = await this.supabaseServiceRole.auth.admin.listUsers();

    if (error) {
      this.logger.error('Error fetching all users:', error);
      throw error;
    }

    return data;
  }

  // Edge Function invocations
  async generateDeckWithAI(
    userId: string,
    requestData: {
      prompt: string;
      deckTitle: string;
      deckDescription?: string;
      cardCount?: number;
      cardTypes?: string[];
      difficulty?: string;
      tags?: string[];
    },
    manaToken: string,
  ) {
    if (!this.supabaseServiceRole) {
      throw new Error('Service role key not configured');
    }

    this.logger.log(`Invoking generate-deck edge function for user ${userId}`);

    const { data, error } = await this.supabaseServiceRole.functions.invoke(
      'generate-deck',
      {
        body: requestData,
        headers: {
          Authorization: `Bearer ${manaToken}`,
        },
      },
    );

    if (error) {
      this.logger.error('Error invoking generate-deck edge function:', error);
      throw error;
    }

    return data;
  }
}