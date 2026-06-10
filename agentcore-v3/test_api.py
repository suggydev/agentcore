import sys
import io
import paramiko
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.76.102.116', username='root', password='&86TQtlQX7GuWqlR', timeout=30)

email = 'test' + str(int(time.time())) + '@agentcore.work'
reg_data = '{"name":"Test","email":"' + email + '","password":"test12345","companyName":"Test","companySize":"1","industry":"Technology","source":"manual","purpose":"sales"}'
stdin, stdout, stderr = client.exec_command('curl -s -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" -d \'' + reg_data + '\'', timeout=30)
reg = stdout.read().decode('utf-8', errors='replace').strip()
print('Register:', reg)

login_data = '{"email":"' + email + '","password":"test12345"}'
stdin, stdout, stderr = client.exec_command('curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d \'' + login_data + '\'', timeout=30)
login = stdout.read().decode('utf-8', errors='replace').strip()
print('Login:', login)

client.close()
