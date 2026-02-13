-- =====================================================
-- AI Model Marketplace - Row Level Security Policies
-- =====================================================
-- This file contains all RLS policies for data security
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users are viewable by everyone"
ON public.users FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.users FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO public
USING (auth.uid() = id);

-- =====================================================
-- ROLES TABLE POLICIES
-- =====================================================
CREATE POLICY "Roles are viewable by everyone"
ON public.roles FOR SELECT
TO public
USING (true);

-- =====================================================
-- USER_ROLES TABLE POLICIES
-- =====================================================
CREATE POLICY "User roles are viewable by everyone"
ON public.user_roles FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can add their own roles"
ON public.user_roles FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own roles"
ON public.user_roles FOR DELETE
TO public
USING (auth.uid() = user_id);

-- =====================================================
-- CATEGORIES TABLE POLICIES
-- =====================================================
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can create categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- MODELS TABLE POLICIES
-- =====================================================
CREATE POLICY "Models viewable by public, owners, and collaborators"
ON public.models FOR SELECT
TO public
USING (
  (status = 'published'::text) OR
  (publisher_id = auth.uid()) OR
  is_collaborator_by_email(id)
);

CREATE POLICY "Publishers can create models"
ON public.models FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'publisher'
  )
);

CREATE POLICY "Owners and collaborators can update models"
ON public.models FOR UPDATE
TO public
USING ((publisher_id = auth.uid()) OR is_collaborator_by_email(id));

CREATE POLICY "Publishers can delete own models"
ON public.models FOR DELETE
TO public
USING (publisher_id = auth.uid());

-- =====================================================
-- MODEL_CATEGORIES TABLE POLICIES
-- =====================================================
CREATE POLICY "Anyone can view model categories"
ON public.model_categories FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Owners and collaborators can add categories"
ON public.model_categories FOR INSERT
TO authenticated
WITH CHECK (is_model_owner(model_id) OR is_collaborator_by_email(model_id));

CREATE POLICY "Owners and collaborators can remove categories"
ON public.model_categories FOR DELETE
TO authenticated
USING (is_model_owner(model_id) OR is_collaborator_by_email(model_id));

-- =====================================================
-- COLLABORATORS TABLE POLICIES
-- =====================================================
CREATE POLICY "Model owners and collaborators can view collaborators"
ON public.collaborators FOR SELECT
TO public
USING (
  is_model_owner(model_id) OR
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND LOWER(collaborators.email) = LOWER(u.email)
  )
);

CREATE POLICY "Owners and collaborators can add collaborators"
ON public.collaborators FOR INSERT
TO public
WITH CHECK (is_model_owner(model_id) OR is_collaborator_by_email(model_id));

CREATE POLICY "Owners and collaborators can remove collaborators"
ON public.collaborators FOR DELETE
TO public
USING (is_model_owner(model_id) OR is_collaborator_by_email(model_id));

-- =====================================================
-- MODEL_FILES TABLE POLICIES
-- =====================================================
CREATE POLICY "Model files are viewable by subscribers, owners, and collaborat"
ON public.model_files FOR SELECT
TO public
USING (
  is_model_owner(model_id) OR
  is_collaborator_by_email(model_id) OR
  EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.model_id = model_files.model_id
    AND s.buyer_id = auth.uid()
    AND s.status = 'active'
  )
);

CREATE POLICY "Owners and collaborators can manage files"
ON public.model_files FOR ALL
TO public
USING (is_model_owner(model_id) OR is_collaborator_by_email(model_id))
WITH CHECK (is_model_owner(model_id) OR is_collaborator_by_email(model_id));

-- =====================================================
-- SUBSCRIPTIONS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view relevant subscriptions"
ON public.subscriptions FOR SELECT
TO public
USING (
  (buyer_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM models
    WHERE models.id = subscriptions.model_id
    AND models.publisher_id = auth.uid()
  )
);

CREATE POLICY "Buyers can create subscriptions"
ON public.subscriptions FOR INSERT
TO public
WITH CHECK (
  (buyer_id = auth.uid()) AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'buyer'
  )
);

CREATE POLICY "Publishers can approve, buyers can cancel"
ON public.subscriptions FOR UPDATE
TO public
USING (
  (buyer_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM models
    WHERE models.id = subscriptions.model_id
    AND models.publisher_id = auth.uid()
  )
);

CREATE POLICY "Buyers can delete own subscriptions"
ON public.subscriptions FOR DELETE
TO public
USING (buyer_id = auth.uid());

-- =====================================================
-- RATINGS TABLE POLICIES
-- =====================================================
CREATE POLICY "Ratings are public"
ON public.ratings FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can rate models"
ON public.ratings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
ON public.ratings FOR UPDATE
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
ON public.ratings FOR DELETE
TO public
USING (auth.uid() = user_id);

-- =====================================================
-- DISCUSSIONS TABLE POLICIES
-- =====================================================
CREATE POLICY "Discussions are public"
ON public.discussions FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can create discussions"
ON public.discussions FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- COMMENTS TABLE POLICIES
-- =====================================================
CREATE POLICY "Comments are public"
ON public.comments FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.comments FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
TO public
USING (auth.uid() = user_id);

-- =====================================================
-- VIEWS TABLE POLICIES
-- =====================================================
CREATE POLICY "Enable read access for all users"
ON public.views FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can track views"
ON public.views FOR INSERT
TO public
WITH CHECK (true);

-- =====================================================
-- USER_ACTIVITIES TABLE POLICIES
-- =====================================================
CREATE POLICY "Users can view own activities"
ON public.user_activities FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert activities"
ON public.user_activities FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
ON public.user_activities FOR UPDATE
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
ON public.user_activities FOR DELETE
TO public
USING (auth.uid() = user_id);
