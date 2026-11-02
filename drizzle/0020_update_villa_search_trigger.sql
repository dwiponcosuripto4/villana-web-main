-- Update villa search index trigger to include address field
-- This matches the behavior of the populate-search-index.ts script

-- First drop the existing trigger and function
DROP TRIGGER IF EXISTS villa_search_index_trigger ON villa;
DROP FUNCTION IF EXISTS update_villa_search_index() CASCADE;

-- Recreate the function with address included
CREATE OR REPLACE FUNCTION update_villa_search_index()
RETURNS TRIGGER AS $$
DECLARE
  villa_record RECORD;
  city_record RECORD;
  province_record RECORD;
  formatted_villa_title text;
  formatted_city_name text;
  formatted_province_name text;
  search_text text;
  search_parts text[];
BEGIN
  -- Get villa information
  IF TG_OP = 'DELETE' THEN
    villa_record := OLD;
  ELSE
    villa_record := NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    -- Remove from search index
    DELETE FROM search_index WHERE villa_id = OLD.id;
    RETURN OLD;
  ELSE
    -- Get city and province information if available
    IF villa_record.city_id IS NOT NULL THEN
      SELECT * INTO city_record FROM city WHERE id = villa_record.city_id;
      IF FOUND AND city_record.province_id IS NOT NULL THEN
        SELECT * INTO province_record FROM province WHERE id = city_record.province_id;
      END IF;
    END IF;

    -- Initialize search parts array
    search_parts := ARRAY[]::text[];

    -- Add villa title (always present)
    formatted_villa_title := villa_record.title;
    search_parts := array_append(search_parts, formatted_villa_title);

    -- Add city name if available
    IF city_record.name IS NOT NULL THEN
      formatted_city_name := format_search_text(city_record.name);
      search_parts := array_append(search_parts, formatted_city_name);
    END IF;

    -- Add province name if available
    IF province_record.name IS NOT NULL THEN
      formatted_province_name := province_record.name;

      -- Special handling for DI and DKI provinces
      IF NOT (formatted_province_name LIKE 'DI %' OR formatted_province_name LIKE 'DKI %') THEN
        formatted_province_name := format_search_text(formatted_province_name);
      END IF;

      search_parts := array_append(search_parts, formatted_province_name);
    END IF;

    -- Add address if available
    IF villa_record.address IS NOT NULL AND villa_record.address != '' THEN
      search_parts := array_append(search_parts, villa_record.address);
    END IF;

    -- Join all parts with space separator
    -- Format: villa_title city province address
    search_text := array_to_string(search_parts, ' ');

    -- Delete existing villa entries and insert new one
    DELETE FROM search_index WHERE villa_id = villa_record.id AND idx_type = 'villa';
    INSERT INTO search_index (idx_type, villa_id, city_id, slug, text)
    VALUES ('villa', villa_record.id, villa_record.city_id, villa_record.slug, search_text);

    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to use the updated function
CREATE TRIGGER villa_search_index_trigger
  AFTER INSERT OR UPDATE OR DELETE ON villa
  FOR EACH ROW
  EXECUTE FUNCTION update_villa_search_index();

-- Optionally refresh all villa entries in the search index to apply the new format
-- This is commented out by default to avoid automatic data updates
-- UNCOMMENT the following line to refresh all villa search indexes:
-- UPDATE villa SET updated_at = NOW() WHERE status = 'published';