-- ============================================================================
-- 009_comprehensive_seed_data.sql
-- Add 80+ manual records to fill thin categories with real CHRIST University
-- area data. All inserts use ON CONFLICT DO NOTHING for idempotency.
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRANSPORT (currently 5 → add 10 more = 15 total)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO places (google_place_id, name, category, type, address, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count, extra)
VALUES
  ('manual_transport_006', 'Silk Board Metro Station', 'transport', 'metro', 'Silk Board Junction, Bengaluru', 12.9177, 77.6238, false, true, true, 'manual_seed', 4.2, 3200, '{"route": "Yellow Line", "hours": "5:00 AM - 11:00 PM"}'),
  ('manual_transport_007', 'HSR Layout Metro Station', 'transport', 'metro', 'HSR Layout, Bengaluru', 12.9116, 77.6389, false, true, true, 'manual_seed', 4.1, 1800, '{"route": "Yellow Line", "hours": "5:00 AM - 11:00 PM"}'),
  ('manual_transport_008', 'Bommanahalli Bus Stand', 'transport', 'bus_stop', 'Bommanahalli, Hosur Road, Bengaluru', 12.9081, 77.6210, false, true, true, 'manual_seed', 3.6, 450, '{"routes": "BMTC 500C, 500CA, 600A"}'),
  ('manual_transport_009', 'Dairy Circle Flyover Bus Stop', 'transport', 'bus_stop', 'Dairy Circle, Bannerghatta Road, Bengaluru', 12.9370, 77.5920, false, true, true, 'manual_seed', 3.5, 220, '{"routes": "BMTC 360, 365, G-4"}'),
  ('manual_transport_010', 'BTM Layout Bus Stand', 'transport', 'bus_stop', 'BTM Layout 2nd Stage, Bengaluru', 12.9166, 77.6101, false, true, true, 'manual_seed', 3.7, 380, '{"routes": "BMTC 500D, 500K"}'),
  ('manual_transport_011', 'Ola/Uber Pickup — CHRIST Main Gate', 'transport', 'ride_hail', 'CHRIST Main Gate, Hosur Road, Bengaluru', 12.9347, 77.6069, true, true, true, 'manual_seed', 4.0, 150, '{"notes": "Dedicated pickup zone near main gate"}'),
  ('manual_transport_012', 'Rapido Bike Taxi Stand', 'transport', 'bike_taxi', 'Near SG Palya Signal, Bengaluru', 12.9330, 77.6080, false, true, true, 'manual_seed', 3.9, 95, '{"notes": "Quick rides under 5km"}'),
  ('manual_transport_013', 'Yulu Bike Station — CHRIST', 'transport', 'bike_rental', 'Opposite CHRIST Campus, Hosur Road', 12.9343, 77.6065, false, true, true, 'manual_seed', 4.0, 210, '{"notes": "Electric bikes, Rs 10/10min"}'),
  ('manual_transport_014', 'Koramangala Auto Stand', 'transport', 'auto', 'Koramangala 8th Block, Bengaluru', 12.9300, 77.6220, false, true, true, 'manual_seed', 3.4, 180, '{"notes": "Meter rate + Rs 10/km"}'),
  ('manual_transport_015', 'KSRTC Silk Board Bus Stop', 'transport', 'bus_stop', 'Silk Board, Hosur Road, Bengaluru', 12.9178, 77.6235, false, true, true, 'manual_seed', 3.8, 890, '{"routes": "KSRTC to Mysuru, Chennai, Hosur"}')
