-- Store the user's IANA timezone string (e.g. "America/New_York") so that
-- daily quest expiration and streak tracking use their local day boundary.
alter table profiles add column timezone text not null default 'UTC';
