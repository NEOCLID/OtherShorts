# Fix Railway → RDS Connection Error

## Problem: 500 Internal Server Error

Your Railway backend can't connect to AWS RDS because the RDS security group blocks Railway's IP addresses.

---

## Quick Fix: Allow All IPs (Testing Only)

### Step 1: Go to RDS Security Group

1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. Click **Databases** → `othershorts-db`
3. Under **Connectivity & security**, click on the **VPC security groups** link (looks like `sg-xxxxx`)

### Step 2: Edit Inbound Rules

1. Click **Edit inbound rules**
2. Find the existing PostgreSQL rule (if any)
3. Click **Add rule**
4. Configure:
   ```
   Type: PostgreSQL
   Protocol: TCP
   Port: 5432
   Source: Custom → 0.0.0.0/0
   Description: Allow Railway (temporary - all IPs)
   ```
5. Click **Save rules**

### Step 3: Redeploy Railway

1. Go to Railway dashboard
2. Click your service
3. Click **Deployments** tab
4. Click **⋮** (three dots) → **Redeploy**

### Step 4: Test Again

```
https://othershorts-production.up.railway.app/api/countries
```

Should now return:
```json
[{"id":1,"name":"Korea"},{"id":2,"name":"Others"}]
```

---

## Better Solution: Restrict to Railway IPs (More Secure)

Railway doesn't provide static IPs for their free tier, but you can:

### Option A: Use Railway's Public Outbound IPs

Railway's traffic comes from these IP ranges (as of 2024):
```
34.71.0.0/16
34.72.0.0/16
34.73.0.0/16
```

Update your RDS security group to allow only these ranges:

1. Go to RDS Security Group
2. Edit inbound rules
3. Replace `0.0.0.0/0` with:
   ```
   Type: PostgreSQL
   Port: 5432
   Source: 34.71.0.0/16
   Description: Railway IP range 1
   ```
4. Click **Add rule** and add the other ranges

### Option B: Use Railway Private Networking (Requires Railway Pro)

If you upgrade to Railway Pro ($20/month), you get:
- Private static IPs
- Better security
- Dedicated resources

---

## Other Possible Errors

### Error: "Cannot find module"

**Logs show:**
```
Error: Cannot find module 'express'
```

**Fix:** Railway didn't install dependencies

1. Check `package.json` exists in root
2. Redeploy Railway (it will run `npm install`)

### Error: "Port already in use"

**Logs show:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:** Use Railway's PORT environment variable

Update `server/server.js`:
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
```

### Error: ".env file not found"

**Logs show:**
```
Error: ENOENT: no such file or directory, open '.env'
```

**Fix:** Railway uses environment variables, not .env files

- You already added variables in Railway dashboard (Step 3)
- Make sure `dotenv` only loads if file exists
- Update `server/server.js`:
  ```javascript
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  // Change to:
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
  }
  ```

---

## Verify Database Connection

Once Railway is running, check if it can connect to RDS:

### Add a health check endpoint:

Add to `server/server.js`:
```javascript
app.get('/health', async (req, res) => {
  try {
    const result = await client.query('SELECT NOW()');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});
```

Then test:
```
https://othershorts-production.up.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-08T09:30:00.000Z"
}
```

---

## Screenshot Guide for RDS Security Group

### Finding Security Group:
```
AWS Console
  → RDS
    → Databases
      → othershorts-db
        → Connectivity & security tab
          → VPC security groups (click the sg-xxxx link)
            → Inbound rules tab
              → Edit inbound rules button
```

### What to Add:
```
┌─────────────────────────────────────────────────┐
│ Type        │ PostgreSQL                        │
│ Protocol    │ TCP                               │
│ Port range  │ 5432                              │
│ Source      │ 0.0.0.0/0                         │
│ Description │ Allow Railway                     │
└─────────────────────────────────────────────────┘
```

---

## Still Not Working?

### Check Railway Logs for Exact Error:

1. Railway dashboard → Your service
2. **Deployments** tab → Latest deployment
3. **Deploy Logs** - scroll to bottom
4. Look for:
   - `Error:` lines (red)
   - Stack traces
   - Connection errors

**Copy the error message and share it with me!**

### Common Error Messages:

| Error | Cause | Fix |
|-------|-------|-----|
| `ETIMEDOUT` | RDS security group blocks Railway | Add 0.0.0.0/0 to security group |
| `no pg_hba.conf entry` | RDS doesn't allow Railway's IP | Add 0.0.0.0/0 to security group |
| `password authentication failed` | Wrong DB credentials | Check environment variables in Railway |
| `database "othershorts" does not exist` | Database name wrong | Verify DB_NAME=othershorts |
| `getaddrinfo ENOTFOUND` | Wrong DB_HOST | Check RDS endpoint in environment variables |

---

## Quick Checklist

- [ ] RDS security group allows port 5432 from 0.0.0.0/0
- [ ] Railway has all environment variables set
- [ ] DB_HOST matches RDS endpoint exactly
- [ ] DB_PASSWORD is correct
- [ ] DB_NAME is "othershorts" (not "othershorts_db")
- [ ] Railway deployment shows "Active" status
- [ ] Railway logs don't show errors

---

## Need More Help?

**Share with me:**
1. Railway deployment logs (last 20 lines)
2. Any error messages you see
3. Screenshot of your Railway environment variables

I'll help you debug! 🔧
