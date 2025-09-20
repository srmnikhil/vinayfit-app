-- Fix template access for clients
-- Allow clients to access templates that are assigned to them through workout plans

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can read public templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can read own templates" ON workout_templates;

-- Recreate policies with better access control
CREATE POLICY "Users can read public templates"
  ON workout_templates
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can read own templates"
  ON workout_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = created_by AND p.user_id = auth.uid()
    )
  );

-- NEW: Allow clients to access templates assigned to them through workout plans
CREATE POLICY "Clients can read assigned templates"
  ON workout_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans wp
      JOIN profiles p ON p.id = wp.client_id
      WHERE p.user_id = auth.uid()
      AND wp.status = 'active'
      AND (
        wp.schedule_data->>'Monday' = workout_templates.id::text OR
        wp.schedule_data->>'Tuesday' = workout_templates.id::text OR
        wp.schedule_data->>'Wednesday' = workout_templates.id::text OR
        wp.schedule_data->>'Thursday' = workout_templates.id::text OR
        wp.schedule_data->>'Friday' = workout_templates.id::text OR
        wp.schedule_data->>'Saturday' = workout_templates.id::text OR
        wp.schedule_data->>'Sunday' = workout_templates.id::text
      )
    )
  );

-- NEW: Allow trainers to access templates they created or are assigned to their clients
CREATE POLICY "Trainers can read client templates"
  ON workout_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans wp
      JOIN profiles p ON p.id = wp.trainer_id
      WHERE p.user_id = auth.uid()
      AND wp.status = 'active'
      AND (
        wp.schedule_data->>'Monday' = workout_templates.id::text OR
        wp.schedule_data->>'Tuesday' = workout_templates.id::text OR
        wp.schedule_data->>'Wednesday' = workout_templates.id::text OR
        wp.schedule_data->>'Thursday' = workout_templates.id::text OR
        wp.schedule_data->>'Friday' = workout_templates.id::text OR
        wp.schedule_data->>'Saturday' = workout_templates.id::text OR
        wp.schedule_data->>'Sunday' = workout_templates.id::text
      )
    )
  ); 