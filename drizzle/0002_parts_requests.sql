-- Create parts_requests table
CREATE TABLE IF NOT EXISTS parts_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  category TEXT NOT NULL,
  product_code TEXT,
  requested_description TEXT NOT NULL,
  quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'ordered', 'ready', 'completed', 'denied')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE parts_requests ENABLE ROW LEVEL SECURITY;

-- Tech role policies: can INSERT (created_by = auth.uid()), can SELECT own requests
CREATE POLICY "Tech users can create requests"
  ON parts_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Tech users can view own requests"
  ON parts_requests
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Admin role policies: can SELECT all, can UPDATE status/notes
CREATE POLICY "Admin can view all requests"
  ON parts_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin can update requests"
  ON parts_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete requests"
  ON parts_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX idx_parts_requests_status ON parts_requests(status);
CREATE INDEX idx_parts_requests_created_by ON parts_requests(created_by);
CREATE INDEX idx_parts_requests_job_id ON parts_requests(job_id);
