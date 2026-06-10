import sys
import io
import paramiko

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.76.102.116', username='root', password='&86TQtlQX7GuWqlR', timeout=30)

stdin, stdout, stderr = client.exec_command(
    'curl -s -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" -d \'{"name":"Test User","email":"test@agentcore.work","password":"test12345","companyName":"Test","companySize":"1","industry":"Технологии","source":"manual","purpose":"sales"}\'',
    timeout=30
)
print('Register:', stdout.read().decode('utf-8', errors='replace').strip())

client.close()
