create table public.student_history (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,

  effective_month date not null,

  -- Complete roster at this point in time.
  students jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now()
);

create index student_history_lookup_idx
on public.student_history (
  user_id,
  class_id,
  effective_month desc,
  created_at desc
);

alter table public.student_history enable row level security;

create policy "Users can read own student history"
on public.student_history
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create own student history"
on public.student_history
for insert
to authenticated
with check (auth.uid() = user_id);