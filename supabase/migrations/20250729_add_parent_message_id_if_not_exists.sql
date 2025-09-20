-- Add the parent_message_id column to the messages table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'parent_message_id') THEN
    ALTER TABLE public.messages
    ADD COLUMN parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add an index for faster lookups of replies, if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_parent_message_id' AND n.nspname = 'public') THEN
    CREATE INDEX idx_parent_message_id ON public.messages(parent_message_id);
  END IF;
END $$;
