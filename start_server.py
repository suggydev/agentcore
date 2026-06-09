#!/usr/bin/env python3
import os
import paramiko

HOST = '31.76.102.116'
USER = 'root'
PASSWORD = os.environ.get('SERVER_PASS', '')

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=10)
    
    # Check PM2 status
    stdin, stdout, stderr = client.exec_command('pm2 list 2>&1 | cat')
    print('PM2 status:')
    print(stdout.read().decode('utf-8', errors='replace'))
    
    # Start the web server
    print('Starting web server...')
    stdin, stdout, stderr = client.exec_command(
        'cd /opt/agentcore-v3/apps/web && pm2 start npm --name agentcore-web -- run start 2>&1 || '
        'pm2 restart agentcore-web 2>&1 || '
        'echo "PM2 not available, trying direct start..." && '
        'nohup npm run start > /tmp/web.log 2>&1 &'
    )
    print('Start result:', stdout.read().decode('utf-8', errors='replace'))
    
    # Check if port 3000 is listening
    stdin, stdout, stderr = client.exec_command('netstat -tlnp | grep 3000 || ss -tlnp | grep 3000')
    print('Port 3000:', stdout.read().decode('utf-8', errors='replace'))
    
    client.close()

if __name__ == '__main__':
    main()
