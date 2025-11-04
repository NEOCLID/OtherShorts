#!/bin/bash
# Production Server Setup Script for api.othershorts.com
# Run this on your Ubuntu/Debian server

set -e  # Exit on error

echo "======================================"
echo "OtherShorts Production Server Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}[1/8] Updating system packages...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}[2/8] Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo -e "${GREEN}[3/8] Installing PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib

echo -e "${GREEN}[4/8] Installing Nginx...${NC}"
apt install -y nginx

echo -e "${GREEN}[5/8] Installing Certbot (Let's Encrypt)...${NC}"
apt install -y certbot python3-certbot-nginx

echo -e "${GREEN}[6/8] Installing PM2 globally...${NC}"
npm install -g pm2

echo -e "${GREEN}[7/8] Setting up PostgreSQL database...${NC}"
sudo -u postgres psql -c "CREATE DATABASE othershorts_db;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER othershorts WITH PASSWORD 'TEMP_PASSWORD_CHANGE_ME';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE othershorts_db TO othershorts;"

echo -e "${GREEN}[8/8] Creating application directory...${NC}"
mkdir -p /var/www/othershorts-api
chown -R $SUDO_USER:$SUDO_USER /var/www/othershorts-api

echo ""
echo -e "${GREEN}✅ Base system setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Clone your repository to /var/www/othershorts-api"
echo "2. Run: cd /var/www/othershorts-api && npm install"
echo "3. Create .env file with production values"
echo "4. Apply database schema: psql -U othershorts -d othershorts_db -f database/schema.sql"
echo "5. Configure Nginx (run: sudo ./configure-nginx.sh)"
echo "6. Start application: pm2 start server/server.js --name othershorts-api"
echo "7. Configure SSL: sudo certbot --nginx -d api.othershorts.com"
echo ""
echo -e "${RED}⚠️  IMPORTANT:${NC}"
echo "- Change the PostgreSQL password (currently: TEMP_PASSWORD_CHANGE_ME)"
echo "- Configure your firewall to allow ports 80, 443, and optionally 22 (SSH)"
echo "- Set up automated backups for PostgreSQL"
echo ""
