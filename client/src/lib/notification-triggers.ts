import { Notification, NotificationType } from "./types";
import { supabase } from "./supabase";

/**
 * Notification Trigger Utilities
 *
 * These functions create real-time notifications when important events happen in the app.
 * Each function handles a different event type (subscriptions, comments, ratings, etc.)
 */

/**
 * Internal helper: Creates a notification in the database
 *
 * Uses Supabase RPC (Remote Procedure Call) with SECURITY DEFINER privilege.
 * This allows creating notifications for OTHER users, bypassing Row Level Security (RLS).
 * RLS = Database security that normally restricts users to only access their own data.
 *
 * @returns The notification ID if successful, null if failed
 */
async function createNotificationInDB(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: notification.userId,
      p_notification_type: notification.type,
      p_title: notification.title,
      p_message: notification.message,
      p_related_model_id: notification.relatedModelId || null,
      p_related_model_name: notification.relatedModelName || null,
      p_related_discussion_id: notification.relatedDiscussionId || null,
      p_metadata: notification.metadata || null
    });

    if (error) {
      console.error('Error creating notification via RPC:', error);
      console.error('Notification data that failed:', notification);
      return null;
    }

    console.log('Notification created successfully with ID:', data);
    return data || null;
  } catch (error) {
    console.error('Exception while creating notification:', error);
    console.error('Notification data:', notification);
    return null;
  }
}

/**
 * Triggered when someone subscribes to a model
 *
 * Sends 3 types of notifications:
 * 1. To model owner: "Someone subscribed to your model"
 * 2. To collaborators: "Someone subscribed to a model you work on"
 * 3. To subscriber: Confirmation that subscription was successful
 *
 * @returns Array of created notification IDs (for tracking/debugging)
 */
