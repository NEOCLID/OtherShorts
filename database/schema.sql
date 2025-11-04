CREATE TABLE IF NOT EXISTS countries (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(80) UNIQUE,
  iso2 CHAR(2)
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  google_hash VARCHAR(64) UNIQUE,
  google_raw_id TEXT,
  name TEXT,
  email TEXT,
  age INT,
  gender TEXT,
  country_id INT REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  url TEXT UNIQUE,
  user_id TEXT
);

CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  target_user_id TEXT,
  reviewer_id TEXT,
  rating INT,
  political INT
);

-- Note: The user_id, target_user_id, and reviewer_id columns in the videos and ratings tables are currently TEXT fields.
-- For better data integrity, these should ideally be foreign keys referencing the users table.
-- However, to avoid breaking existing queries, they are kept as TEXT for now.

INSERT INTO countries (name, iso2) VALUES
 ('Korea','KR'), ('Others','XX')
ON CONFLICT DO NOTHING;
