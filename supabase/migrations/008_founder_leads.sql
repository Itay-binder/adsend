-- Founder Pack lead capture. Anonymous (no auth.users tie-in), just a name +
-- phone pair so Itay can reach back out via WhatsApp.
CREATE TABLE IF NOT EXISTS founder_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS founder_leads_created_idx ON founder_leads(created_at DESC);
