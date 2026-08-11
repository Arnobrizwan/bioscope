create or replace view public.saved_locations_with_coordinates with (security_invoker = true) as
select id, user_id, label,
  extensions.st_y(location::extensions.geometry) as latitude,
  extensions.st_x(location::extensions.geometry) as longitude,
  radius_km, created_at
from public.saved_locations;

create or replace function public.create_saved_location(
  p_user_id uuid,
  p_label text,
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km integer
) returns setof public.saved_locations_with_coordinates
language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'not authorized'; end if;
  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'invalid coordinates'; end if;
  if p_radius_km not in (5, 10, 25, 50) then raise exception 'invalid radius'; end if;

  insert into public.saved_locations (user_id, label, location, radius_km)
  values (
    p_user_id,
    p_label,
    extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography,
    p_radius_km
  ) returning id into v_id;

  return query select * from public.saved_locations_with_coordinates where id = v_id;
end;
$$;

grant select on public.saved_locations_with_coordinates to authenticated;
grant execute on function public.create_saved_location to authenticated;
