-- Create counties table
CREATE TABLE IF NOT EXISTS counties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Create wards table
CREATE TABLE IF NOT EXISTS wards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  county_id INTEGER REFERENCES counties(id)
);

-- Create unit_area_insurance table
CREATE TABLE IF NOT EXISTS unit_area_insurance (
  id SERIAL PRIMARY KEY,
  county_id INTEGER REFERENCES counties(id),
  crop_type VARCHAR(50) NOT NULL,
  premium_per_acre DECIMAL(10, 2) NOT NULL
);

-- Create farmers table
CREATE TABLE IF NOT EXISTS farmers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  national_id VARCHAR(20) NOT NULL UNIQUE,
  mobile_number VARCHAR(15) NOT NULL,
  county VARCHAR(100) NOT NULL,
  ward VARCHAR(100) NOT NULL,
  crop_type VARCHAR(50) NOT NULL,
  acres DECIMAL(10, 2) NOT NULL,
  premium DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER REFERENCES farmers(id),
  amount DECIMAL(10, 2) NOT NULL,
  mpesa_receipt_number VARCHAR(50),
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
