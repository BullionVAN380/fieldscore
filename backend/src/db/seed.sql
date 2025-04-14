-- Insert sample counties
INSERT INTO counties (name) VALUES
  ('Nairobi'),
  ('Mombasa'),
  ('Kisumu'),
  ('Nakuru'),
  ('Eldoret');

-- Insert sample wards for each county
INSERT INTO wards (name, county_id) VALUES
  ('Westlands', 1),
  ('Kibra', 1),
  ('Dagoretti', 1),
  ('Nyali', 2),
  ('Kisauni', 2),
  ('Likoni', 2),
  ('Kondele', 3),
  ('Nyalenda', 3),
  ('Manyatta', 3),
  ('Nakuru Town East', 4),
  ('Nakuru Town West', 4),
  ('Kaptembwo', 4),
  ('Pioneer', 5),
  ('Kapsoya', 5),
  ('Langas', 5);

-- Insert sample UAI data
INSERT INTO unit_area_insurance (county_id, crop_type, premium_per_acre) VALUES
  (1, 'Maize', 2000),
  (1, 'Beans', 1800),
  (1, 'Sorghum', 1500),
  (2, 'Maize', 1800),
  (2, 'Beans', 1600),
  (2, 'Green grams', 1400),
  (3, 'Maize', 1900),
  (3, 'Sorghum', 1600),
  (3, 'Millet', 1500),
  (4, 'Maize', 2100),
  (4, 'Beans', 1900),
  (4, 'Cowpeas', 1700),
  (5, 'Maize', 2000),
  (5, 'Beans', 1800),
  (5, 'Millet', 1600);
