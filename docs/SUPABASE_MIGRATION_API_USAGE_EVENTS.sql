-- Migration: API Usage Events Tracking
-- Created: 2026-05-23
-- Purpose: Track API usage events for admin health dashboard and cost estimation

-- Create the api_usage_events table
CREATE TABLE IF NOT EXISTS public.api_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  operation text NOT NULL,
  model text,
  user_id uuid,
  analysis_id uuid,
  request_units integer,
  input_tokens integer,
  output_tokens integer,
  characters integer,
  estimated_cost_usd numeric(10, 6),
  success boolean NOT NULL DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_usage_events_provider ON public.api_usage_events(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_events_created_at ON public.api_usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_events_success ON public.api_usage_events(success);
CREATE INDEX IF NOT EXISTS idx_api_usage_events_operation ON public.api_usage_events(operation);
CREATE INDEX IF NOT EXISTS idx_api_usage_events_user_id ON public.api_usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_events_analysis_id ON public.api_usage_events(analysis_id);

-- Composite index for common dashboard queries (provider + date range)
CREATE INDEX IF NOT EXISTS idx_api_usage_events_provider_created_at 
  ON public.api_usage_events(provider, created_at DESC);

-- Index for failure analysis
CREATE INDEX IF NOT EXISTS idx_api_usage_events_provider_success_created_at 
  ON public.api_usage_events(provider, success, created_at DESC) 
  WHERE success = false;

-- Enable Row Level Security
ALTER TABLE public.api_usage_events ENABLE ROW LEVEL SECURITY;

-- Create policy: Only admin users can read usage events
-- Note: This uses the admin_emails check; in production, you may want to use a role-based approach
CREATE POLICY "Admin users can view API usage events"
  ON public.api_usage_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.email IN ('mertsavas96@gmail.com', 'mertsavas97@gmail.com', 'mert@075collective.com')
    )
  );

-- Create policy: Service role can insert (for server-side logging)
CREATE POLICY "Service role can insert API usage events"
  ON public.api_usage_events
  FOR INSERT
  WITH CHECK (true);

-- Create policy: Service role can delete (for cleanup)
CREATE POLICY "Service role can delete API usage events"
  ON public.api_usage_events
  FOR DELETE
  USING (true);

-- Grant permissions
GRANT SELECT ON public.api_usage_events TO authenticated;
GRANT INSERT ON public.api_usage_events TO service_role;
GRANT DELETE ON public.api_usage_events TO service_role;

-- Create a function to clean up old events (optional maintenance)
-- Run this periodically or set up a cron job
CREATE OR REPLACE FUNCTION public.cleanup_old_api_usage_events(days_to_keep integer DEFAULT 90)
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_usage_events
  WHERE created_at < now() - (days_to_keep || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment describing the table
COMMENT ON TABLE public.api_usage_events IS 'Tracks API usage events for monitoring, cost estimation, and health dashboard';
COMMENT ON COLUMN public.api_usage_events.provider IS 'API provider name (groq, aws_polly, rapidapi_youtube, etc.)';
COMMENT ON COLUMN public.api_usage_events.operation IS 'Specific operation performed (e.g., chat_completion, synthesize_speech)';
COMMENT ON COLUMN public.api_usage_events.model IS 'Model or voice ID used (e.g., llama-3.1-70b, Matthew)';
COMMENT ON COLUMN public.api_usage_events.estimated_cost_usd IS 'Estimated cost based on provider pricing';
COMMENT ON COLUMN public.api_usage_events.metadata IS 'Additional provider-specific data (JSON)';