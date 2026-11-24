create table if not exists public.hydration_reminders (
 id text primary key,
 subscription jsonb not null,
 minutes integer not null check (minutes between 1 and 180),
 next_at timestamptz not null
);
create index if not exists hydration_due on public.hydration_reminders(next_at);
alter table public.hydration_reminders enable row level security;
revoke all on public.hydration_reminders from anon, authenticated;
