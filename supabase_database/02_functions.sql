-- =====================================================
-- AI Model Marketplace - Database Functions
-- =====================================================
-- This file contains all custom PostgreSQL functions
-- =====================================================

-- =====================================================
-- FUNCTION: update_updated_at_column
-- =====================================================
-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.update_updated_at_column IS 'Automatically updates updated_at column on row update';

-- =====================================================
-- FUNCTION: is_model_owner
-- =====================================================
-- Check if current user is the owner of a model
CREATE OR REPLACE FUNCTION public.is_model_owner(p_model_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT EXISTS (
      SELECT 1 FROM public.models
      WHERE id = p_model_id
      AND publisher_id = auth.uid()
    );
  $function$;

COMMENT ON FUNCTION public.is_model_owner IS 'Returns true if current user owns the specified model';

-- =====================================================
-- FUNCTION: is_collaborator_by_email
-- =====================================================
-- Check if current user is a collaborator on a model
CREATE OR REPLACE FUNCTION public.is_collaborator_by_email(p_model_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT EXISTS (
      SELECT 1 FROM public.collaborators c
      JOIN public.users u ON u.id = auth.uid()
      WHERE c.model_id = p_model_id
      AND LOWER(c.email) = LOWER(u.email)
    );
  $function$;

COMMENT ON FUNCTION public.is_collaborator_by_email IS 'Returns true if current user is a collaborator on the specified model';

-- =====================================================
-- FUNCTION: create_user_with_role
-- =====================================================
-- Create or update user and assign role
CREATE OR REPLACE FUNCTION public.create_user_with_role(
  p_user_id uuid,
  p_name text,
  p_email text,
  p_role_name text
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_role_id UUID;
  v_user_role_id UUID;
  v_result JSON;
BEGIN
  -- Step 1: Insert or update user in users table
  -- For new users: insert with provided name
  -- For existing users: only update email (if changed), preserve original name
  -- Names can only be changed by users themselves through settings
  INSERT INTO users (id, name, email)
  VALUES (p_user_id, p_name, p_email)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();

  -- Step 2: Get role ID
  SELECT id INTO v_role_id
  FROM roles
  WHERE role_name = p_role_name;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Role % not found', p_role_name;
  END IF;

  -- Step 3: Insert user_role (skip if already exists)
  INSERT INTO user_roles (user_id, role_id)
  VALUES (p_user_id, v_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING
  RETURNING id INTO v_user_role_id;

  -- Step 4: Return success result
  v_result := json_build_object(
    'success', true,
    'user_id', p_user_id,
    'role_id', v_role_id,
    'user_role_id', v_user_role_id,
    'message', 'User and role created successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
    RETURN v_result;
END;
$function$;

COMMENT ON FUNCTION public.create_user_with_role IS 'Creates or updates user and assigns a role';

-- =====================================================
-- FUNCTION: create_notification
-- =====================================================
-- Create a notification for a user
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_notification_type text,
  p_title text,
  p_message text,
  p_related_model_id uuid DEFAULT NULL::uuid,
  p_related_model_name text DEFAULT NULL::text,
  p_related_discussion_id uuid DEFAULT NULL::uuid,
  p_metadata jsonb DEFAULT NULL::jsonb
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_notification_id UUID;
BEGIN
    -- Ensure the caller is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        related_model_id,
        related_model_name,
        related_discussion_id,
        metadata,
        is_read
    ) VALUES (
        p_user_id,
        p_notification_type,
        p_title,
        p_message,
        p_related_model_id,
        p_related_model_name,
        p_related_discussion_id,
        p_metadata,
        false
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$function$;

COMMENT ON FUNCTION public.create_notification IS 'Creates a notification for a user';

-- =====================================================
-- FUNCTION: add_email_identity_to_user
-- =====================================================
-- Add email identity to a Google-authenticated user
CREATE OR REPLACE FUNCTION public.add_email_identity_to_user(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_email TEXT;
  v_identity_exists BOOLEAN;
BEGIN
  -- Get the user's email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found or has no email';
  END IF;

  -- Check if email identity already exists
  SELECT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE user_id = p_user_id AND provider = 'email'
  ) INTO v_identity_exists;

  IF v_identity_exists THEN
    RAISE EXCEPTION 'Email identity already exists for this user';
  END IF;

  -- Insert email identity
  -- Note: 'email' column is GENERATED, so we don't insert it directly
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    jsonb_build_object(
      'sub', p_user_id::text,
      'email', v_user_email,
      'email_verified', true,
      'provider', 'email'
    ),
    'email',
    v_user_email,  -- provider_id is the email address for email provider
    NOW(),
    NOW(),
    NOW()
  );

  -- Update raw_app_meta_data to include email in providers array
  UPDATE auth.users
  SET
    raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{providers}',
      (
        SELECT jsonb_agg(provider)
        FROM (
          SELECT DISTINCT value AS provider
          FROM jsonb_array_elements_text(
            COALESCE(raw_app_meta_data->'providers', '[]'::jsonb)
          ) AS value
          UNION
          SELECT 'email'::text
        ) AS all_providers
      )
    ),
    updated_at = NOW()
  WHERE id = p_user_id;

END;
$function$;

COMMENT ON FUNCTION public.add_email_identity_to_user IS 'Adds email identity to Google-authenticated user for password login';
