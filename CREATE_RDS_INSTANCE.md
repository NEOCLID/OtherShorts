# Create AWS RDS PostgreSQL Instance for OtherShorts

## Prerequisites

- AWS Account with billing enabled
- Credit card on file (for free tier or paid usage)

---

## Step 1: Check for Existing RDS Instances

Before creating a new one, let's verify if you already have an RDS instance:

1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. **IMPORTANT**: Check the region selector in the top-right corner
   - Your settings mentioned `us-east-1` (N. Virginia)
   - Switch to **US East (N. Virginia)** if not already there
3. Look at the **Databases** section on the left
4. If you see any databases listed, note the name

**Common reasons you might not see it:**
- Wrong AWS region selected
- RDS instance was never created
- RDS instance was deleted
- Using different AWS account

---

## Step 2: Create New RDS Instance

If there's no RDS instance, let's create one:

### A. Start Creating Database

1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. Click **Create database**

### B. Engine Options

- **Engine type**: PostgreSQL
- **Edition**: PostgreSQL (default)
- **Engine Version**: PostgreSQL 15.14 (or latest 15.x)

### C. Templates

- Select **Free tier** (if eligible)
  - OR **Production** / **Dev/Test** if not eligible for free tier

### D. Settings

```
DB instance identifier: othershorts-db
Master username: postgres
Master password: [CREATE A STRONG PASSWORD]
Confirm password: [SAME PASSWORD]
```

**⚠️ IMPORTANT**: Save this password somewhere secure! You'll need it for your `.env` file.

### E. Instance Configuration

**If using Free Tier:**
- **DB instance class**: db.t3.micro (or db.t4g.micro)
- **Burstable classes** section

**If NOT using Free Tier:**
- **DB instance class**: db.t3.micro
- **Standard classes** section

### F. Storage

```
Storage type: General Purpose SSD (gp3) or gp2
Allocated storage: 20 GB
```

**Free tier includes:**
- 20 GB of storage
- 20 GB of backup storage

**Uncheck** "Enable storage autoscaling" (optional, to control costs)

### G. Connectivity

```
Compute resource: Don't connect to an EC2 compute resource
Virtual private cloud (VPC): Default VPC
```

**Subnet group**: Default

**Public access**: ✅ **Yes** (IMPORTANT: Set to YES)
- This allows you to connect from your local machine
- You'll secure it with security groups

**VPC security group**:
- Create new
- New VPC security group name: `othershorts-db-sg`

**Availability Zone**: No preference

**Database port**: 5432

### H. Database Authentication

- **Database authentication**: Password authentication

### I. Additional Configuration

Click **Additional configuration** to expand:

```
Initial database name: othershorts
```

**⚠️ CRITICAL**: Make sure to set "Initial database name" to `othershorts`!

**Backup:**
- ✅ Enable automated backups
- Backup retention period: 7 days
- Backup window: No preference

**Encryption:**
- ✅ Enable encryption (default)

**Monitoring:**
- ✅ Enable Enhanced monitoring (optional, uses CloudWatch)

**Maintenance:**
- ✅ Enable auto minor version upgrade

### J. Review and Create

1. Scroll down and review your settings
2. **Estimated monthly costs**:
   - Free tier: $0 for 12 months (750 hours/month)
   - After free tier: ~$15-20/month
3. Click **Create database**

### K. Wait for Creation

- **Status**: Creating... (takes 5-10 minutes)
- **Final status**: Available

**Do NOT close the browser!** Wait until status shows "Available"

---

## Step 3: Configure Security Group

Once the database is "Available":

### A. Find Security Group

1. Click on your database: `othershorts-db`
2. Go to **Connectivity & security** tab
3. Under **Security**, click on the **VPC security groups** link

### B. Add Inbound Rule

1. Click **Edit inbound rules**
2. Click **Add rule**
3. Configure:
   ```
   Type: PostgreSQL
   Protocol: TCP
   Port range: 5432
   Source: My IP (it will auto-detect your IP)
   Description: My local machine
   ```
4. Click **Save rules**

**For production server**: Add another rule with your production server's IP address

---

## Step 4: Get Connection Details

1. Go back to RDS Console > Databases > `othershorts-db`
2. Under **Connectivity & security**, find:
   - **Endpoint**: `othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com`
   - **Port**: 5432

**Copy the endpoint!** You'll need it for the next step.

---

## Step 5: Update Your .env File

Update your local `.env` file:

```bash
# Database Configuration - AWS RDS
DB_USER=postgres
DB_HOST=othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
DB_NAME=othershorts
DB_PASSWORD=YOUR_PASSWORD_FROM_STEP_2D
DB_PORT=5432
```

**Replace**:
- `othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com` with your actual endpoint
- `YOUR_PASSWORD_FROM_STEP_2D` with the password you created

---

## Step 6: Initialize Database Schema

