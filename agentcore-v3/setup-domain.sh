#!/bin/bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[$1]${NC} $2"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONF_FILE="${SCRIPT_DIR}/nginx/agentcore.work.conf"
TARGET="/etc/nginx/sites-available/agentcore.work"

echo ""
echo "============================================"
echo "  AgentCore v3 — Domain & Nginx Setup"
echo "============================================"
echo ""

# 1. Install nginx
log "1/6" "Checking nginx..."
if command -v nginx &>/dev/null; then
    log "1/6" "nginx $(nginx -v 2>&1 | cut -d/ -f2) already installed"
else
    log "1/6" "Installing nginx..."
    apt update -qq && apt install -y nginx
fi

# 2. Copy nginx config
log "2/6" "Deploying nginx config..."
if [ ! -f "$CONF_FILE" ]; then
    err "Config file not found: $CONF_FILE"
fi

cp "$CONF_FILE" "$TARGET"
ln -sf "$TARGET" /etc/nginx/sites-enabled/agentcore.work

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# 3. Create log directories
log "3/6" "Setting up log directories..."
mkdir -p /var/log/agentcore
chown www-data:www-data /var/log/agentcore 2>/dev/null || true

# 4. Test and reload nginx
log "4/6" "Testing nginx config..."
if nginx -t 2>&1; then
    systemctl reload nginx || systemctl restart nginx
    log "4/6" "nginx reloaded successfully"
else
    err "nginx config test failed — aborting"
fi

# 5. Certbot / SSL
log "5/6" "SSL setup..."
if command -v certbot &>/dev/null; then
    log "5/6" "certbot found"
else
    log "5/6" "Installing certbot..."
    apt install -y certbot python3-certbot-nginx
fi

echo ""
echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}  DNS must be pointing to this server.${NC}"
echo -e "${YELLOW}  After confirming DNS, run:${NC}"
echo ""
echo -e "  ${GREEN}certbot --nginx -d agentcore.work -d www.agentcore.work -d api.agentcore.work${NC}"
echo ""
echo -e "${YELLOW}============================================${NC}"
echo ""

# Add certbot auto-renewal cron
log "5a/6" "Adding certbot renewal cron..."
(crontab -l 2>/dev/null; echo "0 12 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

# 6. Rebuild frontend
log "6/6" "Rebuilding frontend..."
cd "${SCRIPT_DIR}/apps/web"

if [ -f package.json ]; then
    npm run build
    log "6/6" "Frontend build complete"
else
    warn "apps/web/package.json not found — skipping build"
fi

cd "$SCRIPT_DIR"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Done! Next steps:${NC}"
echo ""
echo "  1. Set up DNS A records for agentcore.work, www.agentcore.work, api.agentcore.work"
echo "  2. Run certbot for SSL:"
echo "     certbot --nginx -d agentcore.work -d www.agentcore.work -d api.agentcore.work"
echo "  3. Start app with PM2:"
echo "     pm2 start ecosystem.config.js"
echo "     pm2 save && pm2 startup"
echo ""
echo "  After SSL, open: https://agentcore.work"
echo -e "${GREEN}============================================${NC}"
