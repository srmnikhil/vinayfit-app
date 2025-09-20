-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- Create conversations table (for 1:1 chat)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  participant1_id uuid references profiles(id) not null,
  participant2_id uuid references profiles(id) not null,
  created_at timestamptz default now()
);

-- Create messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) not null,
  sender_id uuid references profiles(id) not null,
  recipient_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamptz default now(),
  read boolean default false
);

-- RLS: Only participants can read their messages
alter table messages enable row level security;
create policy "Users can read their messages"
  on messages for select
  using (
    sender_id = auth.uid() or recipient_id = auth.uid()
  );

create policy "Users can send messages"
  on messages for insert
  with check (
    sender_id = auth.uid()
  );

-- RLS: Only participants can read their conversations
alter table conversations enable row level security;
create policy "Users can read their conversations"
  on conversations for select
  using (
    participant1_id = auth.uid() or participant2_id = auth.uid()
  ); 