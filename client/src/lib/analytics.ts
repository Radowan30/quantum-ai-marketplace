/**
 * Analytics utility functions
 */
import { supabase } from './supabase';

/**
 * Get start of week from date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

/**
 * Format date as "4 Jan 25"
 */
function formatShortDate(date: Date): string {
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`;
}

/**
 * Get week end from week start
 */
function getWeekEnd(weekStart: Date): Date {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
}

/**
 * Aggregate views by week with date ranges
 */
export function aggregateWeeklyViews(views: any[], weeksToShow: number = 8): { week: string; dateRange: string; views: number; weekStart: Date }[] {
  const weeks: { [key: string]: { count: number; weekStart: Date } } = {};

  views.forEach(view => {
    const date = new Date(view.timestamp);
    const weekStart = getWeekStart(date);
    const weekEnd = getWeekEnd(weekStart);

    // Create date range key like "4 Jan 25 - 10 Jan 25"
    const weekKey = `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;

    if (!weeks[weekKey]) {
      weeks[weekKey] = { count: 0, weekStart };
    }
    weeks[weekKey].count++;
  });

  // Convert to array and sort by week start date
  const sortedWeeks = Object.entries(weeks)
    .map(([weekRange, data]) => ({
      week: weekRange,
      dateRange: weekRange,
      views: data.count,
      weekStart: data.weekStart
    }))
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

  // Only return the last N weeks and add week numbers
  const lastWeeks = sortedWeeks.slice(-weeksToShow);
  return lastWeeks.map((weekData, index) => ({
    ...weekData,
    week: `Week ${index + 1}`
  }));
}

/**
 * Get category distribution for a publisher
 */
export async function getCategoryDistribution(publisherId: string): Promise<{ name: string; value: number }[]> {
  // Get publisher's owned model IDs
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('id')
    .eq('publisher_id', publisherId);

  if (modelsError) {
    console.error('Error fetching models:', modelsError);
    return [];
  }

  const ownedModelIds = models?.map(m => m.id) || [];

  // Get user's email for collaborator check
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('id', publisherId)
    .single();

  if (userError) {
    console.error('Error fetching user email:', userError);
  }

  let collaboratingModelIds: string[] = [];

  // Get collaborating model IDs if we have the user's email
  if (userData?.email) {
    const { data: collaborators, error: collabError } = await supabase
      .from('collaborators')
      .select('model_id')
      .ilike('email', userData.email);

    if (collabError) {
      console.error('Error fetching collaborators:', collabError);
    } else {
      collaboratingModelIds = collaborators?.map(c => c.model_id) || [];
    }
  }

  // Combine owned and collaborating model IDs
  const allModelIds = Array.from(new Set([...ownedModelIds, ...collaboratingModelIds]));

  if (allModelIds.length === 0) {
    return [];
  }

  // Fetch categories for these models
  const { data: modelCategories, error: categoriesError } = await supabase
    .from('model_categories')
    .select(`
      categories (
        id,
        name
      )
    `)
    .in('model_id', allModelIds);

  if (categoriesError) {
    console.error('Error fetching category distribution:', categoriesError);
    return [];
  }

  if (!modelCategories || modelCategories.length === 0) {
    return [];
  }

  const distribution: { [key: string]: number } = {};

  modelCategories.forEach((mc: any) => {
    const category = mc.categories;
    if (category && category.name) {
      distribution[category.name] = (distribution[category.name] || 0) + 1;
    }
  });

  return Object.entries(distribution).map(([name, value]) => ({
    name,
    value
  }));
}

/**
 * Fetch analytics data for a publisher
 */
