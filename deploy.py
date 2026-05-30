"""
AgentCore Deployment Script
Sync local project to server, install deps, rebuild, restart.
"""
import paramiko
import os
import tarfile
import io
import time

HOST = '31.76.102.116'
USER = 'root'
PASS = '&86TQtlQX7GuWqlR'
SERVER_PROJECT = '/opt/agentcore-v3'

LOCAL_PROJECT = r'C:\Users\mtsbo\OneDrive\Документы\AgentCore\agentcore-v3'

EXCLUDE_DIRS = {'node_modules', '.next', '.turbo', '.git', 'dist'}
EXCLUDE_FILES = {'.DS_Store', 'Thumbs.db'}

def create_tarball():
    """Create tarball of project without node_modules/.next"""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode='w:gz') as tar:
        for root, dirs, files in os.walk(LOCAL_PROJECT):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for file in files:
                if file in EXCLUDE_FILES:
                    continue
                full_path = os.path.join(root, file)
                arcname = os.path.relpath(full_path, LOCAL_PROJECT)
                tar.add(full_path, arcname=arcname)
    buf.seek(0)
    return buf

def run_ssh(client, cmd):
    print(f"  $ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        for line in out.split('\n')[:20]:
            print(f"    {line}")
    if err:
        for line in err.split('\n')[:5]:
            print(f"    ERR: {line}")
    return out, err

def main():
    print("=" * 60)
    print("AgentCore Deploy")
    print(f"Target: {HOST}:{SERVER_PROJECT}")
    print("=" * 60)

    # Connect
    print("\n[1/6] Connecting to server...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=15, allow_agent=False, look_for_keys=False)
    
    sftp = ssh.open_sftp()
    
    # Create tarball
    print("[2/6] Creating project archive...")
    tar_data = create_tarball()
    tar_size_mb = len(tar_data.getvalue()) / 1024 / 1024
    print(f"  Archive size: {tar_size_mb:.1f} MB")
    
    # Upload
    print("[3/6] Uploading to server...")
    sftp.putfo(tar_data, f'{SERVER_PROJECT}/deploy.tar.gz')
    print("  Upload complete")
    
    # Extract and install
    print("[4/6] Installing dependencies...")
    cmds = [
        f'cd {SERVER_PROJECT} && tar -xzf deploy.tar.gz --overwrite',
        f'cd {SERVER_PROJECT}/apps/api && npm install --production 2>&1 | tail -3',
        f'cd {SERVER_PROJECT}/apps/web && npm install 2>&1 | tail -3',
    ]
    for cmd in cmds:
        run_ssh(ssh, cmd)
    
    # Build frontend
    print("[5/6] Building frontend...")
    run_ssh(ssh, f'cd {SERVER_PROJECT}/apps/web && npx next build 2>&1 | tail -10')
    
    # Restart services
    print("[6/6] Restarting services...")
    # Kill old processes and restart
    restart_cmds = [
        # Kill old API
        'pkill -f "node server.js" -e || true',
        'sleep 1',
        # Start API
        f'cd {SERVER_PROJECT}/apps/api && nohup node server.js > /var/log/agentcore-api.log 2>&1 &',
        'sleep 2',
        # Kill old Next.js 
        'pkill -f "next-server" -e || true',
        'sleep 1',
        # Start Next.js
        f'cd {SERVER_PROJECT}/apps/web && nohup npx next start -p 3000 > /var/log/agentcore-web.log 2>&1 &',
        'sleep 3',
        # Verify
        'ps aux | grep "node server.js" | grep -v grep',
        'ps aux | grep "next-server" | grep -v grep',
        'curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health',
        'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000',
    ]
    for cmd in restart_cmds:
        run_ssh(ssh, cmd)
    
    # Cleanup
    run_ssh(ssh, f'rm {SERVER_PROJECT}/deploy.tar.gz')
    
    print("\n" + "=" * 60)
    print("DEPLOY COMPLETE")
    print(f"API:  http://{HOST}:4000/api/health")
    print(f"Web:  http://{HOST}:3000")
    print("=" * 60)
    
    sftp.close()
    ssh.close()

if __name__ == '__main__':
    main()
