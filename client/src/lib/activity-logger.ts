import { supabase } from './supabase';

// User activity types tracked in the system
export type ActivityType =
  | 'subscribed'
  | 'unsubscribed'
  | 'downloaded'
  | 'commented'
  | 'rated';

// Activity record returned from the database (after transformation)
export interface Activity {
  id: string;
  userId: string;
  activityType: ActivityType;
  title: string;
  description?: string;
  modelId?: string;
  modelName?: string;
  role: 'buyer' | 'publisher';
  metadata?: Record<string, any>;
  createdAt: string;
}

// Parameters for logging a new activity
interface LogActivityParams {
  userId: string;
  activityType: ActivityType;
  title: string;
  description?: string;
  modelId?: string;
  modelName?: string;
  role: 'buyer' | 'publisher';
  metadata?: Record<string, any>;
}

/**
 * Log a user activity to the database
 *
 * Note: This is a non-blocking operation - if logging fails, the error is logged
 * but not thrown, ensuring the main user action can still succeed.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_activities')
      .insert({
        // Transform camelCase params to snake_case for database
        user_id: params.userId,
        activity_type: params.activityType,
        title: params.title,
        description: params.description,
        model_id: params.modelId,
        model_name: params.modelName,
        role: params.role,
        metadata: params.metadata
      });

    if (error) throw error;
  } catch (error) {
    // Swallow errors - activity logging failures shouldn't break the main user action
    console.error('Error logging activity:', error);
  }
}

/**
 * Fetch user activities with pagination and role filtering
 *
 * Returns activities for a specific user and role, sorted newest first.
 * Role filtering ensures buyer activities don't show in publisher dashboard (and vice versa).
 */
export async function fetchUserActivities(
  userId: string,
  role: 'buyer' | 'publisher',
  limit: number = 20,
  offset: number = 0
): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1); // Supabase pagination (inclusive range)

    if (error) throw error;

    // Transform database snake_case to TypeScript camelCase
    return (data || []).map(activity => ({
      id: activity.id,
      userId: activity.user_id,
      activityType: activity.activity_type,
      title: activity.title,
      description: activity.description,
      modelId: activity.model_id,
      modelName: activity.model_name,
      role: activity.role,
      metadata: activity.metadata,
      createdAt: activity.created_at
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    return []; // Return empty array on error (non-blocking)
  }
}

