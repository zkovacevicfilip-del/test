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

-- ---------------------------------------------------------------------------
-- Zpřísnění zabezpečení (8. 11. 2026). Skript lze spustit opakovaně.
-- 1) Indexy pro rychlé kontroly limitů a vyhledání vlastních dat.
-- 2) Limit: nejvýš 50 odeslání za den z jednoho zařízení A nejvýš 600 za hodinu
--    celkem. Chrání před zasypáním databáze nesmysly s měnícím se ID zařízení.
-- 3) Interní funkci limitu nesmí nikdo volat přímo.
-- ---------------------------------------------------------------------------
create index if not exists submissions_created_at_idx on public.submissions (created_at);
create index if not exists submissions_device_created_idx on public.submissions (device_id, created_at);

create or replace function public.limit_submissions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.submissions
      where device_id = new.device_id and created_at > now() - interval '1 day') >= 50 then
    raise exception 'Příliš mnoho odeslání za den';
  end if;
  if (select count(*) from public.submissions
      where created_at > now() - interval '1 hour') >= 600 then
    raise exception 'Služba je dočasně přetížená, zkuste to později';
  end if;
  return new;
end $$;
revoke all on function public.limit_submissions() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Zpřísnění zabezpečení, část 2 (8. 11. 2026). Skript lze spustit opakovaně.
-- 1) Kontrola obsahu: data smí obsahovat jen čísla, ano/ne a krátké hodnoty
--    (např. "fixed", "P1", datum, náhodné ID). Volný text, HTML, odkazy ani
--    e-maily databáze nepřijme, slib „jen čísla, žádné volné texty“ tak platí
--    i pro data poslaná mimo aplikaci.
-- 2) Každý řádek musí nést záznam o souhlasu (verze a čas).
-- 3) Limity: 50 odeslání za den z jednoho zařízení, celkem nejvýš 600 za hodinu
--    a 5000 za den a tabulka nepřeroste 300 MB (bezplatný tarif má 500 MB).
-- 4) Pomocné funkce nesmí nikdo volat přímo, funkce pro práva uživatelů jen
--    aplikace (role anon).
-- ---------------------------------------------------------------------------
create or replace function public.submission_json_ok(j jsonb, depth int default 0)
returns boolean
language plpgsql immutable set search_path = pg_catalog as $$
declare k text; v jsonb; n int := 0;
begin
  if depth > 6 then return false; end if;
  case jsonb_typeof(j)
    when 'object' then
      for k, v in select * from jsonb_each(j) loop
        n := n + 1;
        if n > 64 or k !~ '^[A-Za-z0-9_]{1,32}$' or not public.submission_json_ok(v, depth + 1) then
          return false;
        end if;
      end loop;
      return true;
    when 'array' then
      if jsonb_array_length(j) > 500 then return false; end if;
      for v in select * from jsonb_array_elements(j) loop
        if not public.submission_json_ok(v, depth + 1) then return false; end if;
      end loop;
      return true;
    when 'string' then
      return (j #>> '{}') ~ '^[0-9A-Za-z._:áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ-]{0,40}$';
    when 'number' then
      return abs((j #>> '{}')::numeric) <= 1e9;
    else
      return true; -- true, false, null
  end case;
end $$;

create or replace function public.limit_submissions() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if not public.submission_json_ok(new.data) then
    raise exception 'Data mají nečekaný tvar (povolená jsou jen čísla a krátké hodnoty)';
  end if;
  if jsonb_typeof(new.data -> 'consent') is distinct from 'object'
     or coalesce(new.data -> 'consent' ->> 'v', '') !~ '^\d{4}-\d{2}-\d{2}$'
     or coalesce(new.data -> 'consent' ->> 'at', '') !~ '^\d{4}-\d{2}-\d{2}T' then
    raise exception 'Chybí záznam o souhlasu se sdílením';
  end if;
  if (select count(*) from public.submissions
      where device_id = new.device_id and created_at > now() - interval '1 day') >= 50 then
    raise exception 'Příliš mnoho odeslání za den';
  end if;
  if (select count(*) from public.submissions where created_at > now() - interval '1 hour') >= 600
     or (select count(*) from public.submissions where created_at > now() - interval '1 day') >= 5000
     or pg_total_relation_size('public.submissions'::regclass) > 300 * 1024 * 1024 then
    raise exception 'Služba je dočasně přetížená, zkuste to později';
  end if;
  return new;
end $$;

revoke all on function public.submission_json_ok(jsonb, int) from public, anon, authenticated;
revoke all on function public.limit_submissions() from public, anon, authenticated;
revoke all on function public.get_my_data(uuid) from public, anon, authenticated;
revoke all on function public.delete_my_data(uuid) from public, anon, authenticated;
grant execute on function public.get_my_data(uuid) to anon;
grant execute on function public.delete_my_data(uuid) to anon;

-- Kontrola na úplný konec: po spuštění celého souboru se dole ukáže „Ochrana je zapnutá“.
-- Když se ukáže jen „Success. No rows returned“, nespustil se celý soubor.
select case when to_regprocedure('public.submission_json_ok(jsonb,integer)') is not null
  and exists (select 1 from pg_trigger where tgname = 'limit_submissions' and tgrelid = 'public.submissions'::regclass)
  then 'Ochrana je zapnutá' else 'Chyba: něco chybí, napiš Claudovi' end as vysledek;
