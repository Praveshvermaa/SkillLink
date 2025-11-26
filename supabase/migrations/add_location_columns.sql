-- Add latitude and longitude columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude float8,
ADD COLUMN IF NOT EXISTS longitude float8;

-- Add latitude and longitude columns to skills table
ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS latitude float8,
ADD COLUMN IF NOT EXISTS longitude float8;

-- Create an index for faster location-based queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_skills_location ON skills (latitude, longitude);
