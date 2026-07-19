create table attendances (
    id uuid primary key default gen_random_uuid(),

    lesson_id uuid not null
        references lessons(id)
        on delete cascade,

    student_id uuid not null
        references students(id)
        on delete cascade,

    status smallint default 1,

    note text,

    created_at timestamptz default now(),

    unique(lesson_id, student_id)
);

alter table attendances enable row level security;

create policy "authenticated_full_access"
on attendances
for all
to authenticated
using (true)
with check (true);