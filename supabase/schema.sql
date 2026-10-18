-- Lifehub: Speicher für den Snapshot pro Nutzer.
-- Im Supabase-Dashboard unter "SQL Editor" einfügen und ausführen.

create table if not exists public.lifehub_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.lifehub_snapshots enable row level security;

-- Jeder Nutzer sieht und ändert nur die eigene Zeile.
create policy "own snapshot can be read"
  on public.lifehub_snapshots for select
  using (auth.uid() = user_id);

create policy "own snapshot can be inserted"
  on public.lifehub_snapshots for insert
  with check (auth.uid() = user_id);

create policy "own snapshot can be updated"
  on public.lifehub_snapshots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
