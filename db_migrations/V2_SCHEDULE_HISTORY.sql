create table schedule_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  effective_month date not null,
  schedule_slots jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index schedule_history_user_month_idx
  on schedule_history (user_id, effective_month desc);

create unique index schedule_history_user_month_unique
  on schedule_history (user_id, effective_month);

-- insert into schedule_history (
--   user_id,
--   effective_month,
--   schedule_slots
-- )
-- select
--   user_id,
--   '2026-07-01',
--   schedule_slots
-- from user_settings
-- where setting_type = 'schedule';