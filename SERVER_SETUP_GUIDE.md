# Production Server Setup Guide

## Prerequisites

- A VPS or cloud server (Ubuntu 20.04+ or Debian 11+ recommended)
- Domain: `api.othershorts.com` pointed to your server IP
- SSH access to the server
- Basic Linux command line knowledge

**Recommended Providers:**
- DigitalOcean: $5-10/month (easiest for beginners)
- AWS EC2: Free tier available, then $5-10/month
- Linode: $5/month
- Vultr: $5/month
- Hetzner: €4/month (cheapest)

---

## Step 1: Get a Server

### Option A: DigitalOcean (Recommended for Beginners)

1. Go to [DigitalOcean](https://www.digitalocean.com/)
2. Create account (get $200 credit with referrals)
3. Click "Create" > "Droplets"
4. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month)
   - **CPU**: Regular (1 GB RAM, 1 vCPU)
   - **Datacenter**: Closest to Korea (Singapore or San Francisco)
5. Add SSH key or use password authentication
6. Create Droplet

### Option B: AWS EC2

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to EC2
3. Launch Instance:
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.micro (free tier) or t3.micro
   - **Security Group**: Allow SSH (22), HTTP (80), HTTPS (443)
4. Create and download key pair
5. Launch instance

---

## Step 2: Configure DNS

Go to your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare):

### Add DNS Records:

```
Type    Name    Value                   TTL
A       api     YOUR_SERVER_IP          300
```

**Wait 5-15 minutes** for DNS propagation.

**Test DNS:**
```bash
ping api.othershorts.com
# Should show your server's IP
```

---

## Step 3: Connect to Server

### On Windows (PowerShell):
```powershell
ssh root@YOUR_SERVER_IP
# or
ssh root@api.othershorts.com
```

### On Mac/Linux:
```bash
ssh root@YOUR_SERVER_IP
```

**First time?** Accept the SSH fingerprint by typing `yes`.

---

## Step 4: Run Automated Setup Script

```bash
# Upload setup scripts to server first
# From your local machine:
scp server-setup.sh configure-nginx.sh deploy-backend.sh root@api.othershorts.com:/root/

# Then on the server:
ssh root@api.othershorts.com

# Run setup script
chmod +x server-setup.sh configure-nginx.sh deploy-backend.sh
sudo ./server-setup.sh
```

