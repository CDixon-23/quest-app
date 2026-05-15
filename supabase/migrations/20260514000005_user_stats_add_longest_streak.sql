-- Track the user's all-time longest streak for the stats page.
alter table user_stats add column longest_streak integer not null default 0;
