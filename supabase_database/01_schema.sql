-- =====================================================
-- AI Model Marketplace - Database Schema
-- =====================================================
-- This file contains all table definitions with columns,
-- data types, defaults, and constraints
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company_name text,
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  phone text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

COMMENT ON TABLE public.users IS 'User profiles for both buyers and publishers';
COMMENT ON COLUMN public.users.phone IS 'User phone number for contact and notifications';

-- =====================================================
-- ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  role_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id),
  CONSTRAINT roles_role_name_key UNIQUE (role_name),
  CONSTRAINT roles_role_name_check CHECK (role_name = ANY (ARRAY['buyer'::text, 'publisher'::text]))
);

COMMENT ON TABLE public.roles IS 'User role definitions (buyer, publisher)';

-- =====================================================
-- USER_ROLES TABLE (Junction)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  role_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_role_id_key UNIQUE (user_id, role_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.user_roles IS 'Maps users to their roles (many-to-many relationship)';

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  is_custom boolean DEFAULT false,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_name_key UNIQUE (name),
  CONSTRAINT categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.categories IS 'Model categories (both predefined and custom)';
COMMENT ON COLUMN public.categories.is_custom IS 'True if category was created by a user, false if predefined';

-- =====================================================
-- MODELS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.models (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  model_name text NOT NULL,
  detailed_description text NOT NULL,
  version text NOT NULL,
  features _text,
  response_time integer,
  accuracy numeric(5,2),
  average_rating numeric(3,2) DEFAULT 0,
  total_rating_count integer DEFAULT 0,
  api_documentation text,
  publisher_id uuid,
  status text NOT NULL DEFAULT 'draft'::text,
  subscription_type text NOT NULL DEFAULT 'free'::text,
  subscription_amount numeric(10,2),
  published_on timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  api_spec_format text DEFAULT 'text'::text,
  short_description text NOT NULL DEFAULT ''::text,
  live_link text,
  CONSTRAINT models_pkey PRIMARY KEY (id),
  CONSTRAINT models_publisher_id_fkey FOREIGN KEY (publisher_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT models_accuracy_check CHECK ((accuracy >= 0::numeric) AND (accuracy <= 100::numeric)),
  CONSTRAINT models_average_rating_check CHECK ((average_rating >= 0::numeric) AND (average_rating <= 5::numeric)),
  CONSTRAINT models_status_check CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  CONSTRAINT models_subscription_type_check CHECK (subscription_type = ANY (ARRAY['free'::text, 'paid'::text])),
  CONSTRAINT models_api_spec_format_check CHECK (api_spec_format = ANY (ARRAY['json'::text, 'yaml'::text, 'markdown'::text, 'text'::text]))
);

COMMENT ON TABLE public.models IS 'AI models published by publishers';
COMMENT ON COLUMN public.models.short_description IS 'Brief summary of the model (max 700 characters), shown in cards and at top of detail page';
COMMENT ON COLUMN public.models.detailed_description IS 'Detailed description of the model, shown in the Detailed Description section';
COMMENT ON COLUMN public.models.live_link IS 'Optional URL to a live hosted/demo version of the model that users can interact with';

-- =====================================================
-- MODEL_CATEGORIES TABLE (Junction)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.model_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  model_id uuid,
  category_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT model_categories_pkey PRIMARY KEY (id),
  CONSTRAINT model_categories_model_id_category_id_key UNIQUE (model_id, category_id),
  CONSTRAINT model_categories_model_id_fkey FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
  CONSTRAINT model_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.model_categories IS 'Maps models to categories (many-to-many relationship)';

-- =====================================================
-- COLLABORATORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.collaborators (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  model_id uuid,
  email text NOT NULL,
  name text,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT collaborators_pkey PRIMARY KEY (id),
  CONSTRAINT collaborators_model_id_fkey FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.collaborators IS 'Collaborators for models (can edit and manage models)';

-- =====================================================
-- MODEL_FILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.model_files (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  model_id uuid,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  description text,
  file_size bigint,
  created_at timestamp with time zone DEFAULT now(),
  file_path text,
  CONSTRAINT model_files_pkey PRIMARY KEY (id),
  CONSTRAINT model_files_model_id_fkey FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
  CONSTRAINT model_files_file_type_check CHECK (file_type = ANY (ARRAY['upload'::text, 'external_url'::text]))
);

COMMENT ON TABLE public.model_files IS 'Files associated with models (uploads or external URLs)';
COMMENT ON COLUMN public.model_files.file_path IS 'Storage path for uploaded files (null for external URLs). Used for file deletion and management.';

-- =====================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  buyer_id uuid,
  model_id uuid,
  status text NOT NULL DEFAULT 'active'::text,
  subscribed_at timestamp with time zone DEFAULT now(),
  cancelled_at timestamp with time zone,
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_buyer_id_model_id_key UNIQUE (buyer_id, model_id),
  CONSTRAINT subscriptions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_model_id_fkey FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_status_check CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text]))
);

