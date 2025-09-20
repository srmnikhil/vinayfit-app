-- Migration: Add support for plan_created and todays_workout notification types
-- Update the create_session_notification function

CREATE OR REPLACE FUNCTION create_session_notification(
  p_session_id uuid,
  p_notification_type text,
  p_scheduled_for timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record training_sessions%ROWTYPE;
  notification_id uuid;
  notification_title text;
  notification_message text;
BEGIN
  -- Get the session record (may be null for plan_created)
  IF p_session_id IS NOT NULL THEN
    SELECT * INTO session_record FROM training_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Training session not found with id: %', p_session_id;
    END IF;
  END IF;

  -- Generate title and message based on notification type
  CASE p_notification_type
    WHEN 'reminder' THEN
      notification_title := 'Training Session Reminder';
      notification_message := format(
        'Your %s training session is scheduled for %s at %s. Don''t forget to prepare!',
        session_record.type,
        session_record.scheduled_date::text,
        COALESCE(session_record.scheduled_time::text, 'scheduled time')
      );
    WHEN 'confirmation' THEN
      notification_title := 'Session Confirmed';
      notification_message := format(
        'Your %s training session for %s at %s has been confirmed.',
        session_record.type,
        session_record.scheduled_date::text,
        COALESCE(session_record.scheduled_time::text, 'scheduled time')
      );
    WHEN 'cancellation' THEN
      notification_title := 'Session Cancelled';
      notification_message := format(
        'Your %s training session for %s has been cancelled.',
        session_record.type,
        session_record.scheduled_date::text
      );
    WHEN 'completion' THEN
      notification_title := 'Session Completed';
      notification_message := 'Your training session has been completed. Great work!';
    WHEN 'plan_created' THEN
      notification_title := 'New Plan Assigned!';
      notification_message := 'Your trainer has created a new plan for you. Check it out!';
    WHEN 'todays_workout' THEN
      notification_title := 'Today''s Workout Ready!';
      notification_message := 'Your workout for today is available. Let''s get moving!';
    ELSE
      notification_title := 'Training Session Update';
      notification_message := 'There has been an update to your training session.';
  END CASE;

  -- Insert the notification
  INSERT INTO session_notifications (
    session_id,
    client_id,
    trainer_id,
    notification_type,
    title,
    message,
    scheduled_for,
    created_at
  ) VALUES (
    p_session_id,
    COALESCE(session_record.client_id, NULL),
    COALESCE(session_record.trainer_id, NULL),
    p_notification_type,
    notification_title,
    notification_message,
    p_scheduled_for,
    now()
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_session_notification(uuid, text, timestamptz) TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_session_notification IS 'Creates session notifications for training sessions and plans with appropriate messages based on notification type'; 