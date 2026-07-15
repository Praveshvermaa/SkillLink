-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add geography location column of type Point with SRID 4326 (WGS 84)
ALTER TABLE skills ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- 3. Create or update trigger function to synchronize coordinates
CREATE OR REPLACE FUNCTION update_skills_location()
RETURNS trigger AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    -- PostGIS ST_Point takes (longitude, latitude) - X, Y coordinate order!
    NEW.location := ST_SetSRID(ST_Point(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to run before insert or update on the skills table
DROP TRIGGER IF EXISTS trg_update_skills_location ON skills;
CREATE TRIGGER trg_update_skills_location
BEFORE INSERT OR UPDATE ON skills
FOR EACH ROW
EXECUTE FUNCTION update_skills_location();

-- 5. Backfill existing skills table data with geography values
UPDATE skills 
SET location = ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 6. Create a GiST index on the geography column for spatial operations
CREATE INDEX IF NOT EXISTS idx_skills_location_gist ON skills USING gist(location);

-- 7. Create database RPC function for bounding-box search
CREATE OR REPLACE FUNCTION get_skills_in_bounds(
  min_lat float,
  max_lat float,
  min_lng float,
  max_lng float
)
RETURNS setof skills SECURITY INVOKER AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM skills
  WHERE location && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326);
END;
$$ LANGUAGE plpgsql;

-- 8. Create database RPC function for sorting by distance (KNN)
-- Note: provider name/avatar are embedded in the JOIN so PostgREST
-- does NOT need a relationship select (avoids 400 on custom RETURNS TABLE).
CREATE OR REPLACE FUNCTION get_skills_sorted_by_distance(
  user_lat float,
  user_lng float,
  search_query text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  provider_id uuid,
  title text,
  category text,
  description text,
  price numeric,
  experience text,
  latitude float,
  longitude float,
  address text,
  images text[],
  created_at timestamptz,
  distance_meters float,
  provider_name text,
  provider_avatar_url text
) SECURITY INVOKER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.provider_id,
    s.title,
    s.category,
    s.description,
    s.price,
    s.experience,
    s.latitude,
    s.longitude,
    s.address,
    s.images,
    s.created_at,
    ST_Distance(s.location, ST_SetSRID(ST_Point(user_lng, user_lat), 4326)::geography) AS distance_meters,
    p.name AS provider_name,
    p.avatar_url AS provider_avatar_url
  FROM skills s
  LEFT JOIN profiles p ON p.id = s.provider_id
  WHERE (search_query IS NULL OR s.title ILIKE '%' || search_query || '%')
  ORDER BY s.location <-> ST_SetSRID(ST_Point(user_lng, user_lat), 4326)::geography;
END;
$$ LANGUAGE plpgsql;