export async function fetchPublisherAnalytics(publisherId: string) {
  try {
    // Fetch publisher's owned models
    const { data: ownedModels, error: modelsError } = await supabase
      .from('models')
      .select('id, model_name, status, publisher_id')
      .eq('publisher_id', publisherId);

    if (modelsError) throw modelsError;

    // Get user's email for collaborator check
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', publisherId)
      .single();

    if (userError) {
      console.error('Error fetching user email:', userError);
    }

    let collaboratingModels: any[] = [];

    // Get collaborating models if we have the user's email
    if (userData?.email) {
      // First, get model IDs where user is a collaborator
      const { data: collaborators, error: collabError } = await supabase
        .from('collaborators')
        .select('model_id')
        .ilike('email', userData.email);

      if (collabError) {
        console.error('Error fetching collaborators:', collabError);
      } else if (collaborators && collaborators.length > 0) {
        const collaboratingModelIds = collaborators.map(c => c.model_id);

        // Fetch full model details for collaborating models
        const { data: collabModels, error: collabModelsError } = await supabase
          .from('models')
          .select('id, model_name, status, publisher_id')
          .in('id', collaboratingModelIds);

        if (collabModelsError) {
          console.error('Error fetching collaborating models:', collabModelsError);
        } else {
          collaboratingModels = collabModels || [];
        }
      }
    }

    // Combine owned and collaborating models (remove duplicates by id)
    const allModels = [...(ownedModels || []), ...collaboratingModels];
    const uniqueModels = Array.from(
      new Map(allModels.map(m => [m.id, m])).values()
    );

    if (uniqueModels.length === 0) {
      return {
        totalViews: 0,
        totalSubscribers: 0,
        totalModels: 0,
        categoryDistribution: [],
        weeklyViews: [],
        models: []
      };
    }

    const models = uniqueModels;
    const modelIds = models.map(m => m.id);

    // Fetch all views for publisher's models grouped by model
    const { data: allViews, error: allViewsError } = await supabase
      .from('views')
      .select('model_id')
      .in('model_id', modelIds);

    if (allViewsError) {
      console.error('Error fetching all views:', allViewsError);
    }

    // Count views per model
    const viewsByModel: { [key: string]: number } = {};
    (allViews || []).forEach((view: any) => {
      viewsByModel[view.model_id] = (viewsByModel[view.model_id] || 0) + 1;
    });

    // Fetch all subscriptions for publisher's models (active only)
    const { count: totalSubscribers, error: subsError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('model_id', modelIds)
      .eq('status', 'active');

    if (subsError) {
      console.error('Error fetching total subscribers:', subsError);
    }

    // Fetch categories for all models
    const { data: modelCategories, error: categoriesError } = await supabase
      .from('model_categories')
      .select(`
        model_id,
        categories (
          id,
          name
        )
      `)
      .in('model_id', modelIds);

    if (categoriesError) {
      console.error('Error fetching model categories:', categoriesError);
    }

    // Group categories by model_id
    const categoriesByModel: { [key: string]: string[] } = {};
    (modelCategories || []).forEach((mc: any) => {
      if (!categoriesByModel[mc.model_id]) {
        categoriesByModel[mc.model_id] = [];
      }
      if (mc.categories && mc.categories.name) {
        categoriesByModel[mc.model_id].push(mc.categories.name);
      }
    });

    // Calculate totals from actual source tables
    const totalViews = allViews?.length || 0;

    // Fetch recent views (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - (8 * 7));

    const { data: recentViews, error: viewsError } = await supabase
      .from('views')
      .select('*')
      .in('model_id', modelIds)
      .gte('timestamp', eightWeeksAgo.toISOString());

    if (viewsError) {
      console.error('Error fetching recent views:', viewsError);
    }

    // Get category distribution
    const categoryDist = await getCategoryDistribution(publisherId);

    // Aggregate weekly views (last 8 weeks)
    const weeklyViews = recentViews ? aggregateWeeklyViews(recentViews, 8) : [];

    // Transform models with their view counts and categories
    const modelsWithStats = models
      .map(model => ({
        id: model.id,
        model_name: model.model_name,
        status: model.status,
        publisher_id: model.publisher_id,
        total_views: viewsByModel[model.id] || 0,
        categories: categoriesByModel[model.id]?.join(', ') || 'Uncategorized'
      }))
      .sort((a, b) => b.total_views - a.total_views); // Sort by views descending

    return {
      totalViews,
      totalSubscribers: totalSubscribers || 0,
      totalModels: models.length,
      categoryDistribution: categoryDist,
      weeklyViews: weeklyViews,
      models: modelsWithStats
    };
  } catch (error) {
    console.error('Error fetching publisher analytics:', error);
    throw error;
  }
}

/**
 * Fetch weekly views for a specific model (last 8 weeks or since publish date)
 */
export async function fetchModelWeeklyViews(modelId: string): Promise<{ week: string; views: number; weekStart: Date }[]> {
  try {
    // Fetch model to get publish date
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('created_at')
      .eq('id', modelId)
      .single();

    if (modelError) {
      console.error('Error fetching model:', modelError);
      return [];
    }

    // Calculate start date: 8 weeks ago or model creation date, whichever is more recent
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - (8 * 7));

    const modelCreatedAt = new Date(model.created_at);
    const startDate = modelCreatedAt > eightWeeksAgo ? modelCreatedAt : eightWeeksAgo;

    // Fetch views for this model since start date
    const { data: views, error: viewsError } = await supabase
      .from('views')
      .select('*')
      .eq('model_id', modelId)
      .gte('timestamp', startDate.toISOString());

    if (viewsError) {
      console.error('Error fetching model views:', viewsError);
      return [];
    }

    return aggregateWeeklyViews(views || [], 8);
  } catch (error) {
    console.error('Error fetching model weekly views:', error);
    return [];
  }
}

