-- ============================================================================
-- 008_cleanup_and_seed_all_categories.sql
-- UniEasy — Drop legacy tables, seed missing categories, add on-campus records.
-- Run this AFTER migration 006 + 007 and the Google Places seeder.
-- All statements are idempotent (safe to re-run).
-- Manual records use synthetic google_place_id prefixed with 'manual_' for
-- idempotent ON CONFLICT upserts.
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1: DROP OLD LEGACY TABLES
-- These are replaced by the unified 'places' table.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS food_items CASCADE;
DROP TABLE IF EXISTS accommodations CASCADE;
DROP TABLE IF EXISTS explore_places CASCADE;
DROP TABLE IF EXISTS study_spots CASCADE;
DROP TABLE IF EXISTS essentials CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2: SEED MISSING CATEGORIES
-- The Google seeder covers: food, accommodation, study, health, fitness, services.
-- The following inserts cover: transport, campus, essentials, hangout, safety,
-- events, marketplace.
-- ON CONFLICT (google_place_id) DO NOTHING ensures idempotency on re-run.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Transport ───────────────────────────────────────────────────────────────
INSERT INTO places (google_place_id, name, category, type, address, city, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count)
VALUES
  ('manual_transport_001', 'Namma Metro - Jayanagar Station', 'transport', 'metro', '11th Main Rd, 4th Block, Jayanagar', 'Bangalore', 12.9305, 77.5838, false, true, false, 'manual_skeleton', 4.2, 850),
  ('manual_transport_002', 'BMTC Bus Stand - Banashankari', 'transport', 'bus', 'Banashankari 2nd Stage', 'Bangalore', 12.9254, 77.5732, false, true, false, 'manual_skeleton', 3.5, 320),
  ('manual_transport_003', 'Namma Metro - South End Circle', 'transport', 'metro', 'South End Circle', 'Bangalore', 12.9404, 77.5895, false, true, false, 'manual_skeleton', 4.0, 620),
  ('manual_transport_004', 'Ola/Uber Pickup Point - Main Gate', 'transport', 'rideshare', 'Main Gate, University Campus', 'Bangalore', 12.9345, 77.6069, true, true, true, 'manual_skeleton', 4.3, 200),
  ('manual_transport_005', 'Campus Bicycle Rental', 'transport', 'bicycle', 'Near Main Parking, University Campus', 'Bangalore', 12.9348, 77.6065, true, true, true, 'manual_skeleton', 4.1, 45)
ON CONFLICT (google_place_id) DO NOTHING;

-- ─── Campus ──────────────────────────────────────────────────────────────────
INSERT INTO places (google_place_id, name, category, type, address, city, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count)
VALUES
  ('manual_campus_001', 'University Main Library', 'campus', 'library', 'Central Block, University Campus', 'Bangalore', 12.9350, 77.6072, true, true, true, 'manual_skeleton', 4.7, 890),
  ('manual_campus_002', 'Central Auditorium', 'campus', 'auditorium', 'Block A, University Campus', 'Bangalore', 12.9342, 77.6060, true, true, true, 'manual_skeleton', 4.5, 450),
  ('manual_campus_003', 'Computer Science Department', 'campus', 'department', 'Block C, University Campus', 'Bangalore', 12.9355, 77.6078, true, true, true, 'manual_skeleton', 4.6, 320),
  ('manual_campus_004', 'Admin Office', 'campus', 'admin', 'Main Building, University Campus', 'Bangalore', 12.9347, 77.6067, true, true, true, 'manual_skeleton', 3.8, 150),
  ('manual_campus_005', 'University Canteen', 'campus', 'canteen', 'Near Block B, University Campus', 'Bangalore', 12.9340, 77.6075, true, true, true, 'manual_skeleton', 4.2, 1200),
  ('manual_campus_006', 'Sports Ground', 'campus', 'ground', 'East Wing, University Campus', 'Bangalore', 12.9360, 77.6085, true, true, true, 'manual_skeleton', 4.4, 380)
