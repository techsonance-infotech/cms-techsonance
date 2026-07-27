-- Add notification center configuration columns to public.company_settings table
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS notify_push boolean DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS notify_teams boolean DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS notify_discord boolean DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS notify_webhook boolean DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS notify_browser boolean DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS slack_webhook_url text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS teams_webhook_url text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS discord_webhook_url text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS webhook_endpoint_url text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS notification_templates jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS escalation_rules jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS reminder_rules jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS digest_emails boolean DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS digest_frequency text DEFAULT 'weekly';
