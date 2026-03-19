-- ============================================================================
-- 015_campus_places_seed.sql
-- Phase 7: Seed on-campus places (Christ University Central Campus).
-- Deterministic reset: removes existing campus rows, inserts only approved list.
-- ============================================================================

DELETE FROM places
WHERE category = 'campus'
  AND is_on_campus = true;

INSERT INTO places (
  name, category, type, sub_type, address,
  lat, lng, is_on_campus, is_static, is_manual_override,
  data_source, timing, crowd_level, rating, rating_count
) VALUES
  ('Cafe coffee day', 'campus', 'Food', 'Cafe',
   'opp. To R&D block',
   12.93460, 77.60700, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('4th block cafe', 'campus', 'Food', 'Cafe',
   'B/W block 4 and R&D (Basement)',
   12.93462, 77.60702, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('K E cafe', 'campus', 'Food', 'Cafe',
   'Boys hostel Terrace',
   12.93464, 77.60704, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('Mingos', 'campus', 'Food', 'Cafe',
   'Birds Park',
   12.93466, 77.60706, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('Kiosk', 'campus', 'Food', 'Snacks',
   'Infront of block 2',
   12.93468, 77.60708, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('Chapel', 'campus', 'Services', 'Prayer',
   'Block 2 - 3rd floor',
   12.93470, 77.60710, true, true, true,
   'manual_skeleton', 'Check on-site', 'low', 0, 0),

  ('Chapel', 'campus', 'Services', 'Prayer',
   'Central Block - 4th floor',
   12.93472, 77.60712, true, true, true,
   'manual_skeleton', 'Check on-site', 'low', 0, 0),

  ('Nandini', 'campus', 'Food', 'Cafe',
   'Adjacent to block 1',
   12.93474, 77.60714, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('Fresheteria', 'campus', 'Food', 'Cafe',
   'Adjacent to block 1',
   12.93476, 77.60716, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('Stall', 'campus', 'Food', 'Snacks',
   'Adjacent to block 1',
   12.93478, 77.60718, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('Just bake', 'campus', 'Food', 'Bakery',
   'Adjacent to central block',
   12.93480, 77.60720, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('Punjabi bites', 'campus', 'Food', 'Restaurant',
   'Central Block - Gourmet',
   12.93482, 77.60722, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('Michael''s', 'campus', 'Food', 'Cafe',
   'Central Block - Gourmet',
   12.93484, 77.60724, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('Eleven 11', 'campus', 'Food', 'Cafe',
   'Central Block - Gourmet',
   12.93486, 77.60726, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('Mingos', 'campus', 'Food', 'Cafe',
   'Central Block - Gourmet',
   12.93488, 77.60728, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('Christ Bakery', 'campus', 'Food', 'Bakery',
   'Central Block - Gourmet',
   12.93490, 77.60730, true, true, true,
   'manual_skeleton', 'Check on-site', 'moderate', 0, 0),

  ('Health Center', 'campus', 'Services', 'Health',
   'Central Block - Gourmet',
   12.93492, 77.60732, true, true, true,
   'manual_skeleton', 'Check on-site', 'low', 0, 0),

  ('Stationery- Nice service', 'campus', 'Shop', 'Stationery',
   'Central Block - Gourmet',
   12.93494, 77.60734, true, true, true,
   'manual_skeleton', 'Check on-site', 'low', 0, 0),

  ('Stationery- Nice service', 'campus', 'Shop', 'Stationery',
   'Central Block - Gourmet',
   12.93496, 77.60736, true, true, true,
   'manual_skeleton', 'Check on-site', 'low', 0, 0);

-- ============================================================================
-- DONE
-- ============================================================================
