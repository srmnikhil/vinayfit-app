-- Create function to process scheduled notifications (for cron jobs)
CREATE OR REPLACE FUNCTION process_scheduled_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  processed_count integer := 0;
  notification_record session_notifications%ROWTYPE;
BEGIN
  -- Find notifications that are scheduled and due to be sent
  FOR notification_record IN
    SELECT * FROM session_notifications
    WHERE scheduled_for IS NOT NULL 
      AND scheduled_for <= now()
      AND sent_at IS NULL
      AND notification_type = 'reminder'
  LOOP
    -- Mark notification as sent
    UPDATE session_notifications 
    SET sent_at = now()
    WHERE id = notification_record.id;
    
    -- Here you would typically send the actual notification
    -- For now, we just mark it as sent
    -- In a real implementation, you might:
    -- 1. Send push notification
    -- 2. Send email
    -- 3. Send SMS
    -- 4. Create in-app notification
    
    processed_count := processed_count + 1;
    
    -- Log the processed notification
    RAISE NOTICE 'Processed notification % for session %', 
      notification_record.id, notification_record.session_id;
  END LOOP;
  
  RETURN processed_count;
END;
$$;

-- Create function to get pending notifications for a user
CREATE OR REPLACE FUNCTION get_pending_notifications(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  session_id uuid,
  notification_type text,
  title text,
  message text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read boolean,
  created_at timestamptz,
  session_date date,
  session_time time,
  session_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sn.id,
    sn.session_id,
    sn.notification_type,
    sn.title,
    sn.message,
    sn.scheduled_for,
    sn.sent_at,
    sn.read,
    sn.created_at,
    ts.scheduled_date,
    ts.scheduled_time,
    ts.type
  FROM session_notifications sn
  INNER JOIN training_sessions ts ON ts.id = sn.session_id
  INNER JOIN profiles p ON (p.id = sn.client_id OR p.id = sn.trainer_id)
  WHERE p.user_id = p_user_id
    AND sn.read = false
  ORDER BY 
    CASE 
      WHEN sn.scheduled_for IS NOT NULL THEN sn.scheduled_for
      ELSE sn.created_at
    END DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_scheduled_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_notifications(uuid) TO authenticated;

-- Add comments
COMMENT ON FUNCTION process_scheduled_notifications IS 'Processes scheduled notifications that are ready to be sent';
COMMENT ON FUNCTION get_pending_notifications IS 'Gets pending notifications for a specific user';
