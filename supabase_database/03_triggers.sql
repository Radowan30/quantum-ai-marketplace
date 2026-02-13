-- =====================================================
-- AI Model Marketplace - Database Triggers
-- =====================================================
-- This file contains all database triggers
-- =====================================================

-- Auto-update updated_at column on models table
CREATE TRIGGER update_models_updated_at
BEFORE UPDATE ON public.models
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at column on users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at column on discussions table
CREATE TRIGGER update_discussions_updated_at
BEFORE UPDATE ON public.discussions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at column on comments table
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at column on ratings table
CREATE TRIGGER update_ratings_updated_at
BEFORE UPDATE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