export async function triggerSubscriptionNotifications(params: {
  modelId: string;
  modelName: string;
  publisherId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
}): Promise<{ success: boolean; notificationIds: string[] }> {
  const notificationIds: string[] = [];

  try {
    const ownerNotifId = await createNotificationInDB({
      userId: params.publisherId,
      type: "new_subscription",
      title: `New Subscription to ${params.modelName}`,
      message: `${params.buyerName} subscribed to your model`,
      relatedModelId: params.modelId,
      relatedModelName: params.modelName,
      metadata: {
        subscriberName: params.buyerName,
        subscriberEmail: params.buyerEmail,
        isCollaboratorModel: false,
      },
    });
    if (ownerNotifId) notificationIds.push(ownerNotifId);

    // Fetch collaborators by email from the collaborators table
    const { data: collaborators, error: collabError } = await supabase
      .from('collaborators')
      .select('email')
      .eq('model_id', params.modelId);

    if (!collabError && collaborators && collaborators.length > 0) {
      // Normalize emails for reliable matching (handles case sensitivity and whitespace)
      const collaboratorEmails = collaborators.map(c => c.email.toLowerCase().trim());

      // Convert emails to user IDs by looking up in users table
      const { data: collaboratorUsers, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('email', collaboratorEmails);

      if (!usersError && collaboratorUsers) {
        for (const collabUser of collaboratorUsers) {
          // Skip owner (they already received their own notification above)
          if (collabUser.id === params.publisherId) continue;

          const collabNotifId = await createNotificationInDB({
            userId: collabUser.id,
            type: "collaborator_subscription",
            title: `New Subscription to ${params.modelName}`,
            message: `${params.buyerName} subscribed to a model you collaborate on`,
            relatedModelId: params.modelId,
            relatedModelName: params.modelName,
            metadata: {
              subscriberName: params.buyerName,
              subscriberEmail: params.buyerEmail,
              isCollaboratorModel: true,
            },
          });
          if (collabNotifId) notificationIds.push(collabNotifId);
        }
      }
    }

    // Send confirmation notification to the buyer
    const buyerNotifId = await createNotificationInDB({
      userId: params.buyerId,
      type: "subscription_success",
      title: `Successfully Subscribed to ${params.modelName}`,
      message: "You can now access this model's API and files",
      relatedModelId: params.modelId,
      relatedModelName: params.modelName,
    });
    if (buyerNotifId) notificationIds.push(buyerNotifId);

    return { success: true, notificationIds };
  } catch (error) {
    console.error('Error in triggerSubscriptionNotifications:', error);
    return { success: false, notificationIds };
  }
}

/**
 * Triggered when someone creates a new discussion thread on a model
 *
 * Notifies the model owner and all collaborators (but not the person who posted it)
 */
export async function triggerNewDiscussionNotification(params: {
  modelId: string;
  modelName: string;
  publisherId: string;
  discussionId: string;
  posterName: string;
  posterId: string;
  discussionPreview: string;
}): Promise<{ success: boolean; notificationIds: string[] }> {
  const notificationIds: string[] = [];

  try {
    const ownerNotifId = await createNotificationInDB({
      userId: params.publisherId,
      type: "new_discussion",
      title: `New Discussion on ${params.modelName}`,
      message: `${params.posterName} started a discussion: "${params.discussionPreview.substring(0, 100)}${params.discussionPreview.length > 100 ? '...' : ''}"`,
      relatedModelId: params.modelId,
      relatedModelName: params.modelName,
      relatedDiscussionId: params.discussionId,
      metadata: {
        commenterName: params.posterName,
        commentPreview: params.discussionPreview,
      },
    });
    if (ownerNotifId) notificationIds.push(ownerNotifId);

    const { data: collaborators, error: collabError } = await supabase
      .from('collaborators')
      .select('email')
      .eq('model_id', params.modelId);

    if (!collabError && collaborators && collaborators.length > 0) {
      const collaboratorEmails = collaborators.map(c => c.email.toLowerCase().trim());

      const { data: collaboratorUsers, error: usersError } = await supabase
        .from('users')
        .select('id')
        .in('email', collaboratorEmails);

      if (!usersError && collaboratorUsers) {
        for (const collabUser of collaboratorUsers) {
          // Skip owner and the person who created the discussion (no self-notification)
          if (collabUser.id === params.publisherId || collabUser.id === params.posterId) continue;

          const collabNotifId = await createNotificationInDB({
            userId: collabUser.id,
            type: "new_discussion",
            title: `New Discussion on ${params.modelName}`,
            message: `${params.posterName} started a discussion on a model you collaborate on`,
            relatedModelId: params.modelId,
            relatedModelName: params.modelName,
            relatedDiscussionId: params.discussionId,
            metadata: {
              commenterName: params.posterName,
              commentPreview: params.discussionPreview,
            },
          });
          if (collabNotifId) notificationIds.push(collabNotifId);
        }
      }
    }

    return { success: true, notificationIds };
  } catch (error) {
    console.error('Error in triggerNewDiscussionNotification:', error);
    return { success: false, notificationIds };
  }
}

/**
 * Triggered when someone adds a comment to a discussion
 *
 * Smart notification logic:
 * - REPLY: If parentCommentUserId exists, only notify the person being replied to
 * - NEW COMMENT: If no parent, notify owner + all collaborators
 *
 * This prevents notification spam - replies are personal, new comments are broadcast
 */
export async function triggerNewCommentNotification(params: {
  modelId: string;
  modelName: string;
  publisherId: string;
  discussionId: string;
  commenterName: string;
  commenterId: string;
  commentPreview: string;
  parentCommentUserId?: string; // When present = this is a reply to that user's comment
}): Promise<{ success: boolean; notificationIds: string[] }> {
  console.log('triggerNewCommentNotification called with params:', params);
  const notificationIds: string[] = [];

  try {
    if (params.parentCommentUserId) {
      // REPLY SCENARIO: Only notify the person being replied to
      console.log('This is a REPLY to user:', params.parentCommentUserId);

      // Skip if user is replying to their own comment
      if (params.parentCommentUserId !== params.commenterId) {
        const replyNotifId = await createNotificationInDB({
          userId: params.parentCommentUserId,
          type: "comment_reply",
          title: `${params.commenterName} replied to your comment`,
          message: `"${params.commentPreview.substring(0, 100)}${params.commentPreview.length > 100 ? '...' : ''}"`,
          relatedModelId: params.modelId,
          relatedModelName: params.modelName,
          relatedDiscussionId: params.discussionId,
          metadata: {
            replyAuthor: params.commenterName,
            commentPreview: params.commentPreview,
          },
        });
        if (replyNotifId) notificationIds.push(replyNotifId);
      }
    } else {
      // NEW COMMENT SCENARIO: Broadcast to owner and all collaborators
      console.log('This is a NEW COMMENT (not a reply) - notifying owner and collaborators');

      // Notify owner (unless they're the commenter)
      if (params.publisherId !== params.commenterId) {
        console.log('Creating comment notification for model owner:', params.publisherId);
        const ownerNotifId = await createNotificationInDB({
          userId: params.publisherId,
          type: "new_comment",
          title: `New Comment on ${params.modelName}`,
          message: `${params.commenterName}: "${params.commentPreview.substring(0, 100)}${params.commentPreview.length > 100 ? '...' : ''}"`,
          relatedModelId: params.modelId,
          relatedModelName: params.modelName,
          relatedDiscussionId: params.discussionId,
          metadata: {
            commenterName: params.commenterName,
            commentPreview: params.commentPreview,
          },
        });
        if (ownerNotifId) notificationIds.push(ownerNotifId);
      }

      // Notify collaborators (skip owner and commenter to avoid duplicates)
      const { data: collaborators, error: collabError } = await supabase
        .from('collaborators')
        .select('email')
        .eq('model_id', params.modelId);

      if (!collabError && collaborators && collaborators.length > 0) {
        const collaboratorEmails = collaborators.map(c => c.email.toLowerCase().trim());

        const { data: collaboratorUsers, error: usersError } = await supabase
          .from('users')
          .select('id')
          .in('email', collaboratorEmails);

        if (!usersError && collaboratorUsers) {
          for (const collabUser of collaboratorUsers) {
            // Skip owner (notified above) and commenter (no self-notification)
            if (collabUser.id === params.publisherId || collabUser.id === params.commenterId) continue;

            const collabNotifId = await createNotificationInDB({
              userId: collabUser.id,
              type: "new_comment",
              title: `New Comment on ${params.modelName}`,
              message: `${params.commenterName} commented on a model you collaborate on`,
              relatedModelId: params.modelId,
              relatedModelName: params.modelName,
              relatedDiscussionId: params.discussionId,
              metadata: {
                commenterName: params.commenterName,
                commentPreview: params.commentPreview,
              },
            });
            if (collabNotifId) notificationIds.push(collabNotifId);
          }
        }
      }
    }

    return { success: true, notificationIds };
  } catch (error) {
    console.error('Error in triggerNewCommentNotification:', error);
    return { success: false, notificationIds };
  }
}

/**
 * Triggered when someone rates a model
 *
 * Notifies the owner and all collaborators (feedback is important for model quality!)
 */
export async function triggerNewRatingNotification(params: {
  modelId: string;
  modelName: string;
  publisherId: string;
  raterName: string;
  raterId: string;
  rating: number;
}): Promise<{ success: boolean; notificationIds: string[] }> {
  console.log('triggerNewRatingNotification called with params:', params);
  const notificationIds: string[] = [];

  try {
    console.log('Creating rating notification for model owner:', params.publisherId);
    const ownerNotifId = await createNotificationInDB({
      userId: params.publisherId,
      type: "new_rating",
      title: `New Rating for ${params.modelName}`,
      message: `${params.raterName} rated your model ${params.rating} star${params.rating !== 1 ? 's' : ''}`,
      relatedModelId: params.modelId,
      relatedModelName: params.modelName,
      metadata: {
        raterName: params.raterName,
        rating: params.rating,
      },
    });
    if (ownerNotifId) notificationIds.push(ownerNotifId);

    const { data: collaborators, error: collabError } = await supabase
      .from('collaborators')
      .select('email')
      .eq('model_id', params.modelId);

    if (!collabError && collaborators && collaborators.length > 0) {
      const collaboratorEmails = collaborators.map(c => c.email.toLowerCase().trim());

      const { data: collaboratorUsers, error: usersError } = await supabase
        .from('users')
        .select('id')
        .in('email', collaboratorEmails);

      if (!usersError && collaboratorUsers) {
        for (const collabUser of collaboratorUsers) {
          // Skip owner (notified above) and rater (no self-notification)
          if (collabUser.id === params.publisherId || collabUser.id === params.raterId) continue;

          const collabNotifId = await createNotificationInDB({
            userId: collabUser.id,
            type: "new_rating",
            title: `New Rating for ${params.modelName}`,
            message: `${params.raterName} rated a model you collaborate on ${params.rating} star${params.rating !== 1 ? 's' : ''}`,
            relatedModelId: params.modelId,
            relatedModelName: params.modelName,
            metadata: {
              raterName: params.raterName,
              rating: params.rating,
            },
          });
          if (collabNotifId) notificationIds.push(collabNotifId);
        }
      }
    }

    return { success: true, notificationIds };
  } catch (error) {
    console.error('Error in triggerNewRatingNotification:', error);
    return { success: false, notificationIds };
  }
}

/**
 * Internal helper: Generates human-readable update messages
 *
 * Converts technical field names (like "response_time") into friendly messages
 * (like "Response time updated to 250ms") for subscriber notifications
 */
function generateUpdateMessage(fieldName: string, oldValue: any, newValue: any): string {
  switch (fieldName) {
    case 'name':
      return `Model name changed from "${oldValue}" to "${newValue}"`;

    case 'version':
      return `New version ${newValue} released`;

    case 'features':
      return `Model features updated`;

    case 'response_time':
      return newValue === null
        ? `Response time set to Not Applicable`
        : `Response time updated to ${newValue}ms`;

    case 'accuracy':
      return newValue === null
        ? `Accuracy set to Not Applicable`
        : `Accuracy updated to ${newValue}%`;

    case 'api_documentation':
      return `API documentation has been updated`;

    case 'subscription_type':
      if (oldValue === 'free' && newValue === 'paid') {
        return `Subscription type changed to paid`;
      } else if (oldValue === 'paid' && newValue === 'free') {
        return `Subscription type changed to free`;
      }
      return `Subscription type updated`;

    case 'subscription_price':
      return `Subscription price changed to RM ${newValue}/month`;

    case 'detailed_description':
      return `Detailed description has been updated`;

    case 'short_description':
      return `Model description has been updated`;

    default:
      return `Model has been updated`;
  }
}

/**
 * Triggered when a model is updated by its publisher
 *
 * Notifies all active subscribers about changes (version bumps, API updates, etc.)
 * Each field change generates a separate notification with details
 *
 * NOTE: Only notifies SUBSCRIBERS (buyers), not collaborators or owners
 */
export async function triggerModelUpdateNotifications(params: {
  modelId: string;
  modelName: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}): Promise<{ success: boolean; notificationIds: string[] }> {
  const notificationIds: string[] = [];

  try {
    // Only fetch active subscriptions (buyers who are currently paying/using the model)
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('model_id', params.modelId)
      .eq('status', 'active');

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      return { success: false, notificationIds };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, notificationIds: [] };
    }

    // Generate one notification per subscriber per change
    // Example: If 3 fields changed and 10 subscribers exist, creates 30 notifications
    for (const subscription of subscriptions) {
      for (const change of params.changes) {
        const message = generateUpdateMessage(change.field, change.oldValue, change.newValue);

        const notifId = await createNotificationInDB({
          userId: subscription.user_id,
          type: "model_updated",
          title: `${params.modelName} Updated`,
          message: message,
          relatedModelId: params.modelId,
          relatedModelName: params.modelName,
          // metadata stores structured data for future use (e.g., showing diff views)
          metadata: {
            updatedField: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
          },
        });

        if (notifId) notificationIds.push(notifId);
      }
    }

    return { success: true, notificationIds };
  } catch (error) {
    console.error('Error in triggerModelUpdateNotifications:', error);
    return { success: false, notificationIds };
  }
}
