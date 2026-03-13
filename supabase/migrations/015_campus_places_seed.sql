-- ============================================================================
-- 015_campus_places_seed.sql
-- Phase 7: Seed on-campus places (Christ University Central Campus).
-- Idempotent — uses ON CONFLICT DO NOTHING.
-- ============================================================================

INSERT INTO places (
  name, category, type, sub_type, address,
  lat, lng, is_on_campus, is_static, is_manual_override,
  data_source, timing, crowd_level, rating, rating_count
) VALUES
  ('Mingos', 'campus', 'Food', 'Cafe',
   'Central Block, near Gourmet & Birdspark',
   12.9346, 77.6070, true, true, true,
   'manual_skeleton', '8:00 AM – 6:00 PM', 'moderate', 4.2, 85),

  ('Michael', 'campus', 'Food', 'Cafe',
   'Central Block, Gourmet',
   12.9345, 77.6069, true, true, true,
   'manual_skeleton', '8:00 AM – 5:30 PM', 'moderate', 4.0, 62),

  ('Nandini', 'campus', 'Food', 'Cafe',
   'Opp. to Central Block, Ground Level',
   12.9348, 77.6072, true, true, true,
   'manual_skeleton', '7:30 AM – 6:00 PM', 'high', 4.3, 120),

  ('Fresteria', 'campus', 'Food', 'Cafe',
   'Opp. to Central Block, Ground Level',
   12.9349, 77.6071, true, true, true,
   'manual_skeleton', '8:00 AM – 5:00 PM', 'moderate', 3.9, 55),

  ('Kiosk', 'campus', 'Food', 'Snacks',
   'Near Block 2, Ground Level',
   12.9342, 77.6065, true, true, true,
   'manual_skeleton', '8:30 AM – 4:30 PM', 'low', 3.7, 40),

  ('JustBake', 'campus', 'Food', 'Cake Shop',
   'Near Basketball Court',
   12.9340, 77.6068, true, true, true,
   'manual_skeleton', '9:00 AM – 7:00 PM', 'low', 4.1, 78),

  ('Punjabi Bites', 'campus', 'Food', 'Restaurant',
   'Central Block, Ground Level',
   12.9344, 77.6070, true, true, true,
   'manual_skeleton', '11:00 AM – 3:00 PM', 'high', 4.0, 95),

  ('Stationery Store', 'campus', 'Shop', 'Stationery',
   'Central Block, Ground Floor',
   12.9347, 77.6071, true, true, true,
   'manual_skeleton', '8:00 AM – 5:00 PM', 'low', 3.8, 30),

  ('Xerox & Print Center', 'campus', 'Services', 'Print',
   'Near Block 1, Ground Level',
   12.9343, 77.6067, true, true, true,
   'manual_skeleton', '8:00 AM – 6:00 PM', 'moderate', 3.6, 45),

  ('Christ Central Library', 'campus', 'Study', 'Library',
   'Central Block, 2nd Floor',
   12.9346, 77.6069, true, true, true,
   'manual_skeleton', '8:00 AM – 8:00 PM', 'low', 4.5, 200)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DONE
-- ============================================================================
