-- Track when quests are completed (used for streak calculation)
alter table quests add column completed_at timestamptz;

-- Track last completion date on user_stats (drives streak logic)
alter table user_stats add column last_completed_at timestamptz;
