#!/bin/bash
# Nginx Configuration Script for api.othershorts.com

set -e

echo "======================================"
echo "Configuring Nginx for OtherShorts API"
echo "======================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Create Nginx configuration
cat > /etc/nginx/sites-available/othershorts-api << 'EOF'
server {
    listen 80;
    server_name api.othershorts.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # File upload size limit (for Takeout files)
        client_max_body_size 100M;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:3000/health;
    }

    # Logging
    access_log /var/log/nginx/othershorts-api-access.log;
    error_log /var/log/nginx/othershorts-api-error.log;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/othershorts-api /etc/nginx/sites-enabled/

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

# Reload Nginx
echo "Reloading Nginx..."
systemctl reload nginx

echo ""
echo "✅ Nginx configured successfully!"
echo ""
echo "Next steps:"
echo "1. Make sure your application is running on port 3000"
echo "2. Configure SSL: sudo certbot --nginx -d api.othershorts.com"
echo "3. Test: curl http://api.othershorts.com"
echo ""
