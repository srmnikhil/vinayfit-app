/*
  # Add Missing DELETE Policy for Workout Templates
  
  This migration adds the missing DELETE policy for workout_templates table
  to allow users to delete their own templates.
*/

-- Add DELETE policy for workout_templates
CREATE POLICY "Users can delete own templates"
  ON workout_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = created_by AND p.user_id = auth.uid()
    )
  );

-- Add DELETE policy for template_exercises
CREATE POLICY "Users can delete template exercises"
  ON template_exercises
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates wt
      JOIN profiles p ON p.id = wt.created_by
      WHERE wt.id = template_id AND p.user_id = auth.uid()
    )
  ); 