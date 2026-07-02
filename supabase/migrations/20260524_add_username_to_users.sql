-- Supabase Migration: Add Username Column to public.users
-- Date: 2026-05-24

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username text;

-- Add a unique constraint for username
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;
