// This file is likely obsolete and no longer used.
/* -------------------------------------------------------
   STEP 0  Countries table (unchanged)
------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS countries (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(80) UNIQUE,
  iso2 CHAR(2)
);

INSERT INTO countries (name, iso2) VALUES
 ('Korea, Republic of','KR'), ('United States of America','US')
ON CONFLICT DO NOTHING;

/* -------------------------------------------------------
   STEP 1  Users – detach old PK and add new numeric PK
------------------------------------------------------- */
-- 1‑a  drop PK constraint on old id (if exists)
DO $$
DECLARE pk_name text;
BEGIN
  SELECT constraint_name INTO pk_name
  FROM information_schema.table_constraints
  WHERE table_name='users' AND constraint_type='PRIMARY KEY';
  IF pk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', pk_name);
  END IF;
END $$;

-- 1‑b  rename old id → google_raw_id  (if not done yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name='users' AND column_name='id'
       AND data_type IN ('character varying','text')
  )
  THEN
    ALTER TABLE users RENAME COLUMN id TO google_raw_id;
  END IF;
END $$;

-- 1‑c  add new serial id PK
ALTER TABLE users ADD COLUMN IF NOT EXISTS id SERIAL;
ALTER TABLE users ADD PRIMARY KEY (id);

-- 1‑d  crypto hash column & country FK
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_hash VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS country_id  INT REFERENCES countries(id);

/* -------------------------------------------------------
   STEP 2  Child tables now point to users.id (INT)
------------------------------------------------------- */
-- helper: cast & create FK safely
ALTER TABLE comments
  ALTER COLUMN user_id TYPE INT USING user_id::INT,
  ADD   CONSTRAINT comments_user_fk FOREIGN KEY(user_id) REFERENCES users(id);

ALTER TABLE user_video_interactions
  ALTER COLUMN user_id TYPE INT USING user_id::INT,
  ADD   CONSTRAINT uvi_user_fk      FOREIGN KEY(user_id) REFERENCES users(id);

ALTER TABLE IF EXISTS user_video_ratings
  ALTER COLUMN user_id TYPE INT USING user_id::INT,
  ADD   CONSTRAINT uvr_user_fk      FOREIGN KEY(user_id) REFERENCES users(id);