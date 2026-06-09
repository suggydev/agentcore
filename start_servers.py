#!/usr/bin/env python3
import os
import paramiko
import sys

HOST = '31.76.102.116'
USER = 'root'
PASSWORD = os.environ.get('SERVER_PASS', '')

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=10)
    
    # Start web server
    stdin, stdout, stderr = client.exec_command('cd /opt/agentcore-v3/apps/web && pm2 start npm --name agentcore-web -- run start 2>&1')
    web_out = stdout.read().decode('utf-8', errors='replace')
    
    # Start API server
    stdin, stdout, stderr = client.exec_command('cd /opt/agentcore-v3/apps/api && pm2 start server.js --name agentcore-api 2>&1')
    api_out = stdout.read().decode('utf-8', errors='replace')
    
    # Save PM2 config
    stdin, stdout, stderr = client.exec_command('pm2 save 2>&1')
    save_out = stdout.read().decode('utf-8', errors='replace')
    
    # Write to file
    with open('C:/Users/mtsbo/OneDrive/Documents/AgentCore/deploy_result.txt', 'w', encoding='utf-8') as f:
        f.write('Web start: ' + web_out + '\n')
        f.write('API start: ' + api_out + '\n')
        f.write('PM2 save: ' + save_out + '\n')
    
    client.close()
    print('OK')

if __name__ == '__main__':
    main()
