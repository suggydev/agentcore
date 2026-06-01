#!/bin/bash
set -e

echo "=== AgentCore v3 Domain Setup ==="
echo ""

# 1. Install nginx if missing
if ! command -v nginx &> /dev/null; then
    echo "[1/5] Installing nginx..."
    apt update && apt install -y nginx
else
    echo "[1/5] nginx already installed"
fi

# 2. Copy nginx config
echo "[2/5] Deploying nginx config..."
cp nginx/agentcore.work.conf /etc/nginx/sites-available/agentcore.work
ln -sf /etc/nginx/sites-available/agentcore.work /etc/nginx/sites-enabled/agentcore.work

# 3. Test and reload nginx
echo "[3/5] Testing nginx config..."
nginx -t
systemctl reload nginx

# 4. Install certbot and get SSL
echo "[4/5] Installing certbot..."
apt install -y certbot python3-certbot-nginx

echo ""
echo "=== Run this after DNS is live: ==="
echo "  certbot --nginx -d agentcore.work -d www.agentcore.work -d api.agentcore.work"
echo ""

# 5. Rebuild frontend with domain env
echo "[5/5] Rebuilding frontend..."
cd apps/web
npm run build
cd ../..

echo ""
echo "=== Done! Restart PM2: ==="
echo "  pm2 restart all"
echo ""
echo "=== After DNS + SSL, open: ==="
echo "  https://agentcore.work"
echo "  https://api.agentcore.work/api/health"