Now apply the database schema:

### Option A: Using psql (Command Line)

**Install psql if not already installed:**
- **Windows**: Download from https://www.postgresql.org/download/windows/
  - Install "Command Line Tools" only
  - Add to PATH: `C:\Program Files\PostgreSQL\16\bin`
- **Mac**: `brew install postgresql`
- **Linux**: `sudo apt install postgresql-client`

**Connect and apply schema:**

```bash
# Test connection first
psql -h othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com -U postgres -d othershorts

# If connection works, you'll see:
# Password for user postgres: [ENTER YOUR PASSWORD]
# othershorts=>

# Exit: \q

# Apply schema
psql -h othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com -U postgres -d othershorts -f database/schema.sql

# Verify tables
psql -h othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com -U postgres -d othershorts -c "\dt"
```

### Option B: Using pgAdmin (GUI)

1. Download [pgAdmin](https://www.pgadmin.org/download/)
2. Install and open pgAdmin
3. Right-click **Servers** > **Create** > **Server**
4. **General** tab:
   - Name: `OtherShorts RDS`
5. **Connection** tab:
   - Host: `othershorts-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com`
   - Port: `5432`
   - Maintenance database: `othershorts`
   - Username: `postgres`
   - Password: `YOUR_PASSWORD`
   - ✅ Save password
6. Click **Save**
7. Expand: **Servers** > **OtherShorts RDS** > **Databases** > **othershorts**
8. Right-click on `othershorts` > **Query Tool**
9. Open `database/schema.sql` file in the query editor
10. Click **Execute** (F5)
11. Verify tables were created:
    ```sql
    SELECT * FROM countries;
    ```
    Should return Korea and Others

---

## Step 7: Test Backend Connection

Start your backend server:

```bash
npm run start:server
```

**Expected output:**
```
PG connected
Server listening on port 3000
```

**Test API:**
```bash
curl http://localhost:3000/api/countries
```

**Expected response:**
```json
[{"id":1,"name":"Korea"},{"id":2,"name":"Others"}]
```

---

## Troubleshooting

### Can't connect: "Connection timed out"

**Problem**: Security group not configured

**Solution**:
1. Go to RDS Console > `othershorts-db` > Connectivity & security
2. Click on VPC security group
3. Edit inbound rules
4. Add PostgreSQL rule with "My IP" as source
5. Make sure "Publicly accessible" is set to "Yes"

### Can't connect: "Authentication failed"

**Problem**: Wrong password

**Solution**:
1. Double-check password in `.env`
2. If you forgot it, you can reset it:
   - RDS Console > `othershorts-db` > Modify
   - Scroll to "New master password"
   - Enter new password
   - Apply immediately

### Database "othershorts" doesn't exist

**Problem**: You didn't set "Initial database name" when creating RDS

**Solution**:
```bash
# Connect to default 'postgres' database
psql -h your-endpoint.rds.amazonaws.com -U postgres -d postgres

# Create 'othershorts' database
CREATE DATABASE othershorts;

# Exit
\q

# Now connect to 'othershorts' and apply schema
psql -h your-endpoint.rds.amazonaws.com -U postgres -d othershorts -f database/schema.sql
```

### Wrong region

**Problem**: RDS instance exists but you're looking in wrong region

**Solution**:
1. In AWS Console, top-right corner
2. Click region selector (e.g., "US East (N. Virginia)")
3. Try different regions:
   - US East (N. Virginia) - us-east-1
   - US West (Oregon) - us-west-2
   - Asia Pacific (Seoul) - ap-northeast-2

---

## Cost Monitoring

### Free Tier Limits

AWS Free Tier includes (for 12 months):
- 750 hours/month of db.t3.micro or db.t4g.micro
- 20 GB of General Purpose SSD storage
- 20 GB of backup storage

**One db.t3.micro running 24/7 = 720 hours/month** (within free tier)

### Set Up Billing Alerts

1. Go to [AWS Billing Console](https://console.aws.amazon.com/billing/)
2. **Billing Preferences** > **Alert preferences**
3. ✅ Enable "Receive Billing Alerts"
4. Go to [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
5. **Alarms** > **Create alarm**
6. Select metric: **Billing** > **Total Estimated Charge**
7. Set threshold: $5 or $10
8. Add email notification

---

## Next Steps

Once RDS is created and connected:

1. ✅ RDS instance created
2. ✅ Security group configured
3. ✅ Database schema applied
4. ✅ Backend connected locally
5. ⏭️ Deploy backend to production server (see `SERVER_SETUP_GUIDE.md`)
6. ⏭️ Update Google OAuth for production (see `GOOGLE_OAUTH_SETUP.md`)
7. ⏭️ Build and deploy Android app (see `BUILD_INSTRUCTIONS.md`)

---

**Questions?** Check `AWS_RDS_SETUP.md` for additional configuration details.
