-- ============================================================
-- Enums
-- ============================================================

create type quest_tier as enum ('daily', 'weekly', 'monthly');
create type quest_status as enum ('active', 'completed', 'expired');

-- ============================================================
-- profiles
-- One row per user; stores onboarding answers as flexible JSONB.
-- ============================================================

create table profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  onboarding_answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = user_id);

-- ============================================================
-- quests
-- AI-generated quests scoped to a user and tier.
-- ============================================================

create table quests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  tier         quest_tier not null,
  title        text not null,
  description  text not null,
  reward_xp    integer not null default 0 check (reward_xp >= 0),
  status       quest_status not null default 'active',
  generated_at timestamptz not null default now(),
  expires_at   timestamptz not null
);

create index quests_user_id_idx       on quests (user_id);
create index quests_user_status_idx   on quests (user_id, status);
create index quests_expires_at_idx    on quests (expires_at);

alter table quests enable row level security;

create policy "Users can view their own quests"
  on quests for select
  using (auth.uid() = user_id);

create policy "Service role can insert quests"
  on quests for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own quests"
  on quests for update
  using (auth.uid() = user_id);

-- ============================================================
-- user_stats
-- Aggregate XP, streak, and per-tier completion counts.
-- completed_counts shape: { "daily": 0, "weekly": 0, "monthly": 0 }
-- ============================================================

create table user_stats (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  total_xp         integer not null default 0 check (total_xp >= 0),
  current_streak   integer not null default 0 check (current_streak >= 0),
  completed_counts jsonb not null default '{"daily": 0, "weekly": 0, "monthly": 0}'::jsonb,
  updated_at       timestamptz not null default now()
);

alter table user_stats enable row level security;

create policy "Users can view their own stats"
  on user_stats for select
  using (auth.uid() = user_id);

create policy "Users can insert their own stats"
  on user_stats for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own stats"
  on user_stats for update
  using (auth.uid() = user_id);

-- ============================================================
-- Auto-provision rows on sign-up
-- Creates a profile and zeroed-out stats for every new user.
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (user_id) values (new.id);
  insert into user_stats (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
