const express  = require('express');
const bodyParser = require('body-parser');
const cors     = require('cors');
const { Client } = require('pg');
const multer   = require('multer');
const crypto   = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ──────────────────────────────────────────────── */
/*  PostgreSQL                                      */
/* ──────────────────────────────────────────────── */
const client = new Client({
  user     : process.env.DB_USER,
  host     : process.env.DB_HOST,
  database : process.env.DB_NAME,
  password : process.env.DB_PASSWORD,
  port     : process.env.DB_PORT || 5432,
});
client.connect().then(()=>console.log('PG connected')).catch(console.error);

const hashGoogleId = id =>
  crypto.createHash('sha256').update(id,'utf8').digest('hex');

app.get('/api/countries', async (_req,res)=>{
  const { rows } = await client.query('SELECT id,name FROM countries ORDER BY name');
  res.json(rows);
});

app.post('/api/users', async (req, res) => {
    const { googleId } = req.body;
    if (!googleId) {
        return res.status(400).json({ error: 'Google ID is missing' });
    }
    const googleHash = hashGoogleId(googleId);
    try {
        await client.query(
            `INSERT INTO users (google_raw_id, google_hash) VALUES ($1, $2) ON CONFLICT (google_hash) DO NOTHING`,
            [googleId, googleHash]
        );
        const { rows } = await client.query(
            'SELECT google_hash AS id, age, gender, country_id FROM users WHERE google_hash=$1',
            [googleHash]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User could not be created or found.' });
        }
        res.json(rows[0]);
    } catch (e) {
        console.error('[PG-ERROR] /api/users:', e);
        res.status(500).json({ error: 'Database operation failed.' });
    }
});

