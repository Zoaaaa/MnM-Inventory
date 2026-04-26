# VPS Deployment Guide - MnM Cubes Inventory

This guide covers deploying the MnM Inventory app on a VPS (e.g., DigitalOcean, Linode, Vultr, Hetzner) using **Nginx** as a reverse proxy and **PM2** for process management.

## 📋 Prerequisites

- Ubuntu 22.04+ VPS (1GB RAM minimum)
- Domain name pointed to your VPS IP (e.g., `shop.mnmcubes.ph`)
- SSH access to the server

## 1. Server Setup

### Update system and install essentials

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

### Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # Should show v20.x
```

### Install PM2

```bash
sudo npm install -g pm2
```

### Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE USER mnm_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE mnm_inventory OWNER mnm_user;
GRANT ALL PRIVILEGES ON DATABASE mnm_inventory TO mnm_user;
\q
```

## 3. Deploy Application

### Clone or upload your code

```bash
# Option A: Git clone
cd /var/www
sudo git clone https://your-repo-url.git mnm-inventory
sudo chown -R $USER:$USER /var/www/mnm-inventory

# Option B: Upload via SCP
scp -r ./MnM-Inventory user@your-server:/var/www/mnm-inventory
```

### Install dependencies

```bash
cd /var/www/mnm-inventory/backend
npm install --production

cd /var/www/mnm-inventory/frontend
npm install
```

### Configure backend environment

```bash
cd /var/www/mnm-inventory/backend
cp .env.example .env
nano .env
```

Set production values:
```env
PORT=5000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5432
DB_NAME=mnm_inventory
DB_USER=mnm_user
DB_PASSWORD=your_secure_password_here

JWT_SECRET=generate_a_long_random_string_here
JWT_EXPIRES_IN=7d

MESSENGER_PAGE_ID=your_facebook_page_id
MESSENGER_DEFAULT_MESSAGE=Hi! I'd like to order: {product}. Is this still available?

FRONTEND_URL=https://shop.mnmcubes.ph
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Configure frontend environment

```bash
cd /var/www/mnm-inventory/frontend
cp .env.example .env
nano .env
```

```env
VITE_API_URL=https://shop.mnmcubes.ph/api
VITE_MESSENGER_PAGE_ID=your_facebook_page_id
```

### Set up database

```bash
cd /var/www/mnm-inventory/backend
npm run db:setup
npm run db:seed
```

### Build frontend

```bash
cd /var/www/mnm-inventory/frontend
npm run build
```

## 4. PM2 Process Management

### Create PM2 ecosystem file

```bash
cd /var/www/mnm-inventory
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'mnm-api',
    script: './backend/src/server.js',
    cwd: '/var/www/mnm-inventory/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
```

### Start the application

```bash
cd /var/www/mnm-inventory
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the instructions to enable auto-start on boot
```

### Useful PM2 commands

```bash
pm2 status          # Check status
pm2 logs mnm-api    # View logs
pm2 restart mnm-api # Restart
pm2 stop mnm-api    # Stop
pm2 monit           # Monitor resources
```

## 5. Nginx Configuration

### Create Nginx site config

```bash
sudo nano /etc/nginx/sites-available/mnm-inventory
```

```nginx
server {
    listen 80;
    server_name shop.mnmcubes.ph;

    # Frontend (static files from Vite build)
    root /var/www/mnm-inventory/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # API proxy to Express backend
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded files
    location /uploads {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback - serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/mnm-inventory /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## 6. SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d shop.mnmcubes.ph
```

Certbot will automatically:
- Obtain an SSL certificate
- Configure Nginx for HTTPS
- Set up auto-renewal

### Verify auto-renewal

```bash
sudo certbot renew --dry-run
```

## 7. Firewall Setup

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 8. Updating the Application

### Quick update script

Create `/var/www/mnm-inventory/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🔄 Pulling latest code..."
cd /var/www/mnm-inventory
git pull origin main

echo "📦 Installing backend dependencies..."
cd backend
npm install --production

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "🔨 Building frontend..."
npm run build

echo "🔄 Restarting backend..."
pm2 restart mnm-api

echo "✅ Deployment complete!"
```

```bash
chmod +x /var/www/mnm-inventory/deploy.sh
```

Run updates with:
```bash
/var/www/mnm-inventory/deploy.sh
```

## 9. Monitoring & Maintenance

### View logs
```bash
pm2 logs mnm-api --lines 100
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database backup
```bash
# Manual backup
pg_dump -U mnm_user mnm_inventory > backup_$(date +%Y%m%d).sql

# Automated daily backup (add to crontab)
crontab -e
# Add: 0 2 * * * pg_dump -U mnm_user mnm_inventory > /var/backups/mnm_$(date +\%Y\%m\%d).sql
```

### Restore from backup
```bash
psql -U mnm_user mnm_inventory < backup_20240101.sql
```

## 10. Recommended VPS Providers

| Provider | Cheapest Plan | Notes |
|----------|--------------|-------|
| DigitalOcean | $4/mo (512MB) | Good for starting, use $6/mo for comfort |
| Vultr | $3.50/mo (512MB) | Cheapest option |
| Linode | $5/mo (1GB) | Good performance |
| Hetzner | €3.79/mo (2GB) | Best value, EU-based |

**Recommended:** Start with a $5-6/mo plan (1GB RAM) and scale up as needed.

## Troubleshooting

### App not starting
```bash
pm2 logs mnm-api --lines 50  # Check for errors
cd /var/www/mnm-inventory/backend && node src/server.js  # Run directly to see errors
```

### Database connection issues
```bash
sudo -u postgres psql -c "SELECT 1;"  # Test PostgreSQL is running
```

### Nginx 502 Bad Gateway
```bash
pm2 status  # Ensure the API is running
curl http://localhost:5000/api/health  # Test API directly
```

### Permission issues
```bash
sudo chown -R $USER:$USER /var/www/mnm-inventory
```
