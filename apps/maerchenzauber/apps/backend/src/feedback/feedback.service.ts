import { Injectable } from '@nestjs/common';
import { SupabaseProvider } from '../supabase/supabase.provider';
import { CreateFeedbackDto, FeedbackQueryDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private supabaseProvider: SupabaseProvider) {}

  async createFeedback(userId: string, dto: CreateFeedbackDto) {
    const supabase = this.supabaseProvider.getClient();

    const { data, error } = await supabase
      .from('user_feedback')
      .insert([
        {
          user_id: userId,
          title: dto.title,
          feedback_text: dto.feedbackText,
          category: dto.category || 'feature',
          source: 'mobile',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[FeedbackService] Error creating feedback:', error);
      throw error;
    }

    return {
      success: true,
      feedback: data,
    };
  }

  async getPublicFeedback(userId: string, query: FeedbackQueryDto) {
    const supabase = this.supabaseProvider.getClient();

    // Build query
    let feedbackQuery = supabase
      .from('user_feedback')
      .select('*')
      .eq('is_public', true);

    // Filter by status if provided
    if (query.status) {
      feedbackQuery = feedbackQuery.eq('status', query.status);
    }

    // Filter by category if provided
    if (query.category) {
      feedbackQuery = feedbackQuery.eq('category', query.category);
    }

    // Sort
    if (query.sort === 'recent') {
      feedbackQuery = feedbackQuery.order('created_at', { ascending: false });
    } else {
      // Default: sort by votes
      feedbackQuery = feedbackQuery.order('vote_count', { ascending: false });
    }

    const { data: feedback, error } = await feedbackQuery;

    if (error) {
      console.error('[FeedbackService] Error fetching public feedback:', error);
      throw error;
    }

    // Check if user has voted for each feedback item
    const feedbackIds = feedback.map((f) => f.id);
    const { data: userVotes, error: votesError } = await supabase
      .from('feedback_votes')
      .select('feedback_id')
      .eq('user_id', userId)
      .in('feedback_id', feedbackIds);

    if (votesError) {
      console.error('[FeedbackService] Error fetching user votes:', votesError);
    }

    const votedIds = new Set(userVotes?.map((v) => v.feedback_id) || []);

    // Map feedback with user vote status
    const feedbackWithVotes = feedback.map((item) => ({
      id: item.id,
      title: item.title,
      feedbackText: item.feedback_text,
      category: item.category,
      status: item.status,
      voteCount: item.vote_count,
      userHasVoted: votedIds.has(item.id),
      adminResponse: item.admin_response,
      createdAt: item.created_at,
      completedAt: item.completed_at,
    }));

    return feedbackWithVotes;
  }

  async getMyFeedback(userId: string) {
    const supabase = this.supabaseProvider.getClient();

    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[FeedbackService] Error fetching user feedback:', error);
      throw error;
    }

    // Check if user has voted for each feedback item
    const feedbackIds = data.map((f) => f.id);
    const { data: userVotes, error: votesError } = await supabase
      .from('feedback_votes')
      .select('feedback_id')
      .eq('user_id', userId)
      .in('feedback_id', feedbackIds);

    if (votesError) {
      console.error('[FeedbackService] Error fetching user votes:', votesError);
    }

    const votedIds = new Set(userVotes?.map((v) => v.feedback_id) || []);

    return data.map((item) => ({
      id: item.id,
      title: item.title,
      feedbackText: item.feedback_text,
      category: item.category,
      status: item.status,
      isPublic: item.is_public,
      voteCount: item.vote_count,
      userHasVoted: votedIds.has(item.id),
      adminResponse: item.admin_response,
      createdAt: item.created_at,
      completedAt: item.completed_at,
    }));
  }

  async voteFeedback(userId: string, feedbackId: string) {
    const supabase = this.supabaseProvider.getClient();

    // Check if feedback is public
    const { data: feedback, error: feedbackError } = await supabase
      .from('user_feedback')
      .select('is_public')
      .eq('id', feedbackId)
      .single();

    if (feedbackError || !feedback?.is_public) {
      throw new Error('Feedback not found or not public');
    }

    // Insert vote (will fail if already voted due to UNIQUE constraint)
    // The database trigger will automatically increment vote_count
    const { error } = await supabase.from('feedback_votes').insert([
      {
        feedback_id: feedbackId,
        user_id: userId,
        vote_type: 'upvote',
      },
    ]);

    if (error) {
      // Check if it's a duplicate vote error
      if (error.code === '23505') {
        throw new Error('Already voted');
      }
      console.error('[FeedbackService] Error voting:', error);
      throw error;
    }

    // Get updated vote count after trigger has run
    const { data: updatedFeedback } = await supabase
      .from('user_feedback')
      .select('vote_count')
      .eq('id', feedbackId)
      .single();

    const newVoteCount = updatedFeedback?.vote_count || 0;

    console.log(`[FeedbackService] Vote added for feedback ${feedbackId}. New count: ${newVoteCount}`);

    return {
      success: true,
      newVoteCount,
    };
  }

  async unvoteFeedback(userId: string, feedbackId: string) {
    const supabase = this.supabaseProvider.getClient();

    // Delete vote - the database trigger will automatically decrement vote_count
    const { error } = await supabase
      .from('feedback_votes')
      .delete()
      .eq('feedback_id', feedbackId)
      .eq('user_id', userId);

    if (error) {
      console.error('[FeedbackService] Error unvoting:', error);
      throw error;
    }

    // Get updated vote count after trigger has run
    const { data: updatedFeedback } = await supabase
      .from('user_feedback')
      .select('vote_count')
      .eq('id', feedbackId)
      .single();

    const newVoteCount = updatedFeedback?.vote_count || 0;

    console.log(`[FeedbackService] Vote removed for feedback ${feedbackId}. New count: ${newVoteCount}`);

    return {
      success: true,
      newVoteCount,
    };
  }
}
