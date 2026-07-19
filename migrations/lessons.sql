create table lessons (
    id uuid primary key default gen_random_uuid(),

    schedule_id uuid not null
        references schedules(id)
        on delete cascade,

    lesson_date date not null,

    note text,

    created_at timestamptz default now(),

    unique(schedule_id, lesson_date)
);

alter table lessons enable row level security;

create policy "authenticated_full_access"
on lessons
for all
to authenticated
using (true)
with check (true);