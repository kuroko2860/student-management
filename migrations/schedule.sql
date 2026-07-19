create table schedules (
    id uuid primary key default gen_random_uuid(),

    class_id uuid not null
        references classes(id)
        on delete cascade,

    weekday smallint not null,

    session smallint not null,

    note text,

    created_at timestamptz default now()
);

alter table schedules
add constraint uq_schedule
unique (weekday, session);

alter table schedules enable row level security;

create policy "authenticated_full_access"
on schedules
for all
to authenticated
using (true)
with check (true);