This script will install:
- Node.js 20.x
- PostgreSQL 14+
- Nginx
- Certbot (Let's Encrypt)
- PM2 (Process Manager)

**⏱️ Takes 5-10 minutes**

---

## Step 5: Deploy Your Code

### Option A: Using Git (Recommended)

```bash
# On server:
cd /var/www/othershorts-api

# Clone your repository (make it PRIVATE first!)
git clone https://github.com/YOUR_USERNAME/othershorts-api.git .

# Or if already cloned, pull latest:
git pull origin master

# Install dependencies
npm install --production
```

### Option B: Upload Files Manually

```bash
# From your local machine:
# Exclude node_modules, .git, and large files
rsync -avz --exclude 'node_modules' \
           --exclude '.git' \
           --exclude 'android' \
           --exclude 'ios' \
           C:\Dev\otherTubeApp\OtherShorts/ \
           root@api.othershorts.com:/var/www/othershorts-api/

# Then on server:
cd /var/www/othershorts-api
npm install --production
```

---

## Step 6: Configure Environment Variables

```bash
# On server:
cd /var/www/othershorts-api
nano .env
```

**Add production values:**
```bash
# Google OAuth (same as development)
EXPO_PUBLIC_EXPO_CLIENT_ID=874054853041-0vbn26ekopo5o36079cje63acp567amk.apps.googleusercontent.com
EXPO_PUBLIC_WEB_CLIENT_ID=874054853041-46orv6vs3l5uauju1fnajgl3tjijghdk.apps.googleusercontent.com
EXPO_PUBLIC_ANDROID_CLIENT_ID=874054853041-lhci3mj5ap0ijbpn507vpm13s935j5bb.apps.googleusercontent.com

# Database - CHANGE PASSWORD!
DB_USER=othershorts
DB_HOST=localhost
DB_NAME=othershorts_db
DB_PASSWORD=GENERATE_STRONG_PASSWORD_HERE
DB_PORT=5432

# YouTube API - Consider creating a new key for production
YOUTUBE_API_KEY=YOUR_PRODUCTION_API_KEY
```

**Save**: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## Step 7: Set Up Database

```bash
# Change PostgreSQL password (IMPORTANT!)
sudo -u postgres psql
ALTER USER othershorts WITH PASSWORD 'YOUR_NEW_STRONG_PASSWORD';
\q

# Update .env with the new password
nano .env

# Apply database schema
psql -U othershorts -d othershorts_db -f database/schema.sql

# Test connection
psql -U othershorts -d othershorts_db -c "SELECT * FROM countries;"
# Should show Korea and Others
```

---

## Step 8: Configure Nginx

```bash
sudo ./configure-nginx.sh
```

This sets up:
- Reverse proxy from port 80 to port 3000
- Security headers
- File upload limits
- Logging

**Test Nginx:**
```bash
sudo nginx -t
sudo systemctl status nginx
```

---

## Step 9: Start Application

```bash
cd /var/www/othershorts-api
./deploy-backend.sh
```

**Or manually:**
```bash
pm2 start server/server.js --name othershorts-api
pm2 save
pm2 startup  # Enable auto-start on boot
```

**Check status:**
```bash
pm2 status
pm2 logs othershorts-api
```

**Test locally:**
```bash
curl http://localhost:3000/api/countries
# Should return: [{"id":1,"name":"Korea"},{"id":2,"name":"Others"}]
```

---

## Step 10: Configure SSL (HTTPS)

```bash
sudo certbot --nginx -d api.othershorts.com
```

**Follow prompts:**
1. Enter email address
2. Agree to Terms of Service
3. Choose whether to share email (optional)
4. Select option 2: "Redirect HTTP to HTTPS"

**Certbot will:**
- Obtain SSL certificate from Let's Encrypt
- Configure Nginx automatically
- Set up auto-renewal (cron job)

**Test SSL:**
```bash
curl https://api.othershorts.com/api/countries
```

---

## Step 11: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

---

## Step 12: Set Up Monitoring & Backups

### PM2 Monitoring:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Database Backups (Daily):
```bash
# Create backup script
sudo nano /usr/local/bin/backup-othershorts-db.sh
```

**Add:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/othershorts"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U othershorts othershorts_db > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-othershorts-db.sh

# Add to crontab (runs daily at 2 AM)
sudo crontab -e
```

**Add line:**
```
0 2 * * * /usr/local/bin/backup-othershorts-db.sh
```

---

## ✅ Verification Checklist

Test each endpoint:

```bash
# Health check (add this endpoint to your server first)
curl https://api.othershorts.com/health

# Countries endpoint
curl https://api.othershorts.com/api/countries

# Check HTTPS is working
curl -I https://api.othershorts.com

# Check HTTP redirects to HTTPS
curl -I http://api.othershorts.com
```

---

## 🔧 Troubleshooting

### Application won't start:
```bash
pm2 logs othershorts-api --lines 100
# Check for errors
```

### Database connection fails:
```bash
psql -U othershorts -d othershorts_db
# If fails, check .env password matches PostgreSQL password
```

### Nginx errors:
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/othershorts-api-error.log
```

### SSL certificate fails:
```bash
# Make sure DNS is pointing to server
dig api.othershorts.com

# Try manual certificate
sudo certbot certonly --nginx -d api.othershorts.com
```

---

## 🔄 Future Updates

```bash
# SSH to server
ssh root@api.othershorts.com

# Pull latest code
cd /var/www/othershorts-api
git pull origin master

# Restart application
pm2 restart othershorts-api

# Check logs
pm2 logs othershorts-api
```

---

## 📊 Useful Commands

```bash
# PM2
pm2 status                          # Check all processes
pm2 logs othershorts-api            # View logs
pm2 restart othershorts-api         # Restart app
pm2 stop othershorts-api            # Stop app
pm2 monit                           # Monitor CPU/memory

# Nginx
sudo nginx -t                       # Test config
sudo systemctl restart nginx        # Restart Nginx
sudo tail -f /var/log/nginx/othershorts-api-access.log

# PostgreSQL
psql -U othershorts -d othershorts_db
\dt                                 # List tables
\d users                            # Describe users table

# System
htop                                # Monitor resources
df -h                               # Disk space
free -h                             # Memory usage
```

---

## 💰 Cost Estimate

- **VPS**: $5-10/month
- **Domain**: Already owned
- **SSL**: FREE (Let's Encrypt)

**Total**: ~$5-10/month

---

## Next Step

Once server is running, proceed to:
**Step 3: Configure Google OAuth for Production**

See: `DEPLOYMENT_SUMMARY.md`
