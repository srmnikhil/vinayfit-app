-- Migration: Scheduled function to send 'todays_workout' notifications for all sessions scheduled today

CREATE OR REPLACE FUNCTION send_todays_workout_notifications()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  session_record RECORD;
  count integer := 0;
  today_str text := to_char(now()::date, 'YYYY-MM-DD');
BEGIN
  FOR session_record IN
    SELECT id
    FROM training_sessions
    WHERE scheduled_date = today_str
      AND status = 'scheduled'
  LOOP
    -- Insert notification (ignore errors if already exists)
    BEGIN
      PERFORM create_session_notification(
        session_record.id,
        'todays_workout',
        now()
      );
      count := count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors (e.g., duplicate notifications)
      NULL;
    END;
  END LOOP;
  RETURN count;
END;
$$;

GRANT EXECUTE ON FUNCTION send_todays_workout_notifications() TO authenticated;

COMMENT ON FUNCTION send_todays_workout_notifications IS 'Sends a todays_workout notification for all sessions scheduled for today'; 