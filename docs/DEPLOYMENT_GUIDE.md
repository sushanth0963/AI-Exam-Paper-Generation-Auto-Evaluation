# 🚀 AI Exam Platform - Production Deployment Guide
**Version:** 2.0.0  
**Status:** Ready for Production  
**Last Updated:** May 24, 2026

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Setup](#database-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [SSL/TLS Configuration](#ssltls-configuration)
6. [Reverse Proxy Setup](#reverse-proxy-setup)
7. [Post-Deployment Testing](#post-deployment-testing)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] Linux server (Ubuntu 20.04+ or equivalent)
- [ ] At least 2 GB RAM
- [ ] 20+ GB disk space
- [ ] Python 3.11
- [ ] PostgreSQL 14+
- [ ] Nginx 1.18+
- [ ] Domain name with DNS configured

### Security Review
- [ ] SECRET_KEY generated and updated (min 32 chars)
- [ ] CORS_ORIGINS set to production domain only
- [ ] SSL/TLS certificate obtained (Let's Encrypt free)
- [ ] Firewall rules configured (allow 80, 443 only)
- [ ] SSH key authentication enabled (no password login)
- [ ] Fail2ban installed and configured

### Code & Config Review
- [ ] All ESLint warnings reviewed and accepted
- [ ] .env.production file created with production values
- [ ] DATABASE_URL set to PostgreSQL
- [ ] OPENAI_API_KEY configured (if using AI features)
- [ ] Backend code tested locally
- [ ] Frontend build verified to work

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create application user
CREATE USER ai_exam_user WITH PASSWORD 'your_strong_password_here';

# Create database
CREATE DATABASE ai_exam_prod OWNER ai_exam_user;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ai_exam_prod TO ai_exam_user;

# Connect to the database
\c ai_exam_prod

# Grant schema privileges
GRANT ALL ON SCHEMA public TO ai_exam_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ai_exam_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ai_exam_user;

# Exit psql
\q
```

### 2. Configure PostgreSQL for Production

Edit `/etc/postgresql/14/main/postgresql.conf`:

```ini
# Connection settings
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 1310kB
min_wal_size = 1GB
max_wal_size = 4GB

# SSL
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 3. Create Backups

```bash
# Create backup directory
sudo mkdir -p /var/backups/ai-exam-platform
sudo chown postgres:postgres /var/backups/ai-exam-platform

# Create cron job for daily backups
sudo crontab -e
# Add: 0 2 * * * /usr/bin/pg_dump -U ai_exam_user ai_exam_prod | gzip > /var/backups/ai-exam-platform/db_$(date +\%Y\%m\%d).sql.gz
```

---

## Backend Deployment

### 1. System User & Directory Setup

```bash
# Create application user
sudo useradd -m -s /bin/bash ai-exam

# Create application directory
sudo mkdir -p /home/ai-exam/app
sudo chown -R ai-exam:ai-exam /home/ai-exam/app

# Create log directory
sudo mkdir -p /var/log/ai-exam-platform
sudo chown ai-exam:ai-exam /var/log/ai-exam-platform

# Create run directory for PID files
sudo mkdir -p /var/run/ai-exam-platform
sudo chown ai-exam:ai-exam /var/run/ai-exam-platform
```

### 2. Clone & Setup Code

```bash
# Switch to app user
sudo su - ai-exam

# Clone repository (or upload code)
cd /home/ai-exam/app
# git clone your-repo.git .

# Create Python virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install gunicorn uvicorn[standard]
pip install -r requirements.txt

# Copy production environment file
cp .env.production .env
# Edit .env and update all CHANGE_ME values
nano .env
```

### 3. Create Systemd Service

Create `/etc/systemd/system/ai-exam-platform.service`:

```ini
[Unit]
Description=AI Exam Platform FastAPI Application
After=network.target postgresql.service

[Service]
Type=notify
User=ai-exam
Group=ai-exam
WorkingDirectory=/home/ai-exam/app
Environment="PATH=/home/ai-exam/app/venv/bin"
ExecStart=/home/ai-exam/app/venv/bin/gunicorn \
    -c docker/gunicorn.conf.py \
    -b 127.0.0.1:8000 \
    app.main:app

Restart=on-failure
RestartSec=5s
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ai-exam-platform
sudo systemctl start ai-exam-platform
sudo systemctl status ai-exam-platform
```

### 4. Install Dependencies

```bash
sudo apt-get update
sudo apt-get install -y gunicorn python3.11-venv python3.11-dev
```

---

## Frontend Deployment

### 1. Build Frontend

```bash
cd /home/ai-exam/app/frontend
npm install
npm run build
```

### 2. Deploy to Web Directory

```bash
sudo mkdir -p /var/www/ai-exam-platform/frontend
sudo cp -r frontend/dist/* /var/www/ai-exam-platform/frontend/
sudo chown -R www-data:www-data /var/www/ai-exam-platform
sudo chmod -R 755 /var/www/ai-exam-platform
```

### 3. Configure Nginx

```bash
# Copy nginx configuration
sudo cp docker/nginx.conf.production /etc/nginx/sites-available/ai-exam-platform

# Edit domain name in configuration
sudo nano /etc/nginx/sites-available/ai-exam-platform

# Enable site
sudo ln -s /etc/nginx/sites-available/ai-exam-platform /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

---

## SSL/TLS Configuration

### 1. Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Or for standalone (if not using Nginx initially):
# sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

### 3. Auto-Renewal

```bash
# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal (dry-run)
sudo certbot renew --dry-run
```

### 4. Update Nginx Configuration

Update certificate paths in nginx.conf to point to your actual domain:

```bash
sudo nano /etc/nginx/sites-available/ai-exam-platform
# Update:
# ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## Reverse Proxy Setup

### 1. Update Nginx Proxy Settings

The nginx configuration (`nginx.conf.production`) is already set up for:
- SSL/TLS termination
- Static file serving
- API request proxying to backend
- Compression and caching
- Security headers

### 2. Configure Firewall

```bash
# UFW (Ubuntu Firewall)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

---

## Post-Deployment Testing

### 1. Health Check

```bash
# Test backend
curl -s http://localhost:8000/ | head

# Test frontend
curl -s https://your-domain.com/ | grep -i "ai exam"

# Check service status
sudo systemctl status ai-exam-platform
```

### 2. Run E2E Tests

```bash
cd /home/ai-exam/app
python backend/test_e2e.py
```

### 3. Check Logs

```bash
# Application logs
sudo journalctl -u ai-exam-platform -f

# Nginx logs
sudo tail -f /var/log/nginx/ai-exam-platform.access.log
sudo tail -f /var/log/nginx/ai-exam-platform.error.log

# Gunicorn logs
tail -f /var/log/ai-exam-platform/gunicorn_error.log
```

---

## Monitoring & Maintenance

### 1. Set Up Monitoring

```bash
# Install monitoring tools
sudo apt-get install -y htop nethogs

# Monitor system resources
htop

# Monitor network
sudo nethogs
```

### 2. Database Maintenance

```bash
# Vacuum database (cleanup)
sudo -u postgres psql -c "VACUUM ANALYZE ai_exam_prod;"

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('ai_exam_prod'));"
```

### 3. Log Rotation

Create `/etc/logrotate.d/ai-exam-platform`:

```
/var/log/ai-exam-platform/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ai-exam ai-exam
    sharedscripts
    postrotate
        systemctl reload ai-exam-platform > /dev/null 2>&1 || true
    endscript
}
```

### 4. Performance Optimization

```bash
# Tune kernel parameters for production
sudo sysctl -w net.core.somaxconn=65535
sudo sysctl -w net.ipv4.tcp_max_syn_backlog=65535
sudo sysctl -w net.ipv4.ip_local_port_range="1024 65535"

# Make permanent by adding to /etc/sysctl.conf
```

### 5. Backup Strategy

```bash
# Daily database backup
0 2 * * * pg_dump -U ai_exam_user ai_exam_prod | gzip > /var/backups/ai-exam-platform/db_$(date +\%Y\%m\%d).sql.gz

# Daily code backup
0 3 * * * tar -czf /var/backups/ai-exam-platform/code_$(date +\%Y\%m\%d).tar.gz /home/ai-exam/app

# Weekly S3 backup
0 4 * * 0 aws s3 sync /var/backups/ai-exam-platform s3://your-bucket/backups/
```

---

## Troubleshooting

### Application won't start

```bash
# Check logs
sudo journalctl -u ai-exam-platform -n 50

# Check if port 8000 is in use
sudo lsof -i :8000

# Restart service
sudo systemctl restart ai-exam-platform
```

### Database connection error

```bash
# Test connection
psql -U ai_exam_user -d ai_exam_prod -h localhost

# Check DATABASE_URL in .env
cat /home/ai-exam/app/.env | grep DATABASE_URL
```

### SSL certificate issues

```bash
# Check certificate validity
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

---

## Rollback Plan

If deployment fails:

```bash
# Stop the service
sudo systemctl stop ai-exam-platform

# Revert code
cd /home/ai-exam/app
git checkout previous-version

# Downgrade database (backup restore)
sudo -u postgres psql ai_exam_prod < /var/backups/ai-exam-platform/db_previous.sql

# Restart
sudo systemctl start ai-exam-platform
```

---

## Success Metrics

After deployment, verify:

- [ ] Frontend loads without errors (https://your-domain.com)
- [ ] Users can register and login
- [ ] Admins can create exams
- [ ] Students can attempt exams
- [ ] Scores calculated correctly
- [ ] API response time < 200ms
- [ ] Nginx logs show no errors

---

## Render Deployment

The repository includes `render.yaml` and a production Docker entrypoint. In Render, create the service from the Blueprint, set `DATABASE_URL`, `OPENAI_API_KEY`, `CORS_ORIGINS`, and `FRONTEND_URL`, then deploy. `SECRET_KEY` is generated by the Blueprint and the container listens on Render's `PORT`.

For local verification before deployment:

```bash
cd backend
python -m pytest -q
docker build -t ai-exam-api .
```

Keep `.env.production` as a template only. Store real secrets in Render environment variables or the hosting provider's secret store.
- [ ] SSL certificate valid (green lock in browser)
- [ ] All security headers present
- [ ] Database backups running daily

---

**Deployment Status:** ✅ Ready  
**Estimated Time:** 30-60 minutes  
**Support:** Contact devops@your-domain.com
