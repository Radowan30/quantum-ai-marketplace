export type UserRole = 'buyer' | 'publisher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_name?: string;
  phone?: string;
  bio?: string;
}

export type SubscriptionStatus = 'active' | 'cancelled';

export interface Subscription {
  id: string;
  modelId: string;
  buyerId: string;
  status: SubscriptionStatus;
  subscribedAt: string;
  cancelledAt?: string;
}

export type ModelStatus = 'draft' | 'published';

export interface Category {
  id: string;
  name: string;
  is_custom: boolean;
}

export interface Collaborator {
  name: string;
  email: string;
}

export interface Model {
  id: string;
  name: string;
  shortDescription: string; // Brief summary (max 700 chars)
  detailedDescription: string; // Full detailed description
  publisherId: string;
  publisherName: string;
  publisherEmail: string;
  categories: Category[]; // Array of categories from junction table
  version: string;
  status: ModelStatus;
  price: 'free' | 'paid';
  priceAmount?: number; // Price in MYR (only for paid models)
  stats: {
    views: number;
    downloads: number;
    accuracy: number;
    responseTime: number; // in ms
  };
  features: string[];
  updatedAt: string;
  publishedDate: string;
  collaborators?: Collaborator[]; // Array of collaborators with name and email
  apiDocumentation?: string; // API docs in markdown, JSON, or plain text
  apiSpecFormat?: "json" | "yaml" | "markdown" | "text"; // Format of API specification
  liveLink?: string; // Optional URL to a live hosted version of the model
  pageViews30Days: number;
  totalViews: number;
  activeSubscribers: number;
  totalSubscribers: number;
  discussionCount: number;
  averageRating: number;
  totalRatingCount: number;
}

export interface Comment {
  id: string;
  modelId: string;
  userId: string;
  userName: string;
  content: string;
  date: string;
  parentCommentId?: string | null;
  recipientUserId?: string | null;
  recipientUserName?: string | null;
}

export interface Discussion {
  id: string;
  modelId: string;
  userId: string;
  userName: string;
  title?: string;
  content: string;
  date: string;
  replies?: Comment[];
}

export type NotificationType =
  | 'new_subscription'           // Publisher: new subscriber to owned model
  | 'collaborator_subscription'  // Publisher: new subscriber to collaborator model
  | 'new_discussion'             // Publisher: new discussion on their model
  | 'new_comment'                // Publisher: new comment on their model
  | 'comment_reply'              // Publisher/Buyer: reply to their comment
  | 'new_rating'                 // Publisher: new rating on their model
  | 'subscription_success'       // Buyer: successfully subscribed
  | 'model_updated';             // Buyer: subscribed model updated

export interface Notification {
  id: string;
  userId: string; // Recipient
  type: NotificationType;
  title: string;
  message: string;
  relatedModelId?: string;
  relatedModelName?: string;
  relatedDiscussionId?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    subscriberName?: string;
    subscriberEmail?: string;
    isCollaboratorModel?: boolean;
    raterName?: string;
    rating?: number;
    oldRating?: number;
    newRating?: number;
    commenterName?: string;
    commentPreview?: string;
    replyAuthor?: string;
    updatedFields?: string[];
    updatedField?: string;
    oldValue?: any;
    newValue?: any;
  };
}