COMMENT ON TABLE public.subscriptions IS 'Buyer subscriptions to models';

-- =====================================================
-- RATINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  model_id uuid,
  user_id uuid,
  rating_value integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ratings_pkey PRIMARY KEY (id),
  CONSTRAINT ratings_model_id_user_id_key UNIQUE (model_id, user_id),
  CONSTRAINT ratings_model_user_unique UNIQUE (model_id, user_id),
  CONSTRAINT ratings_model_id_fkey FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
  CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT ratings_rating_value_check CHECK ((rating_value >= 1) AND (rating_value <= 5))
);

COMMENT ON TABLE public.ratings IS 'User ratings for models (1-5 stars)';

-- =====================================================
-- DISCUSSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.discussions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  model_id uuid,
  user_id uuid,
  user_name text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT discussions_pkey PRIMARY KEY (id),
  CONSTRAINT discussions_model_id_fkey FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
  CONSTRAINT discussions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.discussions IS 'Discussion threads on model pages';

-- =====================================================
-- COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  discussion_id uuid,
  user_id uuid,
  user_name text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  parent_comment_id uuid,
  recipient_user_id uuid,
  recipient_user_name text,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_discussion_id_fkey FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES comments(id)
);

COMMENT ON TABLE public.comments IS 'Comments on discussions (supports nested replies)';

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  related_model_id uuid,
  related_model_name text,
  related_discussion_id uuid,
  is_read boolean DEFAULT false,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT notifications_related_model_id_fkey FOREIGN KEY (related_model_id) REFERENCES models(id) ON DELETE SET NULL,
  CONSTRAINT notifications_related_discussion_id_fkey FOREIGN KEY (related_discussion_id) REFERENCES discussions(id) ON DELETE SET NULL,
  CONSTRAINT notifications_notification_type_check CHECK (notification_type = ANY (ARRAY[
    'new_subscription'::text,
    'collaborator_subscription'::text,
    'new_discussion'::text,
    'new_comment'::text,
    'comment_reply'::text,
    'new_rating'::text,
    'subscription_success'::text,
    'model_updated'::text
  ]))
);

COMMENT ON TABLE public.notifications IS 'Real-time notifications for users';

-- =====================================================
-- VIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.views (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  model_id uuid,
  user_id uuid,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT views_pkey PRIMARY KEY (id),
  CONSTRAINT views_model_id_fkey FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
  CONSTRAINT views_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.views IS 'Track page views for models';

-- =====================================================
-- USER_ACTIVITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  title text NOT NULL,
  description text,
  model_id uuid,
  model_name text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  role text NOT NULL,
  CONSTRAINT user_activities_pkey PRIMARY KEY (id),
  CONSTRAINT user_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_activities_model_id_fkey FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL,
  CONSTRAINT user_activities_activity_type_check CHECK (activity_type = ANY (ARRAY[
    'subscribed'::text,
    'unsubscribed'::text,
    'downloaded'::text,
    'commented'::text,
    'rated'::text
  ])),
  CONSTRAINT user_activities_role_check CHECK (role = ANY (ARRAY['buyer'::text, 'publisher'::text]))
);

COMMENT ON TABLE public.user_activities IS 'Activity log for user actions';
