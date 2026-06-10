import sys
import io
import paramiko

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.76.102.116', username='root', password='&86TQtlQX7GuWqlR', timeout=30)

# Remove playwright files from server
stdin, stdout, stderr = client.exec_command('rm -rf /opt/agentcore-v3/apps/web/playwright.config.ts /opt/agentcore-v3/apps/web/tests', timeout=30)
print('Remove:', stdout.read().decode('utf-8', errors='replace').strip())

# Build web
stdin, stdout, stderr = client.exec_command(
    'cd /opt/agentcore-v3/apps/web && NEXT_PUBLIC_API_URL=https://api.agentcore.work npm run build > /tmp/web-build2.log 2>&1; echo BUILD_EXIT=$? >> /tmp/web-build2.log; tail -5 /tmp/web-build2.log',
    timeout=180
)
out = stdout.read().decode('utf-8', errors='replace').strip()
print('Build:', out)

# Restart web
stdin, stdout, stderr = client.exec_command('cd /opt/agentcore-v3 && pm2 restart agentcore-web 2>&1', timeout=30)
print('Restart:', stdout.read().decode('utf-8', errors='replace').strip())

import time
time.sleep(5)

# Check
stdin, stdout, stderr = client.exec_command('curl -s -o /dev/null -w %{http_code} http://localhost:3000/')
print('Web status:', stdout.read().decode('utf-8', errors='replace').strip())

client.close()
