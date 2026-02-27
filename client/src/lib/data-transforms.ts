import { Model } from './types';

/**
 * Transform database model record to UI Model type
 */
export function transformDatabaseModel(dbModel: any): Model {
  // Parse categories if it's a JSON string from aggregation
  let categories = [];
  if (dbModel.categories) {
    if (typeof dbModel.categories === 'string') {
      try {
        categories = JSON.parse(dbModel.categories);
      } catch {
        categories = [];
      }
    } else if (Array.isArray(dbModel.categories)) {
      categories = dbModel.categories;
    }
  }

  // Parse and validate collaborators array
  let collaborators = [];
  if (dbModel.collaborators) {
    if (Array.isArray(dbModel.collaborators)) {
      // Map database collaborators to ensure proper structure
      collaborators = dbModel.collaborators
        .filter((collab: any) => collab && collab.email) // Filter out invalid entries
        .map((collab: any) => ({
          name: collab.name || '',
          email: collab.email,
        }));
    }
  }

  return {
    id: dbModel.id,
    name: dbModel.model_name,
    shortDescription: dbModel.short_description || '',
    detailedDescription: dbModel.detailed_description || '',
    publisherId: dbModel.publisher_id,
    publisherName: dbModel.publisher_name || 'Unknown Publisher',
    publisherEmail: dbModel.publisher_email || '',
    categories: categories,
    version: dbModel.version || '0.0.1',
    status: dbModel.status,
    price: dbModel.subscription_type || 'free',
    priceAmount: dbModel.subscription_amount,
    stats: {
      views: dbModel.total_views || 0,
      downloads: dbModel.downloads || 0,
      accuracy: dbModel.accuracy ?? null,
      responseTime: dbModel.response_time ?? null,
    },
    features: dbModel.features || [],
    updatedAt: dbModel.updated_at || dbModel.created_at,
    publishedDate: dbModel.published_on,
    collaborators: collaborators,
    apiDocumentation: dbModel.api_documentation,
    apiSpecFormat: dbModel.api_spec_format || 'text',
    liveLink: dbModel.live_link || undefined,
    pageViews30Days: dbModel.page_views_30_days || 0,
    totalViews: dbModel.total_views || 0,
    activeSubscribers: dbModel.active_subscribers || 0,
    totalSubscribers: dbModel.total_subscribers || 0,
    discussionCount: dbModel.discussion_count || 0,
    averageRating: dbModel.average_rating || 0,
    totalRatingCount: dbModel.total_rating_count || 0,
  };
}

/**
 * Transform array of database models
 */
export function transformDatabaseModels(dbModels: any[]): Model[] {
  return dbModels.map(transformDatabaseModel);
}
