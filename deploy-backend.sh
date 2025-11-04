#!/bin/bash
# Backend Deployment Script
# Run this on your production server at /var/www/othershorts-api

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "======================================"
echo "Deploying OtherShorts Backend"
echo "======================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env file with production values:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

echo -e "${GREEN}[1/6] Installing dependencies...${NC}"
npm install --production

echo -e "${GREEN}[2/6] Checking database connection...${NC}"
node -e "
const { Client } = require('pg');
require('dotenv').config();
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});
client.connect()
  .then(() => {
    console.log('✅ Database connection successful');
    client.end();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
" || exit 1

echo -e "${GREEN}[3/6] Checking if schema is applied...${NC}"
node -e "
const { Client } = require('pg');
require('dotenv').config();
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});
client.connect()
  .then(() => client.query('SELECT COUNT(*) FROM users'))
  .then(() => {
    console.log('✅ Database schema is applied');
    client.end();
  })
  .catch(err => {
    console.log('⚠️  Database schema not applied. Run:');
    console.log('   psql -U othershorts -d othershorts_db -f database/schema.sql');
    client.end();
  });
"

echo -e "${GREEN}[4/6] Stopping existing PM2 process...${NC}"
pm2 stop othershorts-api 2>/dev/null || echo "No existing process found"
pm2 delete othershorts-api 2>/dev/null || echo "No existing process to delete"

echo -e "${GREEN}[5/6] Starting application with PM2...${NC}"
pm2 start server/server.js --name othershorts-api --time

echo -e "${GREEN}[6/6] Saving PM2 configuration...${NC}"
pm2 save

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Application status:"
pm2 status othershorts-api
echo ""
echo "View logs:"
echo "  pm2 logs othershorts-api"
echo ""
echo "Monitor:"
echo "  pm2 monit"
echo ""
echo "Test API:"
echo "  curl http://localhost:3000/api/countries"
echo "  curl http://api.othershorts.com/api/countries"
echo ""
