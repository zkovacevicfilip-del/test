-- Tabulka pro anonymní data z aplikace Aero pozice.
-- Vlož celé do Supabase: SQL Editor -> New query -> Run.
create table if not exists public.submissions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  device_id uuid not null,
  kind text not null check (kind in ('position', 'cda', 'power', 'area')),
  schema_ver int not null default 1 check (schema_ver between 1 and 100),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 16000)
);

-- Aplikace (role anon) smí jen zapisovat. Číst a mazat může jen vlastník projektu v Supabase.
alter table public.submissions enable row level security;
revoke all on public.submissions from anon, authenticated;
grant insert (device_id, kind, schema_ver, data) on public.submissions to anon;
drop policy if exists "anonymni zapis" on public.submissions;
create policy "anonymni zapis" on public.submissions for insert to anon with check (true);

-- Ochrana proti spamu: nejvýš 50 odeslání za den z jednoho zařízení.
create or replace function public.limit_submissions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.submissions
      where device_id = new.device_id and created_at > now() - interval '1 day') >= 50 then
    raise exception 'Příliš mnoho odeslání za den';
  end if;
  return new;
end $$;
drop trigger if exists limit_submissions on public.submissions;
create trigger limit_submissions before insert on public.submissions
  for each row execute function public.limit_submissions();
