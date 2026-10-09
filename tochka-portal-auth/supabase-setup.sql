-- Run this in Supabase SQL Editor.
create table if not exists public.portal_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('employee', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.portal_users enable row level security;
-- No client-facing policies are intentionally created. Only the server's service-role key reads this table.
revoke all on table public.portal_users from anon, authenticated;
grant all on table public.portal_users to service_role;
