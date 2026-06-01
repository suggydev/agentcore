"""
Quick Deploy - API only + frontend in background
"""
import paramiko
import os
import time
import sys

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
except ImportError:
    pass

HOST = '31.76.102.116'
USER = 'root'
PASS = os.environ['SERVER_PASS']
SERVER = '/opt/agentcore-v3'
LOCAL = r'C:\Users\mtsbo\OneDrive\Документы\AgentCore\agentcore-v3'

LOCAL_API = os.path.join(LOCAL, 'apps', 'api')
LOCAL_PRISMA = os.path.join(LOCAL, 'packages', 'prisma')

print("=" * 60)
print("AgentCore API Deploy")
print("=" * 60)

# Connect
print("\n[1] Connecting...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15, allow_agent=False, look_for_keys=False)
sftp = ssh.open_sftp()

# Upload API files
print("[2] Uploading API files...")
def upload_dir(local_path, remote_path):
    for item in os.listdir(local_path):
        local_item = os.path.join(local_path, item)
        remote_item = f"{remote_path}/{item}"
        if os.path.isfile(local_item):
            try:
                sftp.put(local_item, remote_item)
                print(f"  {item}")
            except Exception as e:
                print(f"  SKIP {item}: {e}")
        elif os.path.isdir(local_item) and item != 'node_modules':
            try:
                sftp.mkdir(remote_item)
            except:
                pass
            upload_dir(local_item, remote_item)

upload_dir(LOCAL_API, f'{SERVER}/apps/api')

# Upload Prisma schema
print("[3] Uploading Prisma schema...")
sftp.put(os.path.join(LOCAL_PRISMA, 'schema.prisma'), f'{SERVER}/packages/prisma/schema.prisma')

# Generate Prisma & install API deps
print("[4] Setting up backend...")
def run(cmd, timeout=60):
    try:
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        if out: print(f"  {out[:500]}")
        if err: print(f"  ERR: {err[:500]}")
        return out
    except Exception as e:
        print(f"  TIMEOUT/ERR: {e}")
        return ""

run(f'cd {SERVER}/apps/api && npm install 2>&1 | tail -3')
run(f'cd {SERVER}/packages/prisma && npx prisma generate')
run(f'cd {SERVER}/packages/prisma && npx prisma db push --accept-data-loss')

# Restart API
print("[5] Restarting API...")
run('pkill -f "node server.js" || true')
time.sleep(1)
run(f'cd {SERVER}/apps/api && nohup node server.js > /var/log/agentcore-api.log 2>&1 &')
time.sleep(2)

# Verify
print("[6] Verifying...")
stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:4000/api/health')
health = stdout.read().decode().strip()
print(f"  Health: {health[:200] if health else 'NO RESPONSE'}")

stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:4000/api/billing/trial-status -H "Authorization: Bearer test"')
print(f"  Trial: {stdout.read().decode().strip()[:200]}")

print("\n" + "=" * 60)
print("API DEPLOY COMPLETE")
print("=" * 60)

# Upload all frontend files (non-node_modules)
print("\n[7] Uploading frontend files (background)...")
def upload_web():
    LOCAL_WEB = os.path.join(LOCAL, 'apps', 'web', 'src')
    for root, dirs, files in os.walk(LOCAL_WEB):
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for f in files:
            if f == 'node_modules':
                continue
            local_f = os.path.join(root, f)
            remote_f = f'{SERVER}/apps/web/src/{os.path.relpath(local_f, LOCAL_WEB)}'
            remote_dir = os.path.dirname(remote_f)
            try:
                sftp.stat(remote_dir)
            except:
                try:
                    # Creating dirs recursively
                    parts = remote_dir.replace(SERVER + '/apps/web/src/', '').split('/')
                    path = f'{SERVER}/apps/web/src'
                    for p in parts:
                        path += f'/{p}'
                        try:
                            sftp.mkdir(path)
                        except:
                            pass
                except:
                    pass
            try:
                sftp.put(local_f, remote_f)
            except:
                pass
    print("  Frontend source uploaded")

upload_web()

# Upload package.json + configs for web
for f in ['package.json', 'next.config.js', 'tailwind.config.js', 'postcss.config.js', 'tsconfig.json', 'globals.css']:
    local_f = os.path.join(LOCAL, 'apps', 'web', f if f != 'globals.css' else 'src/app/globals.css')
    remote_f = f'{SERVER}/apps/web/{f}' if f != 'globals.css' else f'{SERVER}/apps/web/src/app/globals.css'
    try:
        sftp.put(local_f, remote_f)
        print(f"  {f}")
    except Exception as e:
        print(f"  SKIP {f}: {e}")

# Build frontend in background
print("[8] Building frontend in background...")
ssh.exec_command(f'cd {SERVER}/apps/web && npm install 2>&1 | tail -3 && nohup sh -c "npx next build 2>&1 | tail -20 && pkill -f next-server && cd {SERVER}/apps/web && nohup npx next start -p 3000 > /var/log/agentcore-web.log 2>&1 &" > /var/log/agentcore-build.log 2>&1 &')
print("  Build started in background (check /var/log/agentcore-build.log)")

sftp.close()
ssh.close()

print("\n✅ Deploy complete!")
print(f"   API: http://{HOST}:4000/api/health")
print(f"   Web: http://{HOST}:3000 (building...)")
print(f"   Check build: ssh root@{HOST} 'tail -20 /var/log/agentcore-build.log'")