ON CONFLICT (google_place_id) DO NOTHING;

-- ─── Essentials ──────────────────────────────────────────────────────────────
INSERT INTO places (google_place_id, name, category, type, address, city, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count)
VALUES
  ('manual_essentials_001', 'Campus Stationery Store', 'essentials', 'stationery', 'Near Main Gate, University Campus', 'Bangalore', 12.9344, 77.6068, true, true, true, 'manual_skeleton', 4.3, 290),
  ('manual_essentials_002', 'Quick Print & Xerox', 'essentials', 'print_shop', 'SG Palya Main Road', 'Bangalore', 12.9330, 77.6050, false, true, false, 'manual_skeleton', 4.1, 180),
  ('manual_essentials_003', 'Campus ATM - SBI', 'essentials', 'atm', 'Near Admin Block, University Campus', 'Bangalore', 12.9346, 77.6066, true, true, true, 'manual_skeleton', 3.9, 120),
  ('manual_essentials_004', 'Campus ATM - HDFC', 'essentials', 'atm', 'Near Canteen, University Campus', 'Bangalore', 12.9341, 77.6074, true, true, true, 'manual_skeleton', 4.0, 95),
  ('manual_essentials_005', 'D-Mart Nearby', 'essentials', 'supermarket', 'Banashankari, Bangalore', 'Bangalore', 12.9270, 77.5780, false, true, false, 'manual_skeleton', 4.4, 2100),
  ('manual_essentials_006', 'Sri Balaji Courier Services', 'essentials', 'courier', 'SG Palya, Bangalore', 'Bangalore', 12.9335, 77.6055, false, true, false, 'manual_skeleton', 3.8, 75)
ON CONFLICT (google_place_id) DO NOTHING;

-- ─── Hangout ─────────────────────────────────────────────────────────────────
INSERT INTO places (google_place_id, name, category, type, address, city, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count)
VALUES
  ('manual_hangout_001', 'Cubbon Park', 'hangout', 'park', 'Kasturba Road, Bangalore', 'Bangalore', 12.9763, 77.5929, false, true, false, 'manual_skeleton', 4.6, 15000),
  ('manual_hangout_002', 'Lalbagh Botanical Garden', 'hangout', 'park', 'Lalbagh, Bangalore', 'Bangalore', 12.9507, 77.5848, false, true, false, 'manual_skeleton', 4.7, 22000),
  ('manual_hangout_003', 'Forum Mall', 'hangout', 'mall', 'Hosur Road, Koramangala', 'Bangalore', 12.9344, 77.6101, false, true, false, 'manual_skeleton', 4.3, 8500),
  ('manual_hangout_004', 'Student Hangout Zone', 'hangout', 'lounge', 'Block B Basement, University Campus', 'Bangalore', 12.9343, 77.6073, true, true, true, 'manual_skeleton', 4.5, 340),
  ('manual_hangout_005', 'Chai Point - Near Campus', 'hangout', 'cafe', 'SG Palya Junction', 'Bangalore', 12.9332, 77.6048, false, true, false, 'manual_skeleton', 4.2, 650),
  ('manual_hangout_006', 'BoardGame Cafe', 'hangout', 'entertainment', '1st Block, Koramangala', 'Bangalore', 12.9352, 77.6145, false, true, false, 'manual_skeleton', 4.4, 420)
ON CONFLICT (google_place_id) DO NOTHING;

