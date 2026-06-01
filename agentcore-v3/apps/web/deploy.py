#!/usr/bin/env python3
"""
AgentCore Web — One-Click Deploy Script
========================================
Usage:
    python deploy.py

What it does:
    1. Creates a tar.gz archive of src/ + package.json + ARCHITECTURE.md
    2. Uploads it to the production server via SSH/SFTP
    3. Extracts files into /opt/agentcore-v3/apps/web
    4. Runs npm install + npm run build
    5. Kills the old Next.js process
    6. Starts the new production server on port 3000
    7. Verifies the deployment (HTTP 200 check)

Requirements:
    pip install paramiko
"""

import os
import sys
import tarfile
import time
import tempfile

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
except ImportError:
    pass

# ── CONFIGURATION ──────────────────────────────────────────────────────────
# ⚠️  Keep this file private. Do NOT commit to public repositories.
HOST = "31.76.102.116"
USER = "root"
PASS = os.environ["SERVER_PASS"]
REMOTE_DIR = "/opt/agentcore-v3/apps/web"
REMOTE_LOG = "/var/log/agentcore-web.log"
PORT = 3000

# Local paths relative to this script
LOCAL_BASE = os.path.dirname(os.path.abspath(__file__))
PATHS_TO_DEPLOY = ["src", "ARCHITECTURE.md", "package.json", "next.config.js"]

# ── HELPERS ────────────────────────────────────────────────────────────────

def create_archive():
    """Create a temporary tar.gz with the files to deploy."""
    tmp = tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False)
    with tarfile.open(tmp.name, "w:gz") as tar:
        for rel in PATHS_TO_DEPLOY:
            full = os.path.join(LOCAL_BASE, rel)
            if not os.path.exists(full):
                print(f"⚠️  Skipping missing path: {rel}")
                continue
            if os.path.isdir(full):
                for root, dirs, files in os.walk(full):
                    for f in files:
                        fp = os.path.join(root, f)
                        arcname = os.path.relpath(fp, LOCAL_BASE).replace("\\", "/")
                        tar.add(fp, arcname=arcname)
            else:
                arcname = rel.replace("\\", "/")
                tar.add(full, arcname=arcname)
    return tmp.name


def run_remote(client, cmd, timeout=300):
    """Execute a remote command and return stdout/stderr."""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    return out, err


def main():
    try:
        import paramiko
    except ImportError:
        print("❌ paramiko is not installed. Run: pip install paramiko")
        sys.exit(1)

    print("🚀 AgentCore Deploy Script")
    print(f"   Target: {USER}@{HOST}:{REMOTE_DIR}")
    print()

    # 1. Build local archive
    print("📦 Creating deployment archive...")
    archive_path = create_archive()
    archive_size = os.path.getsize(archive_path)
    print(f"   Archive: {archive_path} ({archive_size:,} bytes)")
    print()

    # 2. Connect
    print("🔌 Connecting to server...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASS, timeout=30)
    print("   Connected.")
    print()

    # 3. Upload
    print("⬆️  Uploading archive...")
    remote_archive = "/tmp/agentcore-web-deploy.tar.gz"
    sftp = client.open_sftp()
    sftp.put(archive_path, remote_archive)
    sftp.close()
    os.unlink(archive_path)
    print("   Uploaded.")
    print()

    # 4. Extract
    print("📂 Extracting files...")
    run_remote(client, f"cd {REMOTE_DIR} && tar -xzf {remote_archive} --overwrite")
    run_remote(client, f"rm -f {remote_archive}")
    print("   Extracted.")
    print()

    # 5. Install dependencies
    print("📥 Installing dependencies (npm install)...")
    out, err = run_remote(client, f"cd {REMOTE_DIR} && npm install --prefer-offline", timeout=120)
    if "ERR!" in err or "error" in err.lower():
        print("   ⚠️  npm install warnings/errors:", err[:500])
    else:
        print("   Dependencies OK.")
    print()

    # 6. Build
    print("🔨 Building production bundle (npm run build)...")
    build_log = "/tmp/agentcore-build.log"
    out, err = run_remote(
        client,
        f"cd {REMOTE_DIR} && npm run build > {build_log} 2>&1; echo \"BUILD_EXIT=$?\" >> {build_log}",
        timeout=300,
    )

    stdin, stdout, stderr = client.exec_command(f"cat {build_log}")
    log = stdout.read().decode("utf-8", errors="replace")
    print("   Last 20 lines of build log:")
    for line in log.splitlines()[-20:]:
        print(f"      {line}")

    if "BUILD_EXIT=0" not in log:
        print("\n❌ BUILD FAILED. Check the log above.")
        client.close()
        sys.exit(1)
    print("   ✅ Build successful.")
    print()

    # 7. Kill old process
    print("💀 Stopping old Next.js process...")
    run_remote(client, "pkill -f 'next-server'; pkill -f 'npm exec next start'; pkill -f 'npx next start'; sleep 2")
    out, _ = run_remote(client, "ps aux | grep -E 'next' | grep -v grep || echo 'CLEAN'")
    if "CLEAN" in out:
        print("   Old process stopped.")
    else:
        print("   ⚠️  Some processes may still be running, continuing anyway...")
    print()

    # 8. Start new process
    print("🚀 Starting new production server...")
    # Use a background command that survives SSH session close
    start_cmd = (
        f"cd {REMOTE_DIR} && "
        f"nohup npx next start -p {PORT} > {REMOTE_LOG} 2>&1 &"
    )
    run_remote(client, start_cmd, timeout=10)
    time.sleep(5)
    print()

    # 9. Verify
    print("🔍 Verifying deployment...")
    out, err = run_remote(client, f"curl -s -o /dev/null -w '%{{http_code}}' --connect-timeout 10 http://localhost:{PORT}/ || echo 'FAIL'")
    status = out.strip()

    # Check process
    out2, _ = run_remote(client, "ps aux | grep -E 'next-server' | grep -v grep | awk '{print $2, $11}'")
    print(f"   Process: {out2}")
    print(f"   HTTP status: {status}")

    if status == "200":
        print(f"\n✅ DEPLOY SUCCESSFUL — http://{HOST}:{PORT}/ is live!")
    else:
        print(f"\n⚠️  WARNING — returned HTTP {status}. Check logs: {REMOTE_LOG}")

    client.close()
    print("\n🏁 Done.")


if __name__ == "__main__":
    main()
