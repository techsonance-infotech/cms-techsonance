-- Migration: Add parsed resume metadata and pgvector embeddings support
-- Created: 2026-07-31

BEGIN;

-- Enable the pgvector extension if it's available
CREATE EXTENSION IF NOT EXISTS vector;

-- Add new columns to candidate_profiles if they don't exist
ALTER TABLE public.candidate_profiles
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255),
  ADD COLUMN IF NOT EXISTS github VARCHAR(255),
  ADD COLUMN IF NOT EXISTS notice_period VARCHAR(100),
  ADD COLUMN IF NOT EXISTS current_salary NUMERIC(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS expected_salary NUMERIC(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS experience_detail JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS resume_text TEXT,
  ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Add utility database function to query semantic similarity (Cosine Distance)
CREATE OR REPLACE FUNCTION match_candidate_resumes(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  target_tenant_id uuid
)
RETURNS TABLE (
  id uuid,
  first_name varchar,
  last_name varchar,
  email varchar,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.first_name,
    cp.last_name,
    cp.email,
    1 - (cp.embedding <=> query_embedding) AS similarity
  FROM public.candidate_profiles cp
  WHERE cp.tenant_id = target_tenant_id
    AND cp.embedding IS NOT NULL
    AND 1 - (cp.embedding <=> query_embedding) > match_threshold
  ORDER BY cp.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMIT;
