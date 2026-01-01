# AWS RDS Setup Guide for OtherShorts

## RDS Instance Details

You have configured an AWS RDS PostgreSQL instance with the following settings:

- **Database Instance ID**: `othershorts-db`
- **Database Name**: `othershorts`
- **Engine**: PostgreSQL 15.14
- **Instance Class**: db.t3.micro (free tier eligible)
- **Master Username**: `postgres`
- **Storage**: 20 GB
- **Publicly Accessible**: Yes
- **Region**: us-east-1

---

## Step 1: Get Your RDS Endpoint

1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. Click on **Databases** in the left sidebar
3. Click on your database: `othershorts-db`
4. Under **Connectivity & security**, copy the **Endpoint**
   - Format: `othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com`

---

## Step 2: Update Your .env File

Update your local `.env` file (NOT committed to git):

```bash
# Database Configuration - AWS RDS
DB_USER=postgres
DB_HOST=othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
DB_NAME=othershorts
DB_PASSWORD=YOUR_RDS_PASSWORD
DB_PORT=5432
```

**Replace `othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com` with your actual RDS endpoint.**

---

## Step 3: Configure Security Group

Your RDS instance needs to allow inbound connections.

### Option A: Allow Your IP Address (Recommended for Development)

1. In RDS Console, click on your database `othershorts-db`
2. Click on the **VPC security groups** link (under **Security**)
3. Click on the security group ID
4. Click **Edit inbound rules**
5. Add a rule:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: My IP (or Custom with your IP address)
6. Click **Save rules**

### Option B: Allow All IPs (NOT RECOMMENDED for Production)

If you need to connect from multiple locations (like your local machine and production server):

1. Add an inbound rule:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: Custom `0.0.0.0/0` (allows all IPs)

**WARNING**: This is insecure. Use strong passwords and consider using AWS VPC for production.

---

## Step 4: Initialize Database Schema

From your local machine, connect to RDS and apply the schema:

### Using psql (Command Line)

```bash
# Install psql if not already installed
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql

# Connect to RDS
psql -h othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d othershorts \
     -f database/schema.sql

# You'll be prompted for the RDS password.
```

### Alternative: Using pgAdmin (GUI)

