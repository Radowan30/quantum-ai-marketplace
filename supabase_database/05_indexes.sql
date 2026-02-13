-- =====================================================
-- AI Model Marketplace - Database Indexes
-- =====================================================
-- This file contains all performance indexes
-- =====================================================

-- =====================================================
-- CATEGORIES TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories USING btree (name);

-- =====================================================
-- MODELS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS models_publisher_id_idx ON public.models USING btree (publisher_id);
CREATE INDEX IF NOT EXISTS models_status_idx ON public.models USING btree (status);
CREATE INDEX IF NOT EXISTS models_subscription_type_idx ON public.models USING btree (subscription_type);
CREATE INDEX IF NOT EXISTS models_created_at_idx ON public.models USING btree (created_at DESC);

-- =====================================================
-- MODEL_CATEGORIES TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_model_categories_model_id ON public.model_categories USING btree (model_id);
CREATE INDEX IF NOT EXISTS idx_model_categories_category_id ON public.model_categories USING btree (category_id);

-- =====================================================
-- COLLABORATORS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS collaborators_model_id_idx ON public.collaborators USING btree (model_id);

-- =====================================================
-- MODEL_FILES TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS model_files_model_id_idx ON public.model_files USING btree (model_id);

-- =====================================================
-- SUBSCRIPTIONS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS subscriptions_buyer_id_idx ON public.subscriptions USING btree (buyer_id);
CREATE INDEX IF NOT EXISTS subscriptions_model_id_idx ON public.subscriptions USING btree (model_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions USING btree (status);

-- =====================================================
-- RATINGS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS ratings_model_id_idx ON public.ratings USING btree (model_id);
CREATE INDEX IF NOT EXISTS ratings_user_id_idx ON public.ratings USING btree (user_id);

-- =====================================================
-- DISCUSSIONS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS discussions_model_id_idx ON public.discussions USING btree (model_id);
CREATE INDEX IF NOT EXISTS discussions_created_at_idx ON public.discussions USING btree (created_at DESC);

-- =====================================================
-- COMMENTS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS comments_discussion_id_idx ON public.comments USING btree (discussion_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments USING btree (created_at);

-- =====================================================
-- NOTIFICATIONS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications USING btree (is_read);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON public.notifications USING btree (notification_type);

-- =====================================================
-- VIEWS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS views_model_id_idx ON public.views USING btree (model_id);
CREATE INDEX IF NOT EXISTS views_timestamp_idx ON public.views USING btree (timestamp DESC);

-- =====================================================
-- USER_ACTIVITIES TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities USING btree (activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created ON public.user_activities USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_role_created ON public.user_activities USING btree (user_id, role, created_at DESC);

-- =====================================================
-- USER_ROLES TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles USING btree (user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_id_idx ON public.user_roles USING btree (role_id);

-- =====================================================
-- USERS TABLE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users USING btree (email);
