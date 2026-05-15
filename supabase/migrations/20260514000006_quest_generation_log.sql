-- Audit log for all quest generation calls.
-- Useful for prompt tuning, debugging hard-nos violations, and tracking retries.
create table quest_generation_log (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users on delete cascade,
  tier                text        not null,
  system_prompt       text,
  user_message        text,
  response_json       jsonb,
  regenerated         boolean     not null default false,
  hard_nos_triggered  boolean     not null default false,
  error               text,
  created_at          timestamptz not null default now()
);

-- Only the service role writes; users can query their own rows for debugging.
alter table quest_generation_log enable row level security;

create policy "Users can read own generation logs"
  on quest_generation_log for select
  using (auth.uid() = user_id);

create index quest_generation_log_user_tier_idx
  on quest_generation_log (user_id, tier, created_at desc);
