-- Create user_metrics table for storing user metric entries
CREATE TABLE IF NOT EXISTS user_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  value numeric NOT NULL,
  unit text,
  date date NOT NULL,
  time text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_metrics_user_id ON user_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_metrics_metric_type ON user_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_user_metrics_date ON user_metrics(date);
CREATE INDEX IF NOT EXISTS idx_user_metrics_user_type_date ON user_metrics(user_id, metric_type, date);

-- Enable Row Level Security
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own metrics"
  ON user_metrics
  FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own metrics"
  ON user_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own metrics"
  ON user_metrics
  FOR UPDATE
  TO authenticated
  USING (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own metrics"
  ON user_metrics
  FOR DELETE
  TO authenticated
  USING (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Add comment to table
COMMENT ON TABLE user_metrics IS 'Stores user metric entries for tracking fitness progress'; 