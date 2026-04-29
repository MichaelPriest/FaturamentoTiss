create table if not exists public.app_storage (
  storage_key text primary key,
  storage_value jsonb,
  updated_at timestamptz default now()
);

alter table public.app_storage enable row level security;

create policy "Allow anon full access"
on public.app_storage
for all
using (true)
with check (true);
