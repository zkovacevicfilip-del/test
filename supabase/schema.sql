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

-- ---------------------------------------------------------------------------
-- Práva uživatelů (čl. 15, 17 a 20 GDPR): stažení a smazání vlastních dat.
-- Volá je stránka Zásad ochrany osobních údajů. Funguje jen se znalostí
-- náhodného ID zařízení, které má uložené pouze uživatel.
-- Doplněno 8. 11. 2026. Skript lze spustit opakovaně.
-- ---------------------------------------------------------------------------
create or replace function public.get_my_data(p_device uuid)
returns setof public.submissions
language sql stable security definer set search_path = public as $$
  select * from public.submissions where device_id = p_device order by created_at;
$$;

create or replace function public.delete_my_data(p_device uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from public.submissions where device_id = p_device;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.get_my_data(uuid) from public;
revoke all on function public.delete_my_data(uuid) from public;
grant execute on function public.get_my_data(uuid) to anon;
grant execute on function public.delete_my_data(uuid) to anon;
