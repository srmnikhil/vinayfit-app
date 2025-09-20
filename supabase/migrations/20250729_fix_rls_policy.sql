-- Add a new policy to allow users to insert into the conversations table
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    (participant1_id = auth.uid() OR participant2_id = auth.uid())
  );

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (
    (participant1_id = auth.uid() OR participant2_id = auth.uid())
  );

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (
    (participant1_id = auth.uid() OR participant2_id = auth.uid())
  );

CREATE POLICY "Users can select their own conversations"
  ON conversations FOR SELECT
  USING (
    (participant1_id = auth.uid() OR participant2_id = auth.uid())
  );
  