app.get('/api/users/:id', async (req,res)=>{
  try{
    const { rows } = await client.query(
      'SELECT google_hash AS id, name, email, age, gender, country_id FROM users WHERE google_hash=$1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error:'not found' });
    res.json(rows[0]);
  }catch(e){
    console.error(e);
    res.status(500).json({ error:'db' });
  }
});

app.put('/api/users/:id', async (req,res)=>{
  const { age, gender, countryId } = req.body;
  const { id } = req.params;
  if (age == null || gender == null || countryId == null) {
    return res.status(400).json({ error: 'Missing age, gender, or countryId' });
  }
  const { rows } = await client.query(
    `UPDATE users SET age=$2, gender=$3, country_id=$4
     WHERE google_hash=$1
     RETURNING google_hash AS id, age, gender, country_id`,
    [id, age, gender, countryId]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

/* ──────────────────────────────────────────────── */
/*  Take‑out upload – stores only shorts (<60 s)    */
/* ──────────────────────────────────────────────── */
const upload = multer({ storage: multer.memoryStorage() });
const YT_KEY = process.env.YOUTUBE_API_KEY;

app.post('/api/uploadTakeout', upload.single('file'), async (req,res)=>{
  const { userId } = req.body;

  if(!userId || !req.file) {
    return res.status(400).json({ error: 'User ID or file is missing.' });
  }
  if (!YT_KEY) {
    console.error("FATAL: YOUTUBE_API_KEY is not defined in .env file.");
    return res.status(500).json({ error: 'Server configuration error: Missing API Key.' });
  }

  let json;
  try {
    json = JSON.parse(req.file.buffer.toString('utf8'));
    if (!Array.isArray(json)) {
        throw new Error("Invalid format: The uploaded file should contain a JSON array.");
    }
  } catch (e) {
    console.error("JSON Parse Error:", e.message);
    return res.status(400).json({ error: 'Invalid file format. Please upload the original watch-history.json.' });
  }

  try {
    const ids = [...new Set(
      json.map(e => e.titleUrl || '')
          .map(u => u.match(/(?:v=|\/shorts\/)([A-Za-z0-9_-]{11})/)?.[1])
          .filter(Boolean)
    )];

    if (ids.length === 0) {
        return res.status(400).json({ error: 'No YouTube videos found in the provided history.' });
    }

    const keep = [];
    while (ids.length){
      const batch = ids.splice(0,50);
      const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(',')}&key=${YT_KEY}`;
      const ytResponse = await fetch(url);
      const ytData = await ytResponse.json();

      if (ytData.error) {
        console.error("YouTube API Error:", ytData.error.message);
        continue;
      }

      if (ytData.items && ytData.items.length > 0) {
        ytData.items.forEach(v=>{
            if (!v.contentDetails?.duration) return;
            const match = v.contentDetails.duration.match(/PT(?:(\d+)M)?(\d+)S/);
            if (!match) return;
            const minutes = parseInt(match[1] || '0', 10);
            const seconds = parseInt(match[2] || '0', 10);
            const totalSeconds = (minutes * 60) + seconds;
            if (totalSeconds < 61) {
                keep.push(v.id);
            }
        });
      }
    }

    if (keep.length === 0) {
      return res.status(400).json({ error: 'No videos under 61 seconds (Shorts) were found in your history.' });
    }

    const sql = `INSERT INTO videos (url, user_id)
                 VALUES ($1, $2)
                 ON CONFLICT (url) DO NOTHING`;
    for(const vid of keep) {
      await client.query(sql, [`https://www.youtube.com/shorts/${vid}`, userId]);
    }

    res.status(200).json({ message: `${keep.length} new shorts added successfully.` });

  } catch(e) {
    console.error("Takeout Processing Error:", e);
    res.status(500).json({ error: 'An internal server error occurred while processing your file.' });
  }
});

/* ──────────────────────────────────────────────── */
/*  Ratings (reviews)                              */
/* ──────────────────────────────────────────────── */
app.post('/api/ratings', async (req,res)=>{
  console.log('--- Received /api/ratings request with body: ---', req.body); 
  const { userId, reviewerId, rating, political } = req.body;
  if (userId == null || reviewerId == null || rating == null || political == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await client.query(
      'INSERT INTO ratings (target_user_id, reviewer_id, rating, political) VALUES ($1, $2, $3, $4)',
      [userId, reviewerId, rating, political]
    );
    res.sendStatus(204);
  } catch (e) {
    console.error('[PG-ERROR] /api/ratings:', e);
    res.status(500).json({ error: 'Database operation failed.' });
  }
});

/* ──────────────────────────────────────────────── */
/*  Batch feed – only OTHER users’ shorts           */
/* ──────────────────────────────────────────────── */
app.get('/api/batch/:userId', async (req,res)=>{
  const { userId } = req.params;
  const seenUsers = req.query.seen ? req.query.seen.split(',') : [];
  const submittedVideos = req.query.submitted ? req.query.submitted.split(',') : [];

  try{
    const { rows } = await client.query(
      `WITH available_user AS (
         SELECT user_id
         FROM videos
         WHERE user_id <> $1 AND user_id NOT IN (SELECT unnest($2::text[]))
         AND url NOT IN (SELECT unnest($3::text[]))
         AND (SELECT country_id FROM users WHERE google_hash = videos.user_id) IS NOT NULL -- Ensure user has a country
         GROUP BY user_id
         HAVING COUNT(*) > 0
         ORDER BY random()
         LIMIT 1
       )
       SELECT
         v.url,
         u.age,
         u.gender,
         c.name AS country,
         
         u.google_hash AS "uploaderId"
       FROM videos v
       JOIN users u ON v.user_id = u.google_hash
       -- Use a LEFT JOIN to prevent users with null country from breaking the query
       LEFT JOIN countries c ON u.country_id = c.id
       WHERE v.user_id = (SELECT user_id FROM available_user)
       ORDER BY v.id DESC
       LIMIT 5`,
      [userId, seenUsers, submittedVideos]
    );
    res.json({ videos: rows });
  }catch(e){
    console.error("Batch feed error:", e);
    res.status(500).json({ error:'batch fetch failed' });
  }
});


/* ──────────────────────────────────────────────── */
const PORT = process.env.PORT || 3000;
app.listen(PORT,'0.0.0.0',()=>console.log(`http://localhost:${PORT}`));