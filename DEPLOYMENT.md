# Deployment Guide - Charlotte's Web

This guide covers deploying Charlotte's Web to production.

## Pre-Deployment Checklist

- [ ] All platform API credentials configured
- [ ] MongoDB production database set up
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Domain name configured
- [ ] Backup strategy in place

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### 2. Clone and Setup Application

```bash
# Clone repository
git clone https://github.com/njeff667/charlottes-web.git
cd charlottes-web

# Install dependencies
npm install
cd client && npm install && cd ..

# Build frontend
cd client && npm run build && cd ..

# Create .env file
nano .env
```

#### 3. Configure Environment

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/charlottes-web
JWT_SECRET=your-production-secret-key
SITE_URL=https://yourdomain.com

# Platform credentials
EBAY_API_KEY=your-ebay-key
EBAY_API_SECRET=your-ebay-secret
FACEBOOK_APP_ID=your-facebook-id
FACEBOOK_APP_SECRET=your-facebook-secret
DEPOP_API_KEY=your-depop-key
```

#### 4. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/charlottes-web
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /home/user/charlottes-web/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/charlottes-web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 6. Start Application with PM2

```bash
# Start application
pm2 start server.js --name charlottes-web

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 7. Configure Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Option 2: Heroku Deployment

#### 1. Prepare Application

Create `Procfile`:
```
web: node server.js
```

#### 2. Deploy to Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create charlottes-web

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set SITE_URL=https://charlottes-web.herokuapp.com

# Deploy
git push heroku main

# Open app
heroku open
```

### Option 3: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy application files
COPY . .

# Build frontend
RUN cd client && npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "server.js"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    restart: always
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  app:
    build: .
    restart: always
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/charlottes-web?authSource=admin
      - JWT_SECRET=your-secret
      - SITE_URL=https://yourdomain.com
    depends_on:
      - mongodb

volumes:
  mongodb_data:
```

#### 3. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Post-Deployment Tasks

### 1. Initialize Platforms

```bash
npm run init:platforms
```

### 2. Configure Platforms

1. Access admin dashboard at https://yourdomain.com/admin
2. Navigate to Platforms
3. Configure each platform with production credentials

### 3. Import Inventory

1. Upload CSV file through admin interface
2. Or use API endpoint to import data

### 4. Test All Features

- [ ] User authentication
- [ ] Product creation
- [ ] Multi-platform listing
- [ ] Synchronization
- [ ] Sale handling
- [ ] Notifications

### 5. Setup Monitoring

#### Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs charlottes-web
```

#### Database Backups

```bash
# Create backup script
nano /home/user/backup-mongodb.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --out=$BACKUP_DIR/mongodb_$DATE
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

```bash
# Make executable
chmod +x /home/user/backup-mongodb.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /home/user/backup-mongodb.sh
```

### 6. Setup Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for usage tracking

## Maintenance

### Regular Updates

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install
cd client && npm install && cd ..

# Build frontend
cd client && npm run build && cd ..

# Restart application
pm2 restart charlottes-web
```

### Database Maintenance

```bash
# Compact database
mongo charlottes-web --eval "db.runCommand({compact: 'products'})"

# Check database size
mongo charlottes-web --eval "db.stats()"
```

### Log Rotation

```bash
# Configure PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Scaling

### Horizontal Scaling

1. Use load balancer (Nginx, HAProxy)
2. Deploy multiple application instances
3. Use MongoDB replica set
4. Implement Redis for session storage

### Vertical Scaling

1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Implement caching
4. Use CDN for static assets

## Security Best Practices

- [ ] Use strong JWT secrets
- [ ] Enable HTTPS only
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Database access restrictions
- [ ] API key rotation
- [ ] Regular backups
- [ ] Monitor for suspicious activity

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs charlottes-web

# Check MongoDB
sudo systemctl status mongod

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

### High Memory Usage

```bash
# Check memory
free -h

# Restart application
pm2 restart charlottes-web

# Increase memory limit
pm2 start server.js --name charlottes-web --max-memory-restart 1G
```

### Database Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection string
echo $MONGODB_URI

# Test connection
mongo $MONGODB_URI
```

## Support

For deployment issues:
- Check logs: `pm2 logs charlottes-web`
- Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`

---

**Deployment Complete!** Your Charlotte's Web application is now live.