ON CONFLICT (google_place_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CAMPUS (currently 6 → add 12 more = 18 total)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO places (google_place_id, name, category, type, address, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count, extra)
VALUES
  ('manual_campus_007', 'CHRIST Auditorium', 'campus', 'auditorium', 'CHRIST University Main Campus, Block I', 12.9350, 77.6065, true, true, true, 'manual_seed', 4.7, 340, '{"capacity": 1200, "ac": true}'),
  ('manual_campus_008', 'Open-Air Theatre', 'campus', 'theatre', 'CHRIST University Main Campus, Near Block III', 12.9348, 77.6072, true, true, true, 'manual_seed', 4.5, 180, '{"capacity": 500, "type": "outdoor"}'),
  ('manual_campus_009', 'CHRIST Sports Ground', 'campus', 'sports', 'CHRIST University Main Campus, Ground Floor', 12.9340, 77.6060, true, true, true, 'manual_seed', 4.6, 420, '{"facilities": ["cricket", "football", "athletics"]}'),
  ('manual_campus_010', 'Swimming Pool', 'campus', 'sports', 'CHRIST University, Near Hostel Block', 12.9338, 77.6058, true, true, true, 'manual_seed', 4.4, 190, '{"hours": "6:00 AM - 8:00 PM", "type": "25m lap pool"}'),
  ('manual_campus_011', 'Computer Lab — Block II', 'campus', 'lab', 'CHRIST University, Block II, 3rd Floor', 12.9349, 77.6068, true, true, true, 'manual_seed', 4.3, 250, '{"seats": 60, "software": ["VS Code", "MATLAB", "R Studio"]}'),
  ('manual_campus_012', 'Science Lab — Block IV', 'campus', 'lab', 'CHRIST University, Block IV, 2nd Floor', 12.9351, 77.6071, true, true, true, 'manual_seed', 4.2, 140, '{"type": "physics, chemistry"}'),
  ('manual_campus_013', 'Students Activity Center (SAC)', 'campus', 'activity_center', 'CHRIST University, Near Main Gate', 12.9346, 77.6067, true, true, true, 'manual_seed', 4.5, 560, '{"clubs": 40, "events_per_year": 100}'),
  ('manual_campus_014', 'CHRIST Placement Cell', 'campus', 'career', 'CHRIST University, Block I, Ground Floor', 12.9350, 77.6063, true, true, true, 'manual_seed', 4.6, 380, '{"companies_visiting": 150, "avg_package": "6 LPA"}'),
  ('manual_campus_015', 'Chapel / Prayer Room', 'campus', 'worship', 'CHRIST University Main Campus, Block I', 12.9352, 77.6066, true, true, true, 'manual_seed', 4.8, 120, '{"denomination": "interdenominational", "hours": "7 AM - 9 PM"}'),
  ('manual_campus_016', 'ATM — SBI', 'campus', 'atm', 'CHRIST University, Near Main Canteen', 12.9345, 77.6060, true, true, true, 'manual_seed', 3.8, 95, '{"bank": "SBI", "type": "24/7 ATM"}'),
  ('manual_campus_017', 'ATM — HDFC', 'campus', 'atm', 'CHRIST University, Near Block III', 12.9347, 77.6073, true, true, true, 'manual_seed', 4.0, 110, '{"bank": "HDFC", "type": "24/7 ATM"}'),
  ('manual_campus_018', 'CHRIST Wi-Fi Zone — Central Lawn', 'campus', 'facility', 'CHRIST University, Central Lawn', 12.9346, 77.6069, true, true, true, 'manual_seed', 4.1, 650, '{"ssid": "CHRIST-WiFi", "speed": "50 Mbps"}')
ON CONFLICT (google_place_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ESSENTIALS (currently 6 → add 10 more = 16 total)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO places (google_place_id, name, category, type, address, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count, extra)
VALUES
  ('manual_essentials_007', 'Xerox & Print Shop — SG Palya', 'essentials', 'print_shop', 'SG Palya Main Road, Bengaluru', 12.9330, 77.6082, false, true, true, 'manual_seed', 4.2, 340, '{"services": ["xerox", "print", "spiral binding", "lamination"], "price": "Rs 1/page BW"}'),
  ('manual_essentials_008', 'Sri Balaji Stationery', 'essentials', 'stationery', 'Opposite CHRIST Gate 2, SG Palya', 12.9335, 77.6075, false, true, true, 'manual_seed', 4.3, 280, '{"products": ["notebooks", "pens", "art supplies", "lab records"]}'),
  ('manual_essentials_009', 'QuickWash Laundry', 'essentials', 'laundry', 'Dairy Circle, Bannerghatta Road', 12.9370, 77.5918, false, true, true, 'manual_seed', 4.1, 190, '{"services": ["wash & fold", "dry clean", "ironing"], "price": "Rs 50/kg"}'),
  ('manual_essentials_010', 'UClean Laundry', 'essentials', 'laundry', 'BTM Layout 2nd Stage, Bengaluru', 12.9165, 77.6102, false, true, true, 'manual_seed', 4.4, 310, '{"services": ["wash & fold", "dry clean"], "price": "Rs 59/kg", "hours": "8 AM - 9 PM"}'),
  ('manual_essentials_011', 'Campus Stationery — Inside CHRIST', 'essentials', 'stationery', 'CHRIST University, Near Main Canteen', 12.9345, 77.6062, true, true, true, 'manual_seed', 4.0, 520, '{"products": ["notebooks", "pens", "calculators", "lab coats"]}'),
  ('manual_essentials_012', 'D-Mart — Bannerghatta Road', 'essentials', 'grocery', 'Arekere, Bannerghatta Road, Bengaluru', 12.8985, 77.5985, false, true, true, 'manual_seed', 4.3, 4500, '{"type": "supermarket", "hours": "8 AM - 11 PM"}'),
  ('manual_essentials_013', 'More Supermarket — SG Palya', 'essentials', 'grocery', 'SG Palya, Hosur Road, Bengaluru', 12.9328, 77.6090, false, true, true, 'manual_seed', 4.0, 890, '{"type": "supermarket", "hours": "7 AM - 10 PM"}'),
  ('manual_essentials_014', 'Namma Salon — BTM', 'essentials', 'salon', 'BTM Layout 2nd Stage, Bengaluru', 12.9170, 77.6105, false, true, true, 'manual_seed', 4.2, 420, '{"type": "unisex", "haircut_price": "Rs 200"}'),
  ('manual_essentials_015', 'Campus Barber Shop', 'essentials', 'salon', 'Near CHRIST Hostel Block, Bengaluru', 12.9340, 77.6055, true, true, true, 'manual_seed', 3.9, 180, '{"type": "men only", "haircut_price": "Rs 100"}'),
  ('manual_essentials_016', 'Mobile Repair Hub', 'essentials', 'repair', 'SG Palya, Near Chinese Restaurant, Bengaluru', 12.9332, 77.6085, false, true, true, 'manual_seed', 4.1, 250, '{"services": ["screen repair", "battery", "software"], "brands": "all"}')
ON CONFLICT (google_place_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- HANGOUT (currently 6 → add 10 more = 16 total)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO places (google_place_id, name, category, type, address, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count, extra)
VALUES
  ('manual_hangout_007', 'Koramangala Social', 'hangout', 'pub', '118, Koramangala Industrial Layout, Bengaluru', 12.9344, 77.6264, false, true, true, 'manual_seed', 4.3, 5600, '{"type": "pub & restaurant", "hours": "12 PM - 1 AM", "avg_cost": 1200}'),
  ('manual_hangout_008', 'Smally''s Resto Cafe', 'hangout', 'cafe', '7th Block, Koramangala, Bengaluru', 12.9336, 77.6190, false, true, true, 'manual_seed', 4.2, 2300, '{"type": "cafe", "wifi": true, "pet_friendly": true}'),
  ('manual_hangout_009', 'Cubbon Park', 'hangout', 'park', 'Kasturba Road, Bengaluru', 12.9763, 77.5929, false, true, true, 'manual_seed', 4.6, 42000, '{"type": "public park", "hours": "6 AM - 6 PM", "area": "300 acres"}'),
  ('manual_hangout_010', 'Lalbagh Botanical Garden', 'hangout', 'park', 'Mavalli, Bengaluru', 12.9507, 77.5848, false, true, true, 'manual_seed', 4.5, 38000, '{"type": "botanical garden", "entry": "Rs 25", "hours": "6 AM - 7 PM"}'),
  ('manual_hangout_011', 'Forum Mall — Koramangala', 'hangout', 'mall', 'Hosur Road, Koramangala, Bengaluru', 12.9340, 77.6110, false, true, true, 'manual_seed', 4.3, 15000, '{"floors": 4, "stores": 120, "hours": "10 AM - 10 PM"}'),
  ('manual_hangout_012', 'Toit Brew Pub', 'hangout', 'pub', '298, Namma Metro Pillar 62, Indiranagar, Bengaluru', 12.9784, 77.6408, false, true, true, 'manual_seed', 4.4, 28000, '{"type": "brewpub", "speciality": "craft beer"}'),
  ('manual_hangout_013', 'Gaming Zone — Sector 7', 'hangout', 'gaming', 'HSR Layout, Bengaluru', 12.9120, 77.6350, false, true, true, 'manual_seed', 4.1, 560, '{"type": "gaming cafe", "games": ["PS5", "PC gaming", "VR"], "price": "Rs 100/hr"}'),
  ('manual_hangout_014', 'National Gallery of Modern Art', 'hangout', 'museum', 'Palace Road, Bengaluru', 12.9870, 77.5888, false, true, true, 'manual_seed', 4.4, 3200, '{"type": "art museum", "entry": "Rs 20 students", "hours": "10 AM - 5 PM"}'),
  ('manual_hangout_015', 'BDA Complex Park', 'hangout', 'park', 'Near Dairy Circle, Bannerghatta Road', 12.9365, 77.5925, false, true, true, 'manual_seed', 4.0, 450, '{"type": "neighborhood park", "hours": "5 AM - 9 PM"}'),
  ('manual_hangout_016', 'Windmills Craftworks', 'hangout', 'pub', 'Whitefield, Bengaluru', 12.9698, 77.7499, false, true, true, 'manual_seed', 4.3, 8900, '{"type": "microbrewery", "live_music": true}')
ON CONFLICT (google_place_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SAFETY (currently 5 → add 8 more = 13 total)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO places (google_place_id, name, category, type, address, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count, extra)
VALUES
  ('manual_safety_006', 'CHRIST Counseling Center', 'safety', 'counseling', 'CHRIST University, Block I, 1st Floor', 12.9350, 77.6064, true, true, true, 'manual_seed', 4.7, 180, '{"type": "mental health", "hours": "9 AM - 5 PM", "free": true}'),
  ('manual_safety_007', 'SG Palya Police Station', 'safety', 'police', 'SG Palya Main Road, Bengaluru', 12.9325, 77.6090, false, true, true, 'manual_seed', 3.5, 120, '{"type": "local police station", "phone": "080-2553-1212", "hours": "24/7"}'),
  ('manual_safety_008', 'Koramangala Police Station', 'safety', 'police', 'Koramangala 4th Block, Bengaluru', 12.9350, 77.6200, false, true, true, 'manual_seed', 3.6, 280, '{"type": "local police station", "phone": "080-2553-0360", "hours": "24/7"}'),
  ('manual_safety_009', 'Fortis Hospital — Bannerghatta', 'safety', 'hospital', '154/9, Bannerghatta Road, Bengaluru', 12.8940, 77.5960, false, true, true, 'manual_seed', 4.2, 6800, '{"type": "multi-specialty hospital", "emergency": true, "phone": "080-6621-4444"}'),
  ('manual_safety_010', 'Narayana Health — Bommasandra', 'safety', 'hospital', 'Hosur Road, Bommasandra, Bengaluru', 12.8350, 77.6560, false, true, true, 'manual_seed', 4.4, 12000, '{"type": "super-specialty hospital", "emergency": true}'),
  ('manual_safety_011', 'Women''s Helpline Booth', 'safety', 'helpline', 'CHRIST University Main Gate, Bengaluru', 12.9347, 77.6069, true, true, true, 'manual_seed', 4.8, 45, '{"phone": "181", "hours": "24/7", "type": "women safety"}'),
  ('manual_safety_012', 'Fire Station — Madiwala', 'safety', 'fire_station', 'Madiwala, Hosur Road, Bengaluru', 12.9210, 77.6160, false, true, true, 'manual_seed', 4.0, 65, '{"phone": "101", "hours": "24/7"}'),
  ('manual_safety_013', 'Apollo Pharmacy — 24/7', 'safety', 'pharmacy', 'Opposite Forum Mall, Hosur Road, Bengaluru', 12.9338, 77.6112, false, true, true, 'manual_seed', 4.1, 890, '{"hours": "24/7", "type": "pharmacy", "delivery": true}')
ON CONFLICT (google_place_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- EVENTS (currently 5 → add 8 more = 13 total)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO places (google_place_id, name, category, type, address, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count, extra)
VALUES
  ('manual_events_006', 'Blossoms — Annual Cultural Fest', 'events', 'cultural_fest', 'CHRIST University Main Campus', 12.9348, 77.6068, true, true, true, 'manual_seed', 4.9, 2500, '{"month": "January", "duration": "3 days", "footfall": 15000}'),
  ('manual_events_007', 'Chancellor''s Trophy — Sports', 'events', 'sports_event', 'CHRIST University Sports Ground', 12.9340, 77.6060, true, true, true, 'manual_seed', 4.7, 1200, '{"month": "September-October", "sports": ["cricket", "football", "basketball", "athletics"]}'),
  ('manual_events_008', 'Model United Nations (MUN)', 'events', 'academic', 'CHRIST University, Block I', 12.9350, 77.6065, true, true, true, 'manual_seed', 4.6, 450, '{"month": "August", "committees": 8, "delegates": 500}'),
  ('manual_events_009', 'TEDxCHRIST University', 'events', 'talk', 'CHRIST University Auditorium', 12.9350, 77.6065, true, true, true, 'manual_seed', 4.8, 890, '{"frequency": "annual", "speakers": 12}'),
  ('manual_events_010', 'Placement Drive Season', 'events', 'placement', 'CHRIST University, Placement Cell', 12.9350, 77.6063, true, true, true, 'manual_seed', 4.5, 2100, '{"months": "October-March", "companies": 150}'),
  ('manual_events_011', 'Navaratri Celebrations', 'events', 'cultural', 'CHRIST University Central Lawn', 12.9346, 77.6069, true, true, true, 'manual_seed', 4.6, 380, '{"month": "October", "duration": "9 days"}'),
  ('manual_events_012', 'Christmas Carnival', 'events', 'cultural', 'CHRIST University Main Campus', 12.9348, 77.6068, true, true, true, 'manual_seed', 4.8, 1800, '{"month": "December", "highlights": ["carol singing", "star making", "food stalls"]}'),
  ('manual_events_013', 'Hackathon — CodeStorm', 'events', 'hackathon', 'CHRIST University, Computer Lab', 12.9349, 77.6068, true, true, true, 'manual_seed', 4.5, 340, '{"frequency": "biannual", "prize": "Rs 50,000", "team_size": 4}')
ON CONFLICT (google_place_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MARKETPLACE (currently 4 → add 10 more = 14 total)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO places (google_place_id, name, category, type, address, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count, extra)
VALUES
  ('manual_marketplace_005', 'CHRIST Book Exchange Board', 'marketplace', 'book_exchange', 'CHRIST University, Students Activity Center', 12.9346, 77.6067, true, true, true, 'manual_seed', 4.3, 340, '{"type": "notice board", "categories": ["textbooks", "novels", "study guides"]}'),
  ('manual_marketplace_006', 'OLX/Quikr — Local Deals', 'marketplace', 'online', 'Online — Bangalore Local', 12.9345, 77.6069, false, true, true, 'manual_seed', 3.8, 5000, '{"type": "online marketplace", "popular": ["laptops", "furniture", "bikes"]}'),
  ('manual_marketplace_007', 'Student Mart — WhatsApp Group', 'marketplace', 'peer_to_peer', 'CHRIST University Community', 12.9345, 77.6069, true, true, true, 'manual_seed', 4.2, 890, '{"type": "student WhatsApp group", "members": 2000, "categories": ["books", "electronics", "food"]}'),
  ('manual_marketplace_008', 'Flipkart Hub — Koramangala', 'marketplace', 'pickup_point', 'Koramangala 5th Block, Bengaluru', 12.9347, 77.6170, false, true, true, 'manual_seed', 4.0, 1200, '{"type": "pickup/return center", "hours": "10 AM - 8 PM"}'),
  ('manual_marketplace_009', 'Amazon Hub Locker — BTM', 'marketplace', 'pickup_point', 'BTM Layout, Bengaluru', 12.9168, 77.6100, false, true, true, 'manual_seed', 4.1, 450, '{"type": "parcel locker", "hours": "24/7"}'),
  ('manual_marketplace_010', 'Sapna Book House', 'marketplace', 'bookstore', 'Residency Road, Bengaluru', 12.9714, 77.6050, false, true, true, 'manual_seed', 4.5, 8500, '{"type": "bookstore", "discount": "10% student", "hours": "10 AM - 9 PM"}'),
  ('manual_marketplace_011', 'Higginbothams Bookstore', 'marketplace', 'bookstore', 'MG Road, Bengaluru', 12.9756, 77.6060, false, true, true, 'manual_seed', 4.3, 3200, '{"type": "bookstore", "since": 1844}'),
  ('manual_marketplace_012', 'Second-Hand Laptop Market', 'marketplace', 'electronics', 'SP Road, Bengaluru', 12.9810, 77.5820, false, true, true, 'manual_seed', 3.7, 1500, '{"type": "used electronics", "popular": ["laptops", "monitors", "peripherals"]}'),
  ('manual_marketplace_013', 'Decathlon — Bannerghatta Road', 'marketplace', 'sports_store', 'Arekere, Bannerghatta Road, Bengaluru', 12.8990, 77.5985, false, true, true, 'manual_seed', 4.4, 6700, '{"type": "sports equipment", "hours": "10 AM - 9 PM"}'),
  ('manual_marketplace_014', 'Reliance Digital — Forum Mall', 'marketplace', 'electronics', 'Forum Mall, Hosur Road, Bengaluru', 12.9340, 77.6112, false, true, true, 'manual_seed', 4.1, 2300, '{"type": "electronics store", "student_discount": true}')
ON CONFLICT (google_place_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FOOD — Add popular student spots near CHRIST (currently 35 → add 10 = 45)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO places (google_place_id, name, category, type, address, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count, price_level, extra)
VALUES
  ('manual_food_001', 'SG Palya Darshini', 'food', 'budget_mess', 'SG Palya Main Road, Bengaluru', 12.9332, 77.6085, false, true, true, 'manual_seed', 4.1, 890, 0, '{"type": "South Indian breakfast/meals", "avg_cost": 60, "veg_only": true}'),
  ('manual_food_002', 'Night Parotta Stall', 'food', 'street_food', 'SG Palya, Near Signal, Bengaluru', 12.9328, 77.6078, false, true, true, 'manual_seed', 4.0, 650, 0, '{"type": "late-night street food", "hours": "8 PM - 2 AM", "speciality": "egg parotta, kothu parotta"}'),
  ('manual_food_003', 'MTR — Lalbagh', 'food', 'restaurant', 'Lalbagh Road, Bengaluru', 12.9520, 77.5850, false, true, true, 'manual_seed', 4.6, 24000, 1, '{"type": "South Indian", "since": 1924, "must_try": "rava idli"}'),
  ('manual_food_004', 'Veena Stores', 'food', 'restaurant', 'Jayanagar 4th Block, Bengaluru', 12.9260, 77.5830, false, true, true, 'manual_seed', 4.5, 18000, 0, '{"type": "South Indian breakfast", "must_try": "khara bath + kesari bath combo"}'),
  ('manual_food_005', 'Albert Bakery', 'food', 'bakery', 'SG Palya, Hosur Road, Bengaluru', 12.9334, 77.6080, false, true, true, 'manual_seed', 4.2, 560, 1, '{"type": "bakery", "popular": ["puffs", "cakes", "bread"]}'),
  ('manual_food_006', 'Campus Main Canteen', 'food', 'canteen', 'CHRIST University, Ground Floor', 12.9345, 77.6062, true, true, true, 'manual_seed', 3.8, 2500, 0, '{"type": "campus canteen", "hours": "7:30 AM - 6:30 PM", "veg_options": true}'),
  ('manual_food_007', 'Block Cafeteria — Block III', 'food', 'canteen', 'CHRIST University, Block III', 12.9348, 77.6072, true, true, true, 'manual_seed', 3.7, 1200, 0, '{"type": "block cafeteria", "hours": "8 AM - 5 PM"}'),
  ('manual_food_008', 'Juice Corner — CHRIST Gate', 'food', 'juice_center', 'Near CHRIST Main Gate, Hosur Road', 12.9347, 77.6068, true, true, true, 'manual_seed', 4.0, 980, 0, '{"type": "juice & shake center", "popular": ["mosambi", "sugarcane", "tender coconut"]}'),
  ('manual_food_009', 'Chai Point — SG Palya', 'food', 'cafe', 'SG Palya, Hosur Road, Bengaluru', 12.9330, 77.6082, false, true, true, 'manual_seed', 4.1, 1400, 0, '{"type": "tea cafe", "popular": ["masala chai", "ginger chai"]}'),
  ('manual_food_010', 'Domino''s Pizza — Koramangala', 'food', 'restaurant', 'Koramangala 5th Block, Bengaluru', 12.9338, 77.6165, false, true, true, 'manual_seed', 4.0, 8500, 1, '{"type": "pizza chain", "delivery": true, "hours": "11 AM - 11 PM"}')
ON CONFLICT (google_place_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ACCOMMODATION — Add more options (currently 23 → add 5 = 28)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO places (google_place_id, name, category, type, address, lat, lng, is_on_campus, is_static, is_manual_override, data_source, rating, rating_count, price_level, extra)
VALUES
  ('manual_accom_001', 'CHRIST Hostel — Men''s Block A', 'accommodation', 'hostel', 'CHRIST University Campus, Bengaluru', 12.9342, 77.6055, true, true, true, 'manual_seed', 4.0, 340, 1, '{"type": "university hostel", "gender": "male", "food_included": true, "rent_approx": "Rs 80,000/year"}'),
  ('manual_accom_002', 'CHRIST Hostel — Women''s Block', 'accommodation', 'hostel', 'CHRIST University Campus, Bengaluru', 12.9344, 77.6058, true, true, true, 'manual_seed', 4.2, 280, 1, '{"type": "university hostel", "gender": "female", "food_included": true, "rent_approx": "Rs 85,000/year"}'),
  ('manual_accom_003', 'Zolo Stays — BTM Layout', 'accommodation', 'co_living', 'BTM Layout 2nd Stage, Bengaluru', 12.9168, 77.6100, false, true, true, 'manual_seed', 4.1, 1200, 2, '{"type": "co-living", "rent_range": "Rs 8,000-15,000/month", "food_included": true}'),
  ('manual_accom_004', 'Stanza Living — Koramangala', 'accommodation', 'co_living', 'Koramangala 4th Block, Bengaluru', 12.9350, 77.6200, false, true, true, 'manual_seed', 4.3, 890, 2, '{"type": "co-living", "rent_range": "Rs 10,000-18,000/month", "amenities": ["wifi", "gym", "meals"]}'),
  ('manual_accom_005', 'NestAway Apartments — HSR', 'accommodation', 'flat', 'HSR Layout Sector 2, Bengaluru', 12.9120, 77.6380, false, true, true, 'manual_seed', 4.0, 560, 2, '{"type": "furnished apartment", "rent_range": "Rs 12,000-20,000/month", "sharing": "2BHK sharing"}')
ON CONFLICT (google_place_id) DO NOTHING;

-- ============================================================================
-- DONE — Run in Supabase SQL Editor after migration 008
-- Expected: ~80 new rows added (total ~260 rows)
-- ============================================================================
