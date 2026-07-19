create table students (
    id uuid primary key default gen_random_uuid(),

    class_id uuid references classes(id) on delete set null,

    name text not null,

    phone text,

    parent_name text,

    parent_phone text,

    status text default 'active',

    note text,

    created_at timestamptz default now()
);

alter table students enable row level security;

create policy "authenticated_full_access"
on students
for all
to authenticated
using (true)
with check (true);