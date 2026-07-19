create extension if not exists pgcrypto;

create table classes (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    color text default '#3B82F6',

    price integer default 0,

    note text,

    created_at timestamptz default now()
);

alter table classes enable row level security;

create policy "authenticated_full_access"
on classes
for all
to authenticated
using (true)
with check (true);