-- Repeatable technical-demo records. Coordinates and timestamps are synthetic
-- and are not asserted field occurrences. UI labels derive from the "Demo data:"
-- notes prefix and the "Demo —" saved-location prefix.
do $$
declare
  target_user_id uuid;
begin
  select id into target_user_id
  from auth.users
  where email not like 'bioscope-e2e-%'
  order by created_at desc
  limit 1;

  if target_user_id is null then
    raise exception 'Create a BioScope Auth user before applying seed data';
  end if;

  insert into public.saved_locations (
    id, user_id, label, location, radius_km, created_at
  ) values
    ('10000000-0000-4000-8000-000000000001', target_user_id, 'Demo — inland survey area', extensions.st_setsrid(extensions.st_makepoint(102.39, 4.64), 4326)::extensions.geography, 25, '2026-07-18T08:00:00Z'),
    ('10000000-0000-4000-8000-000000000002', target_user_id, 'Demo — lowland forest area', extensions.st_setsrid(extensions.st_makepoint(101.82, 3.69), 4326)::extensions.geography, 10, '2026-07-12T08:00:00Z'),
    ('10000000-0000-4000-8000-000000000003', target_user_id, 'Demo — riparian survey area', extensions.st_setsrid(extensions.st_makepoint(102.23, 4.38), 4326)::extensions.geography, 5, '2026-07-05T08:00:00Z')
  on conflict (id) do update set
    user_id = excluded.user_id,
    label = excluded.label,
    location = excluded.location,
    radius_km = excluded.radius_km;

  insert into public.field_observations (
    id, user_id, species_name, scientific_name, taxon_key, location,
    observed_at, count, notes, is_public, created_at, updated_at
  ) values
    ('20000000-0000-4000-8000-000000000001', target_user_id, 'Rhinoceros hornbill', 'Buceros rhinoceros', 2476004, extensions.st_setsrid(extensions.st_makepoint(102.384, 4.646), 4326)::extensions.geography, '2026-07-17T23:40:00Z', 2, 'Demo data: synthetic interface record, not a verified field occurrence.', false, '2026-07-18T08:00:00Z', '2026-07-18T08:00:00Z'),
    ('20000000-0000-4000-8000-000000000002', target_user_id, 'Malayan tapir', 'Tapirus indicus', null, extensions.st_setsrid(extensions.st_makepoint(102.402, 4.631), 4326)::extensions.geography, '2026-07-16T18:20:00Z', 1, 'Demo data: synthetic interface record, not a verified field occurrence.', false, '2026-07-18T08:00:00Z', '2026-07-18T08:00:00Z'),
    ('20000000-0000-4000-8000-000000000003', target_user_id, 'Long-tailed macaque', 'Macaca fascicularis', 2436603, extensions.st_setsrid(extensions.st_makepoint(101.827, 3.697), 4326)::extensions.geography, '2026-07-11T01:15:00Z', 4, 'Demo data: synthetic interface record, not a verified field occurrence.', false, '2026-07-12T08:00:00Z', '2026-07-12T08:00:00Z'),
    ('20000000-0000-4000-8000-000000000004', target_user_id, 'Common tree frog', 'Polypedates leucomystax', 2423785, extensions.st_setsrid(extensions.st_makepoint(101.814, 3.681), 4326)::extensions.geography, '2026-07-10T13:05:00Z', 3, 'Demo data: synthetic interface record, not a verified field occurrence.', false, '2026-07-12T08:00:00Z', '2026-07-12T08:00:00Z'),
    ('20000000-0000-4000-8000-000000000005', target_user_id, 'Rajah Brooke''s birdwing', 'Trogonoptera brookiana', 1937514, extensions.st_setsrid(extensions.st_makepoint(102.226, 4.386), 4326)::extensions.geography, '2026-07-04T02:30:00Z', 2, 'Demo data: synthetic interface record, not a verified field occurrence.', false, '2026-07-05T08:00:00Z', '2026-07-05T08:00:00Z'),
    ('20000000-0000-4000-8000-000000000006', target_user_id, 'Red meranti', 'Shorea leprosula', 4097193, extensions.st_setsrid(extensions.st_makepoint(102.238, 4.372), 4326)::extensions.geography, '2026-07-03T00:50:00Z', 1, 'Demo data: synthetic interface record, not a verified field occurrence.', false, '2026-07-05T08:00:00Z', '2026-07-05T08:00:00Z')
  on conflict (id) do update set
    user_id = excluded.user_id,
    species_name = excluded.species_name,
    scientific_name = excluded.scientific_name,
    taxon_key = excluded.taxon_key,
    location = excluded.location,
    observed_at = excluded.observed_at,
    count = excluded.count,
    notes = excluded.notes,
    is_public = false,
    updated_at = excluded.updated_at;
end $$;
