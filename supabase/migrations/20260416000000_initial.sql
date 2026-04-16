-- Sessions table
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_date date not null,
  location text,
  notes text,
  user_id uuid not null references auth.users(id) on delete cascade
);

-- Shots table
create table public.shots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  contact text,
  miss_direction text[],
  proximity text,
  lie text,
  shot_type text,
  club text,
  notes text
);

alter table public.sessions enable row level security;
alter table public.shots enable row level security;

create policy "sessions_select" on public.sessions for select using (auth.uid() = user_id);
create policy "sessions_insert" on public.sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update" on public.sessions for update using (auth.uid() = user_id);
create policy "sessions_delete" on public.sessions for delete using (auth.uid() = user_id);

create policy "shots_select" on public.shots for select
  using (exists (select 1 from public.sessions s where s.id = shots.session_id and s.user_id = auth.uid()));
create policy "shots_insert" on public.shots for insert
  with check (exists (select 1 from public.sessions s where s.id = shots.session_id and s.user_id = auth.uid()));
create policy "shots_update" on public.shots for update
  using (exists (select 1 from public.sessions s where s.id = shots.session_id and s.user_id = auth.uid()));
create policy "shots_delete" on public.shots for delete
  using (exists (select 1 from public.sessions s where s.id = shots.session_id and s.user_id = auth.uid()));