-- ─── Safety ──────────────────────────────────────────────────────────────────
INSERT INTO places (google_place_id, name, category, type, address, city, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count)
VALUES
  ('manual_safety_001', 'Campus Security Office', 'safety', 'security', 'Main Gate, University Campus', 'Bangalore', 12.9345, 77.6068, true, true, true, 'manual_skeleton', 4.6, 180),
  ('manual_safety_002', 'Women Safety Cell', 'safety', 'helpline', 'Admin Block 2F, University Campus', 'Bangalore', 12.9347, 77.6067, true, true, true, 'manual_skeleton', 4.8, 120),
  ('manual_safety_003', 'Anti-Ragging Committee', 'safety', 'committee', 'Dean Office, University Campus', 'Bangalore', 12.9349, 77.6069, true, true, true, 'manual_skeleton', 4.5, 65),
  ('manual_safety_004', 'Nearest Police Station - SG Palya', 'safety', 'police', 'SG Palya Main Road', 'Bangalore', 12.9320, 77.6045, false, true, false, 'manual_skeleton', 3.7, 240),
  ('manual_safety_005', 'Emergency First Aid Room', 'safety', 'first_aid', 'Ground Floor, Block A, University Campus', 'Bangalore', 12.9346, 77.6062, true, true, true, 'manual_skeleton', 4.4, 90)
ON CONFLICT (google_place_id) DO NOTHING;

-- ─── Events ──────────────────────────────────────────────────────────────────
INSERT INTO places (google_place_id, name, category, type, address, city, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count)
VALUES
  ('manual_events_001', 'Student Activity Center', 'events', 'venue', 'Block D, University Campus', 'Bangalore', 12.9353, 77.6080, true, true, true, 'manual_skeleton', 4.6, 540),
  ('manual_events_002', 'Open Air Theatre', 'events', 'venue', 'East Lawn, University Campus', 'Bangalore', 12.9358, 77.6082, true, true, true, 'manual_skeleton', 4.7, 380),
  ('manual_events_003', 'Cultural Club Room', 'events', 'club', 'Block B, 1st Floor, University Campus', 'Bangalore', 12.9341, 77.6071, true, true, true, 'manual_skeleton', 4.4, 220),
  ('manual_events_004', 'Tech Fest Office', 'events', 'club', 'Block C, 2nd Floor, University Campus', 'Bangalore', 12.9354, 77.6076, true, true, true, 'manual_skeleton', 4.5, 310),
  ('manual_events_005', 'Seminar Hall', 'events', 'venue', 'Block A, 3rd Floor, University Campus', 'Bangalore', 12.9348, 77.6064, true, true, true, 'manual_skeleton', 4.3, 190)
ON CONFLICT (google_place_id) DO NOTHING;

-- ─── Marketplace ─────────────────────────────────────────────────────────────
INSERT INTO places (google_place_id, name, category, type, address, city, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count)
VALUES
  ('manual_marketplace_001', 'Campus Buy & Sell Board', 'marketplace', 'bulletin', 'Near Canteen Notice Board, University Campus', 'Bangalore', 12.9340, 77.6074, true, true, true, 'manual_skeleton', 4.0, 85),
  ('manual_marketplace_002', 'Second-Hand Books Corner', 'marketplace', 'books', 'Library Ground Floor, University Campus', 'Bangalore', 12.9351, 77.6073, true, true, true, 'manual_skeleton', 4.3, 210),
  ('manual_marketplace_003', 'Student Marketplace Kiosk', 'marketplace', 'general', 'Student Hub, Block B, University Campus', 'Bangalore', 12.9342, 77.6072, true, true, true, 'manual_skeleton', 4.1, 150),
  ('manual_marketplace_004', 'Electronics Repair Shop', 'marketplace', 'repair', 'SG Palya, Bangalore', 'Bangalore', 12.9328, 77.6052, false, true, false, 'manual_skeleton', 4.2, 340)