1. Download [pgAdmin](https://www.pgadmin.org/download/)
2. Create a new server connection:
   - **Host**: `othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com`
   - **Port**: 5432
   - **Database**: `othershorts`
   - **Username**: `postgres`
  - **Password**: `YOUR_RDS_PASSWORD`
3. Right-click on `othershorts` database > Query Tool
4. Copy contents of `database/schema.sql` and execute

---

## Step 5: Verify Database Setup

Test the connection and verify tables were created:

```bash
psql -h othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d othershorts \
     -c "\dt"

# Should show:
#  Schema |   Name    | Type  |  Owner
# --------+-----------+-------+----------
#  public | countries | table | postgres
#  public | ratings   | table | postgres
#  public | users     | table | postgres
#  public | videos    | table | postgres
```

Check if countries are populated:

```bash
psql -h othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d othershorts \
     -c "SELECT * FROM countries;"

# Should return:
#  id |  name  | iso2
# ----+--------+------
#   1 | Korea  | KR
#   2 | Others | XX
```

---

## Step 6: Test Backend Connection

Start your backend server locally:

```bash
npm run start:server
```

Check the console output:
- ✅ You should see: `PG connected`
- ❌ If you see connection errors, check:
  - RDS endpoint is correct in `.env`
  - Security group allows your IP
  - Password is correct
  - Database name is `othershorts`

Test the API endpoint:

```bash
curl http://localhost:3000/api/countries
```

Expected response:
```json
[{"id":1,"name":"Korea"},{"id":2,"name":"Others"}]
```

---

## Step 7: Deploy Backend to Production Server

When deploying to your production server (e.g., api.othershorts.com):

1. **SSH to your server**:
   ```bash
   ssh root@api.othershorts.com
   ```

2. **Update .env on the server**:
   ```bash
   cd /var/www/othershorts-api
   nano .env
   ```

3. **Add the same RDS credentials**:
   ```bash
   DB_USER=postgres
   DB_HOST=othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
   DB_NAME=othershorts
   DB_PASSWORD=YOUR_RDS_PASSWORD
   DB_PORT=5432
   ```

4. **Update RDS Security Group** to allow your production server:
   - Go to AWS RDS Console > Security Groups
   - Add inbound rule with your server's IP address

5. **Restart your application**:
   ```bash
   pm2 restart othershorts-api
   pm2 logs othershorts-api
   ```

---

## Step 8: Security Best Practices

### 1. Rotate Database Password

Your password was exposed in conversation. Change it:

1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. Select `othershorts-db`
3. Click **Modify**
4. Scroll to **New master password**
5. Enter a strong password (use password generator)
6. Click **Continue** > **Apply immediately**
7. Update `.env` file with new password

### 2. Restrict Security Group

Instead of `0.0.0.0/0`, only allow:
- Your local IP address (for development)
- Your production server IP (for production)

### 3. Enable Automated Backups

1. In RDS Console, select `othershorts-db`
2. Click **Modify**
3. Under **Backup**:
   - **Backup retention period**: 7 days
   - **Backup window**: Choose a low-traffic time
4. Click **Continue** > **Apply immediately**

### 4. Enable Connection Pooling (Recommended)

For production, use `pg.Pool` instead of `pg.Client` in `server/server.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user     : process.env.DB_USER,
  host     : process.env.DB_HOST,
  database : process.env.DB_NAME,
  password : process.env.DB_PASSWORD,
  port     : process.env.DB_PORT || 5432,
  max      : 20,  // Maximum number of clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Then replace all client.query() with pool.query()
```

---

## Cost Estimate

**AWS RDS db.t3.micro (Free Tier)**:
- **First 750 hours/month**: FREE (covers 1 instance running 24/7)
- **Storage (20 GB)**: FREE for first 20 GB
- **Backups**: FREE for 20 GB
- **After free tier expires**: ~$15-20/month

**Total**: FREE for 12 months with AWS Free Tier

---

## Troubleshooting

### Connection timeout

**Error**: `connect ETIMEDOUT`

**Solutions**:
1. Check security group allows your IP on port 5432
2. Verify RDS instance is "Available" status
3. Check if "Publicly accessible" is set to "Yes"
4. Verify endpoint URL is correct

### Authentication failed

**Error**: `password authentication failed for user "postgres"`

**Solutions**:
1. Verify password in `.env` matches RDS password
2. Check username is `postgres`
3. Ensure database name is `othershorts`

### Database does not exist

**Error**: `database "othershorts" does not exist`

**Solutions**:
1. When creating RDS, ensure "Initial database name" was set to `othershorts`
2. Or create it manually:
   ```bash
   psql -h your-endpoint.rds.amazonaws.com -U postgres -d postgres
   CREATE DATABASE othershorts;
   \q
   ```

### SSL/TLS errors

RDS requires SSL by default. Update connection if needed:

```javascript
const pool = new Pool({
  // ... other config
  ssl: {
    rejectUnauthorized: false
  }
});
```

---

## Monitoring

### CloudWatch Metrics

AWS RDS automatically provides CloudWatch metrics:
1. Go to RDS Console > `othershorts-db`
2. Click **Monitoring** tab
3. View:
   - CPU Utilization
   - Database Connections
   - Free Storage Space
   - Read/Write IOPS

### Set Up Alarms

1. In CloudWatch Console, create alarms for:
   - CPU > 80%
   - Free Storage < 2 GB
   - Connection count > 80

---

## Next Steps

1. ✅ Get RDS endpoint from AWS Console
2. ✅ Update `.env` with RDS credentials
3. ✅ Configure security group to allow your IP
4. ✅ Apply database schema using psql
5. ✅ Test backend connection locally
6. ✅ Deploy backend to production server
7. ⚠️ **IMPORTANT**: Rotate database password
8. ✅ Enable automated backups
9. ✅ Set up CloudWatch alarms

---

**Your RDS instance is ready to use!** The backend code requires no changes - just update the `.env` file with your RDS credentials.
