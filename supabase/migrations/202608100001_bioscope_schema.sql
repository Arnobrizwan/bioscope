create extension if not exists postgis with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  organization text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.field_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  species_name text not null check (char_length(species_name) between 2 and 160),
  scientific_name text,
  taxon_key bigint,
  location extensions.geography(point, 4326) not null,
  observed_at timestamptz not null,
  count integer not null default 1 check (count between 1 and 100000),
  notes text check (char_length(notes) <= 2000),
  evidence_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  location extensions.geography(point, 4326) not null,
  radius_km integer not null check (radius_km in (5, 10, 25, 50)),
  created_at timestamptz not null default now()
);

create table public.field_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  saved_location_id uuid references public.saved_locations(id) on delete set null,
  input jsonb not null,
  sections jsonb not null,
  model text,
  generation_mode text not null check (generation_mode in ('ai', 'deterministic-demo')),
  created_at timestamptz not null default now()
);

create index field_observations_location_idx on public.field_observations using gist (location);
create index field_observations_user_observed_idx on public.field_observations (user_id, observed_at desc);
create index field_observations_taxon_idx on public.field_observations (taxon_key) where taxon_key is not null;
create index saved_locations_location_idx on public.saved_locations using gist (location);

alter table public.profiles enable row level security;
alter table public.field_observations enable row level security;
alter table public.saved_locations enable row level security;
alter table public.field_briefs enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "observations_select_own_or_public" on public.field_observations for select using (auth.uid() = user_id or is_public);
create policy "observations_insert_own" on public.field_observations for insert with check (auth.uid() = user_id);
create policy "observations_update_own" on public.field_observations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "observations_delete_own" on public.field_observations for delete using (auth.uid() = user_id);
create policy "saved_locations_all_own" on public.saved_locations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "field_briefs_all_own" on public.field_briefs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name) values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace view public.field_observations_with_coordinates with (security_invoker = true) as
select id, user_id, species_name, scientific_name, taxon_key,
  extensions.st_y(location::extensions.geometry) as latitude,
  extensions.st_x(location::extensions.geometry) as longitude,
  observed_at, count, notes, evidence_url, is_public, created_at, updated_at
from public.field_observations;

create or replace function public.create_field_observation(
  p_user_id uuid, p_species_name text, p_scientific_name text, p_taxon_key bigint,
  p_latitude double precision, p_longitude double precision, p_observed_at timestamptz,
  p_count integer, p_notes text, p_evidence_url text, p_is_public boolean
) returns setof public.field_observations_with_coordinates
language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'not authorized'; end if;
  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'invalid coordinates'; end if;
  insert into public.field_observations (user_id, species_name, scientific_name, taxon_key, location, observed_at, count, notes, evidence_url, is_public)
  values (p_user_id, p_species_name, p_scientific_name, p_taxon_key,
    extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography,
    p_observed_at, p_count, p_notes, p_evidence_url, p_is_public) returning id into v_id;
  return query select * from public.field_observations_with_coordinates where id = v_id;
end;
$$;

create or replace function public.nearby_field_observations(
  p_user_id uuid, p_latitude double precision, p_longitude double precision,
  p_radius_km double precision, p_species text default null
) returns table (
  id uuid, user_id uuid, species_name text, scientific_name text, taxon_key bigint,
  latitude double precision, longitude double precision, observed_at timestamptz, count integer,
  notes text, evidence_url text, is_public boolean, distance_km double precision,
  created_at timestamptz, updated_at timestamptz
) language sql stable security invoker set search_path = '' as $$
  select o.id, o.user_id, o.species_name, o.scientific_name, o.taxon_key,
    extensions.st_y(o.location::extensions.geometry), extensions.st_x(o.location::extensions.geometry),
    o.observed_at, o.count, o.notes, o.evidence_url, o.is_public,
    extensions.st_distance(o.location, extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography) / 1000,
    o.created_at, o.updated_at
  from public.field_observations o
  where auth.uid() = p_user_id
    and (o.user_id = p_user_id or o.is_public)
    and extensions.st_dwithin(o.location, extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography, p_radius_km * 1000)
    and (p_species is null or o.species_name ilike '%' || p_species || '%' or o.scientific_name ilike '%' || p_species || '%')
  order by extensions.st_distance(
    o.location,
    extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography
  );
$$;

grant select on public.field_observations_with_coordinates to authenticated;
grant execute on function public.create_field_observation to authenticated;
grant execute on function public.nearby_field_observations to authenticated;