ON CONFLICT (google_place_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 3: ON-CAMPUS SKELETON RECORDS
-- Key campus facilities with is_on_campus=true AND is_manual_override=true.
-- These are protected from being overwritten by the Google seeder.
-- ═══════════════════════════════════════════════════════════════════════════════

-- On-campus food
INSERT INTO places (google_place_id, name, category, type, address, city, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count)
VALUES
  ('manual_food_oncampus_001', 'Campus Canteen - Main', 'food', 'canteen', 'Near Block B, University Campus', 'Bangalore', 12.9340, 77.6075, true, true, true, 'manual_skeleton', 4.2, 1500),
  ('manual_food_oncampus_002', 'Campus Juice Bar', 'food', 'cafe', 'Near Sports Ground, University Campus', 'Bangalore', 12.9358, 77.6083, true, true, true, 'manual_skeleton', 4.0, 380),
  ('manual_food_oncampus_003', 'Night Canteen', 'food', 'canteen', 'Hostel Block, University Campus', 'Bangalore', 12.9362, 77.6088, true, true, true, 'manual_skeleton', 3.9, 620)
ON CONFLICT (google_place_id) DO NOTHING;

-- On-campus study
INSERT INTO places (google_place_id, name, category, type, address, city, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count)
VALUES
  ('manual_study_oncampus_001', '24/7 Reading Room', 'study', 'reading_room', 'Library 2nd Floor, University Campus', 'Bangalore', 12.9351, 77.6073, true, true, true, 'manual_skeleton', 4.8, 670),
  ('manual_study_oncampus_002', 'Computer Lab - Open Access', 'study', 'lab', 'Block C, Ground Floor, University Campus', 'Bangalore', 12.9355, 77.6077, true, true, true, 'manual_skeleton', 4.5, 420)
ON CONFLICT (google_place_id) DO NOTHING;

-- On-campus health
INSERT INTO places (google_place_id, name, category, type, address, city, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count)
VALUES
  ('manual_health_oncampus_001', 'Campus Health Center', 'health', 'clinic', 'Near Admin Block, University Campus', 'Bangalore', 12.9347, 77.6066, true, true, true, 'manual_skeleton', 4.3, 450),
  ('manual_health_oncampus_002', 'Counselling Center', 'health', 'counselling', 'Block A, 2nd Floor, University Campus', 'Bangalore', 12.9348, 77.6063, true, true, true, 'manual_skeleton', 4.7, 180)
ON CONFLICT (google_place_id) DO NOTHING;

-- On-campus fitness
INSERT INTO places (google_place_id, name, category, type, address, city, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count)
VALUES
  ('manual_fitness_oncampus_001', 'University Gym', 'fitness', 'gym', 'Sports Complex, University Campus', 'Bangalore', 12.9360, 77.6086, true, true, true, 'manual_skeleton', 4.4, 560),
  ('manual_fitness_oncampus_002', 'Yoga Room', 'fitness', 'yoga', 'Block D Terrace, University Campus', 'Bangalore', 12.9352, 77.6079, true, true, true, 'manual_skeleton', 4.6, 210)
ON CONFLICT (google_place_id) DO NOTHING;

-- On-campus accommodation
INSERT INTO places (google_place_id, name, category, type, address, city, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count)
VALUES
  ('manual_accom_oncampus_001', 'Boys Hostel - Block 1', 'accommodation', 'hostel', 'East Wing, University Campus', 'Bangalore', 12.9363, 77.6090, true, true, true, 'manual_skeleton', 3.8, 340),
  ('manual_accom_oncampus_002', 'Girls Hostel - Block 1', 'accommodation', 'hostel', 'West Wing, University Campus', 'Bangalore', 12.9338, 77.6058, true, true, true, 'manual_skeleton', 4.0, 280),
  ('manual_accom_oncampus_003', 'International Students Hostel', 'accommodation', 'hostel', 'North Wing, University Campus', 'Bangalore', 12.9370, 77.6075, true, true, true, 'manual_skeleton', 4.2, 95)
ON CONFLICT (google_place_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run these after migration to confirm)
-- ═══════════════════════════════════════════════════════════════════════════════
-- SELECT category, COUNT(*) FROM places GROUP BY category ORDER BY category;
-- SELECT COUNT(*) FROM places WHERE is_on_campus = true;
-- SELECT COUNT(*) FROM places WHERE is_manual_override = true;
-- SELECT DISTINCT category FROM places ORDER BY category;
-- Expected: all 13 categories present.
-- ============================================================================
