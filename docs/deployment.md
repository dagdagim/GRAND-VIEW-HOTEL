# Production Deployment & Operations Guide
## Grand View Hotel & Suites

### 1. Production Architecture Overview

In a production environment, the frontend is served as optimized static assets via Nginx or Cloudflare CDN, with API requests reverse-proxied to Node.js backend processes managed by PM2 or Docker containers.

```
                    ┌─────────────────────────┐
                    │     CLOUDFLARE / CDN    │
                    └────────────┬────────────┘
                                 │ HTTPS (443)
                                 ▼
                    ┌─────────────────────────┐
                    │      NGINX GATEWAY      │
                    ├────────────┬────────────┤
                    │ Static UI  │ /api Proxy │
                    └─────┬──────┴─────┬──────┘
                          │            │
            ┌─────────────┘            └─────────────┐
            ▼                                        ▼
┌───────────────────────┐                ┌───────────────────────┐
│   Vite Static Build   │                │   Node.js PM2 Cluster │
│     `/var/www/html`   │                │   `localhost:5000`    │
└───────────────────────┘                └───────────┬───────────┘
                                                     │
                                                     ▼
                                         ┌───────────────────────┐
                                         │  MongoDB Replica Set  │
                                         │     (Port 27017)      │
                                         └───────────────────────┘
```

---

### 2. Environment Variables Specification

#### Backend (`backend/.env`)
```ini
NODE_ENV=production
PORT=5000

# Database Connection (MongoDB URI with replica set and auth)
MONGODB_URI=mongodb://admin:password123@127.0.0.1:27017/hotel_pms?authSource=admin

# JWT Security
JWT_SECRET=super_secret_production_key_gvh_2026_hotel_pms
JWT_EXPIRES_IN=24h

# Hotel Fiscal Parameters
DEFAULT_TAX_RATE=0.15
DEFAULT_SERVICE_CHARGE=0.10

# CORS Allowed Origins
CORS_ORIGIN=https://grandviewhotel.com,https://pms.grandviewhotel.com
```

#### Frontend (`frontend/.env.production`)
```ini
VITE_API_URL=/api
```

---

### 3. Docker Compose Configuration

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: gvh_mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: hotel_pms
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gvh_backend
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=mongodb://admin:password123@mongodb:27017/hotel_pms?authSource=admin
      - JWT_SECRET=production_secure_gvh_key_2026
    depends_on:
      - mongodb
    ports:
      - "5000:5000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: gvh_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongo_data:
```

---

### 4. Nginx Reverse Proxy Configuration

```nginx
server {
    listen 80;
    server_name grandviewhotel.com pms.grandviewhotel.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name grandviewhotel.com pms.grandviewhotel.com;

    ssl_certificate /etc/letsencrypt/live/grandviewhotel.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/grandviewhotel.com/privkey.pem;

    root /var/www/hotel/frontend/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # API Proxy to Express Backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA Client Routing Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

### 5. Automated Database Backups

Daily cron job to execute non-blocking hot backups using `mongodump`:
```bash
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

mongodump --uri="mongodb://admin:password123@127.0.0.1:27017/hotel_pms?authSource=admin" --gzip --archive="$BACKUP_DIR/hotel_pms_$TIMESTAMP.gz"

# Retain last 30 days only
find "$BACKUP_DIR" -type f -name "hotel_pms_*.gz" -mtime +30 -delete
```
