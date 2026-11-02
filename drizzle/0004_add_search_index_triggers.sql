-- Create function to format text for search index
CREATE OR REPLACE FUNCTION format_search_text(text_input text)
RETURNS text AS $$
BEGIN
  -- Simple title case conversion for PostgreSQL
  -- This is a basic implementation, more complex formatting is done in the application
  RETURN INITCAP(text_input);
END;
$$ LANGUAGE plpgsql;

-- Function to update search index for city changes
CREATE OR REPLACE FUNCTION update_city_search_index()
RETURNS TRIGGER AS $$
DECLARE
  city_record RECORD;
  province_record RECORD;
  formatted_city_name text;
  formatted_province_name text;
  search_text text;
BEGIN
  -- Get city and province information
  IF TG_OP = 'DELETE' THEN
    city_record := OLD;
  ELSE
    city_record := NEW;
  END IF;

  -- Get province information
  SELECT * INTO province_record FROM province WHERE id = city_record.province_id;

  IF TG_OP = 'DELETE' THEN
    -- Remove from search index
    DELETE FROM search_index WHERE city_id = OLD.id;
    RETURN OLD;
  ELSE
    -- Format names with title case
    formatted_city_name := format_search_text(city_record.name);
    formatted_province_name := province_record.name;

    -- Special handling for DI and DKI provinces - keep them uppercase
    IF NOT (formatted_province_name LIKE 'DI %' OR formatted_province_name LIKE 'DKI %') THEN
      formatted_province_name := format_search_text(formatted_province_name);
    END IF;

    -- Create search text: "CityName, ProvinceName"
    search_text := formatted_city_name || ' ' || formatted_province_name || ' ' || formatted_city_name || ', ' || formatted_province_name;

    -- Delete existing city entries and insert new one
    DELETE FROM search_index WHERE city_id = city_record.id AND idx_type = 'city';
    INSERT INTO search_index (idx_type, city_id, villa_id, text)
    VALUES ('city', city_record.id, NULL, search_text);

    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update search index for villa changes
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

    -- Format villa title
    formatted_villa_title := villa_record.title;

    -- Create search text: "VillaTitle, CityName, ProvinceName" or just "VillaTitle" if no city
    search_text := formatted_villa_title;

    IF city_record.name IS NOT NULL THEN
      formatted_city_name := format_search_text(city_record.name);

      IF province_record.name IS NOT NULL THEN
        formatted_province_name := province_record.name;

        -- Special handling for DI and DKI provinces
        IF NOT (formatted_province_name LIKE 'DI %' OR formatted_province_name LIKE 'DKI %') THEN
          formatted_province_name := format_search_text(formatted_province_name);
        END IF;

        search_text := formatted_villa_title || ', ' || formatted_city_name || ', ' || formatted_province_name;
      ELSE
        search_text := formatted_villa_title || ', ' || formatted_city_name;
      END IF;
    END IF;

    -- Delete existing villa entries and insert new one
    DELETE FROM search_index WHERE villa_id = villa_record.id AND idx_type = 'villa';
    INSERT INTO search_index (idx_type, villa_id, city_id, slug, text)
    VALUES ('villa', villa_record.id, villa_record.city_id, villa_record.slug, search_text);

    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for city table
DROP TRIGGER IF EXISTS city_search_index_trigger ON city;
CREATE TRIGGER city_search_index_trigger
  AFTER INSERT OR UPDATE OR DELETE ON city
  FOR EACH ROW
  EXECUTE FUNCTION update_city_search_index();

-- Create triggers for villa table
DROP TRIGGER IF EXISTS villa_search_index_trigger ON villa;
CREATE TRIGGER villa_search_index_trigger
  AFTER INSERT OR UPDATE OR DELETE ON villa
  FOR EACH ROW
  EXECUTE FUNCTION update_villa_search_index();

-- Also create trigger for province updates to update city search indexes
CREATE OR REPLACE FUNCTION update_province_search_index()
RETURNS TRIGGER AS $$
BEGIN
  -- When province name changes, update all cities in that province
  IF TG_OP = 'UPDATE' AND OLD.name != NEW.name THEN
    -- This will trigger the city trigger for each city in the province
    UPDATE city SET created_at = created_at WHERE province_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS province_search_index_trigger ON province;
CREATE TRIGGER province_search_index_trigger
  AFTER UPDATE ON province
  FOR EACH ROW
  EXECUTE FUNCTION update_province_search_index();