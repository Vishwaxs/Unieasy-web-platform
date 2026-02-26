-- ============================================================================
-- 003_seed_data.sql
-- UniEasy — Example seed data for campus listings.
-- Uses ON CONFLICT DO NOTHING so it is safe to re-run.
-- ============================================================================

-- ─── FOOD_ITEMS seeds ───────────────────────────────────────────────────────
INSERT INTO food_items (id, name, restaurant, price, rating, reviews, is_veg, comment)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Masala Dosa', 'Campus Canteen', 60, 4.5, 120, true, 'Crispy with sambar and chutney'),
  ('a0000000-0000-0000-0000-000000000002', 'Chicken Biryani', 'Spice Garden', 150, 4.3, 95, false, 'Fragrant with tender chicken'),
  ('a0000000-0000-0000-0000-000000000003', 'Paneer Butter Masala', 'North Indian Corner', 130, 4.4, 80, true, 'Rich and creamy')
ON CONFLICT (id) DO NOTHING;

-- ─── ACCOMMODATIONS seeds ───────────────────────────────────────────────────
INSERT INTO accommodations (id, name, type, price, rating, reviews, distance, amenities, comment)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Christ PG Men', 'PG', 8000, 4.2, 45, '0.5 km', ARRAY['WiFi','Meals','Laundry'], 'Close to campus, well maintained'),
  ('b0000000-0000-0000-0000-000000000002', 'Sunrise Apartments', 'Apartment', 12000, 4.0, 30, '1.2 km', ARRAY['WiFi','Gym','Parking'], 'Modern amenities, quiet area')
ON CONFLICT (id) DO NOTHING;

-- ─── EXPLORE_PLACES seeds ───────────────────────────────────────────────────
INSERT INTO explore_places (id, name, type, rating, reviews, distance, timing, crowd, comment)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Lalbagh Botanical Garden', 'Park', 4.6, 200, '3.5 km', '6 AM - 7 PM', 'Moderate', 'Beautiful gardens, great for morning walks'),
  ('c0000000-0000-0000-0000-000000000002', 'Cubbon Park', 'Park', 4.5, 180, '5 km', '6 AM - 6 PM', 'High on weekends', 'Iconic Bangalore landmark')
ON CONFLICT (id) DO NOTHING;

-- ─── STUDY_SPOTS seeds ─────────────────────────────────────────────────────
INSERT INTO study_spots (id, name, type, rating, reviews, distance, timing, noise, has_wifi, comment)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Central Library', 'Library', 4.7, 150, '0 km', '8 AM - 9 PM', 'Very Quiet', true, 'Best spot on campus for focused study'),
  ('d0000000-0000-0000-0000-000000000002', 'Third Wave Coffee', 'Cafe', 4.3, 60, '1 km', '7 AM - 11 PM', 'Moderate', true, 'Good coffee, decent seating')
ON CONFLICT (id) DO NOTHING;

-- ─── ESSENTIALS seeds ───────────────────────────────────────────────────────
INSERT INTO essentials (id, name, category, rating, reviews, distance, comment)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Campus Xerox Center', 'Stationery', 4.1, 70, '0 km', 'Quick prints, binding available'),
  ('e0000000-0000-0000-0000-000000000002', 'MedPlus Pharmacy', 'Medical', 4.4, 55, '0.3 km', 'Open till 10 PM, all common medicines')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DONE — Run after 002, before 004.
-- ============================================================================
