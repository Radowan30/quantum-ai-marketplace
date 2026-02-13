/**
 * API helper functions for database operations
 */
import { supabase } from './supabase';
import { transformDatabaseModels, transformDatabaseModel } from './data-transforms';

/**
 * Fetch all published models with their categories and publisher info
 */
export async function fetchPublishedModels() {
  const { data, error } = await supabase
    .from('models')
    .select(`
      *,
      model_categories(
        categories(id, name, is_custom)
      ),
      users:publisher_id(
        name,
        email
      ),
      collaborators(
        name,
        email
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) {
    return [];
  }

  // Get all model IDs
  const modelIds = data.map(m => m.id);

  // Fetch all views for these models (all-time)
  const { data: allViews, error: viewsError } = await supabase
    .from('views')
    .select('model_id')
    .in('model_id', modelIds);

  if (viewsError) {
    console.error('Error fetching views:', viewsError);
  }

  // Fetch all downloads for these models
  const { data: allDownloads, error: downloadsError } = await supabase
    .from('user_activities')
    .select('model_id')
    .in('model_id', modelIds)
    .eq('activity_type', 'downloaded');

  if (downloadsError) {
    console.error('Error fetching downloads:', downloadsError);
  }

  // Group views and downloads by model_id
  const viewsByModel: { [key: string]: number } = {};
  const downloadsByModel: { [key: string]: number } = {};

  (allViews || []).forEach((view: any) => {
    viewsByModel[view.model_id] = (viewsByModel[view.model_id] || 0) + 1;
  });

  (allDownloads || []).forEach((download: any) => {
    downloadsByModel[download.model_id] = (downloadsByModel[download.model_id] || 0) + 1;
  });

  // Transform the nested categories structure and add publisher info, collaborators, and stats
  const modelsWithCategories = data.map(model => ({
    ...model,
    categories: model.model_categories?.map((mc: any) => mc.categories).filter(Boolean) || [],
    publisher_name: model.users?.name || 'Unknown Publisher',
    publisher_email: model.users?.email || '',
    collaborators: model.collaborators || [],
    total_views: viewsByModel[model.id] || 0,
    downloads: downloadsByModel[model.id] || 0
  }));

  return transformDatabaseModels(modelsWithCategories);
}

/**
 * Fetch single model by ID with its categories and publisher info
 */
export async function fetchModelById(modelId: string) {
  const { data, error } = await supabase
    .from('models')
    .select(`
      *,
      model_categories(
        categories(id, name, is_custom)
      ),
      users:publisher_id(
        name,
        email
      ),
      collaborators(
        name,
        email
      )
    `)
    .eq('id', modelId)
    .single();

  if (error) throw error;

  // Fetch statistics from source tables
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Count page views in last 30 days
  const { count: pageViews, error: viewsError } = await supabase
    .from('views')
    .select('*', { count: 'exact', head: true })
    .eq('model_id', modelId)
    .gte('timestamp', thirtyDaysAgo.toISOString());

  if (viewsError) {
    console.error('Error fetching page views count:', viewsError);
  }

  // Count all-time page views
  const { count: pageViewsTotal, error: viewsTotalError } = await supabase
    .from('views')
    .select('*', { count: 'exact', head: true })
    .eq('model_id', modelId);

  if (viewsTotalError) {
    console.error('Error fetching total page views count:', viewsTotalError);
  }

  // Count active subscriptions
  const { count: activeSubscribers, error: activeSubsError } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('model_id', modelId)
    .eq('status', 'active');

  if (activeSubsError) {
    console.error('Error fetching active subscribers count:', activeSubsError);
  }

  // Count total subscriptions
  const { count: totalSubscribers, error: totalSubsError } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('model_id', modelId);

  if (totalSubsError) {
    console.error('Error fetching total subscribers count:', totalSubsError);
  }

  // Count discussions
  const { count: discussionCount, error: discussionsError } = await supabase
    .from('discussions')
    .select('*', { count: 'exact', head: true })
    .eq('model_id', modelId);

  if (discussionsError) {
    console.error('Error fetching discussions count:', discussionsError);
  }

  // Count downloads from user_activities
  const { count: downloadCount, error: downloadsError } = await supabase
    .from('user_activities')
    .select('*', { count: 'exact', head: true })
    .eq('model_id', modelId)
    .eq('activity_type', 'downloaded');

  if (downloadsError) {
    console.error('Error fetching downloads count:', downloadsError);
  }

  // Calculate average rating from ratings table
  const { data: ratings, error: ratingsError } = await supabase
    .from('ratings')
    .select('rating_value')
    .eq('model_id', modelId);

  if (ratingsError) {
    console.error('Error fetching ratings:', ratingsError);
  }

  const totalRatings = ratings?.length || 0;
  const sumRatings = ratings?.reduce((sum, r) => sum + r.rating_value, 0) || 0;
  const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

  // Transform the nested categories structure and add publisher info, collaborators, and statistics
  const modelWithCategories = {
    ...data,
    categories: data.model_categories?.map((mc: any) => mc.categories).filter(Boolean) || [],
    publisher_name: data.users?.name || 'Unknown Publisher',
    publisher_email: data.users?.email || '',
    collaborators: data.collaborators || [],
    // Override with actual statistics from source tables
    page_views_30_days: pageViews || 0,
    total_views: pageViewsTotal || 0,
    active_subscribers: activeSubscribers || 0,
    total_subscribers: totalSubscribers || 0,
    discussion_count: discussionCount || 0,
    downloads: downloadCount || 0,
    average_rating: averageRating,
    total_rating_count: totalRatings
  };

  return transformDatabaseModel(modelWithCategories);
}

/**
 * Create a new model
 */
export async function createModel(modelData: any) {
  const { data, error } = await supabase
    .from('models')
    .insert({
      model_name: modelData.name,
      short_description: modelData.shortDescription,
      detailed_description: modelData.detailedDescription,
      version: modelData.version,
      features: modelData.features,
      response_time: modelData.responseTime,
      accuracy: modelData.accuracy,
      api_documentation: modelData.apiDocumentation,
      api_spec_format: modelData.apiSpecFormat || 'text',
      publisher_id: modelData.publisherId,
      status: modelData.status || 'draft',
      subscription_type: modelData.subscriptionType || 'free',
      subscription_amount: modelData.priceAmount,
      published_on: modelData.status === 'published' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) throw error;
  return transformDatabaseModel(data);
}

/**
 * Update an existing model
 */
export async function updateModel(modelId: string, updates: any) {
  const { data, error } = await supabase
    .from('models')
    .update({
      model_name: updates.name,
      short_description: updates.shortDescription,
      detailed_description: updates.detailedDescription,
      version: updates.version,
      features: updates.features,
      response_time: updates.responseTime,
      accuracy: updates.accuracy,
      api_documentation: updates.apiDocumentation,
      api_spec_format: updates.apiSpecFormat || 'text',
      status: updates.status,
      subscription_type: updates.subscriptionType,
      subscription_amount: updates.priceAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', modelId)
    .select()
    .single();

  if (error) throw error;
  return transformDatabaseModel(data);
}

/**
 * Insert collaborators for a model
 */
export async function insertCollaborators(modelId: string, collaborators: Array<{ name: string; email: string }>) {
  if (!collaborators || collaborators.length === 0) {
    return; // Nothing to insert
  }

  const collaboratorInserts = collaborators.map(collab => ({
    model_id: modelId,
    name: collab.name,
    email: collab.email,
  }));

  const { error } = await supabase
    .from('collaborators')
    .insert(collaboratorInserts);

  if (error) throw error;
}

/**
 * Fetch collaborators for a model
 */
export async function fetchCollaborators(modelId: string) {
  const { data, error } = await supabase
    .from('collaborators')
    .select('name, email')
    .eq('model_id', modelId)
    .order('added_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Smart update collaborators - only deletes removed and inserts new ones.
 *
 * Rules:
 * - Collaborators CAN add other collaborators
 * - Collaborators CAN remove other collaborators
 * - Collaborators CANNOT remove themselves (only owner can, or other collaborators can)
 *
 * @param modelId - The model ID
 * @param newCollaborators - The new list of collaborators
 * @param currentUserEmail - The email of the current user
 * @param isModelOwner - Whether the current user is the model owner
 * @returns Object with counts and warning flag if self-removal was attempted
 */
export async function updateCollaborators(
  modelId: string,
  newCollaborators: Array<{ name: string; email: string }>,
  currentUserEmail: string,
  isModelOwner: boolean
): Promise<{ added: number; removed: number; selfRemovalAttempted: boolean }> {
  // Fetch current collaborators
  const currentCollaborators = await fetchCollaborators(modelId);

  // Normalize emails for comparison (lowercase, trimmed)
  const normalizeEmail = (email: string) => email.toLowerCase().trim();
  const currentUserEmailNormalized = normalizeEmail(currentUserEmail);

  const currentEmails = new Set(currentCollaborators.map(c => normalizeEmail(c.email)));
  const newEmails = new Set(newCollaborators.map(c => normalizeEmail(c.email)));

  // Find collaborators to remove (in current but not in new)
  let emailsToRemove = Array.from(currentEmails).filter(email => !newEmails.has(email));

  // Check if a non-owner collaborator is trying to remove themselves
  let selfRemovalAttempted = false;
  if (!isModelOwner && emailsToRemove.includes(currentUserEmailNormalized)) {
    selfRemovalAttempted = true;
    // Prevent self-removal - keep themselves in the list
    emailsToRemove = emailsToRemove.filter(email => email !== currentUserEmailNormalized);
  }

  // Find collaborators to add (in new but not in current)
  const collaboratorsToAdd = newCollaborators.filter(
    c => !currentEmails.has(normalizeEmail(c.email))
  );

  let removed = 0;
  let added = 0;

  // Delete removed collaborators one by one (by email)
  for (const email of emailsToRemove) {
    const { error } = await supabase
      .from('collaborators')
      .delete()
      .eq('model_id', modelId)
      .ilike('email', email);

    if (error) {
      console.error(`Error removing collaborator ${email}:`, error);
    } else {
      removed++;
    }
  }

  // Insert new collaborators
  if (collaboratorsToAdd.length > 0) {
    const { error } = await supabase
      .from('collaborators')
      .insert(collaboratorsToAdd.map(c => ({
        model_id: modelId,
        name: c.name,
        email: c.email,
      })));

    if (error) {
      console.error('Error adding collaborators:', error);
      throw error;
    }
    added = collaboratorsToAdd.length;
  }

  return { added, removed, selfRemovalAttempted };
}
