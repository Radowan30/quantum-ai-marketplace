-- =====================================================
-- AI Model Marketplace - Seed Data
-- =====================================================
-- This file contains initial data for the database
-- =====================================================

-- =====================================================
-- INSERT ROLES
-- =====================================================
INSERT INTO public.roles (role_name) VALUES
  ('buyer'),
  ('publisher')
ON CONFLICT (role_name) DO NOTHING;

-- =====================================================
-- INSERT DEFAULT CATEGORIES
-- =====================================================
INSERT INTO public.categories (name, is_custom) VALUES
  ('Natural Language Processing', false),
  ('Computer Vision', false),
  ('Speech Recognition', false),
  ('Predictive Analytics', false),
  ('Recommendation Systems', false),
  ('Time Series Analysis', false),
  ('Anomaly Detection', false),
  ('Classification', false),
  ('Regression', false),
  ('Clustering', false)
ON CONFLICT (name) DO NOTHING;
