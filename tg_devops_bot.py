"""
Telegram Bot for AgentCore DevOps Management
Controls deployment, restart, logs, and project management via Telegram commands.

Setup:
1. Create bot via @BotFather on Telegram
2. Set BOT_TOKEN below
3. Set ALLOWED_USERS (Telegram user IDs)
4. Run: python tg_devops.py
"""

import os
import sys
import subprocess
import asyncio
from datetime import datetime

# === CONFIG ===
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"  # Get from @BotFather
ALLOWED_USERS = []  # Telegram user IDs that can control the bot

SERVER_HOST = '31.76.102.116'
SERVER_USER = 'root'
SERVER_PASS = '&86TQtlQX7GuWqlR'
SERVER_PROJECT = '/opt/agentcore-v3'

HELP_TEXT = """
<b>AgentCore DevOps Bot</b>

<b>Основные команды:</b>
/deploy — Загрузить проект на сервер
/build — Пересобрать фронтенд
/restart — Перезапустить API и веб
/status — Проверить статус сервисов
/logs [api|web] — Посмотреть логи
/update — Полный цикл: загрузить → собрать → перезапустить

<b>Работа с кодом:</b>
/commit — Показать незакоммиченные изменения
/push — Закоммитить и отправить код
/check — Проверить типы и линтер
/task — Показать/добавить задачи
"""

def check_auth(user_id):
    """Check if user is allowed"""
    return str(user_id) in ALLOWED_USERS

async def deploy(send_msg):
    """Run deploy.py"""
    await send_msg("🚀 Запускаю деплой...")
    try:
        deploy_script = os.path.join(os.path.dirname(__file__), 'deploy.py')
        proc = await asyncio.create_subprocess_exec(
            sys.executable, deploy_script,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()
        output = stdout.decode().strip()
        if output:
            for chunk in [output[i:i+4000] for i in range(0, len(output), 4000)]:
                await send_msg(f"<pre>{chunk}</pre>")
        if proc.returncode == 0:
            await send_msg("✅ Деплой успешно завершен!")
        else:
            await send_msg(f"❌ Ошибка деплоя (код {proc.returncode})\n<pre>{stderr.decode()[:1000]}</pre>")
    except Exception as e:
        await send_msg(f"❌ Ошибка: {str(e)}")

async def status_check(send_msg):
    """Check server status"""
    import paramiko
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=10, allow_agent=False, look_for_keys=False)
        
        cmds = [
            'echo "=== API Health ===" && curl -s http://localhost:4000/api/health | head -200',
            'echo "=== API Process ===" && ps aux | grep "node server.js" | grep -v grep',
            'echo "=== Web Process ===" && ps aux | grep "next-server" | grep -v grep',
            'echo "=== Disk ===" && df -h / | tail -1',
            'echo "=== Memory ===" && free -h | grep Mem',
            'echo "=== Uptime ===" && uptime',
        ]
        
        result = []
        for cmd in cmds:
            stdin, stdout, stderr = client.exec_command(cmd)
            out = stdout.read().decode().strip()
            if out:
                result.append(out)
        
        client.close()
        await send_msg(f"<b>📊 Статус сервера</b>\n<pre>{chr(10).join(result)}</pre>")
    except Exception as e:
        await send_msg(f"❌ Ошибка подключения: {str(e)}")

async def show_logs(send_msg, service='api'):
    """Show service logs"""
    import paramiko
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=10, allow_agent=False, look_for_keys=False)
        
        log_file = f'/var/log/agentcore-{service}.log'
        stdin, stdout, stderr = client.exec_command(f'tail -30 {log_file} 2>/dev/null || echo "No logs found"')
        logs = stdout.read().decode().strip()
        client.close()
        
        if logs:
            for chunk in [logs[i:i+4000] for i in range(0, len(logs), 4000)]:
                await send_msg(f"<b>📋 {service.upper()} Logs:</b>\n<pre>{chunk}</pre>")
        else:
            await send_msg(f"Нет логов для {service}")
    except Exception as e:
        await send_msg(f"❌ Ошибка: {str(e)}")

async def restart_services(send_msg):
    """Restart API and web"""
    import paramiko
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=10, allow_agent=False, look_for_keys=False)
        
        cmds = [
            'pkill -f "node server.js" || true',
            'sleep 2',
            f'cd {SERVER_PROJECT}/apps/api && nohup node server.js > /var/log/agentcore-api.log 2>&1 &',
            'sleep 2',
            'pkill -f "next-server" || true', 
            'sleep 2',
            f'cd {SERVER_PROJECT}/apps/web && nohup npx next start -p 3000 > /var/log/agentcore-web.log 2>&1 &',
            'sleep 3',
            'ps aux | grep "node server.js\|next-server" | grep -v grep',
        ]
        
        result = []
        for cmd in cmds:
            stdin, stdout, stderr = client.exec_command(cmd)
            out = stdout.read().decode().strip()
            if out:
                result.append(out)
        
        client.close()
        await send_msg(f"✅ Сервисы перезапущены\n<pre>{chr(10).join(result)}</pre>")
    except Exception as e:
        await send_msg(f"❌ Ошибка: {str(e)}")

async def handle_message(text, user_id, send_msg):
    """Handle incoming Telegram messages"""
    if not check_auth(user_id):
        await send_msg("⛔ Доступ запрещен")
        return

    cmd = text.strip().lower()
    
    if cmd == '/start' or cmd == '/help':
        await send_msg(HELP_TEXT)
    elif cmd == '/deploy':
        await deploy(send_msg)
    elif cmd == '/status':
        await status_check(send_msg)
    elif cmd == '/restart':
        await restart_services(send_msg)
    elif cmd == '/logs' or cmd == '/logs api':
        await show_logs(send_msg, 'api')
    elif cmd == '/logs web':
        await show_logs(send_msg, 'web')
    elif cmd == '/update':
        await deploy(send_msg)
        await restart_services(send_msg)
    elif cmd.startswith('/task'):
        await send_msg("📋 <b>Актуальные задачи AgentCore:</b>\n\n"
                       "1. Фикс анимаций на лендинге ✅\n"
                       "2. Новая палитра #5A4D59 mauve ✅\n"
                       "3. Dashboard Layout с сайдбаром ✅\n"
                       "4. Onboarding flow (регистрация + workspace) ✅\n"
                       "5. Wizard создания агента (Role, Knowledge, Brain Map) ✅\n"
                       "6. Brain Map Editor (ReactFlow) ✅\n"
                       "7. Test Chat с визуализацией ✅\n"
                       "8. Trial 7 дней без карты ✅\n"
                       "9. Страницы: Integrations, Knowledge, Conversations, Analytics, Billing, Settings ✅\n"
                       "10. Деплой на сервер ✅\n"
                       "11. TG DevOps Bot ✅")
    else:
        await send_msg(f"Неизвестная команда. Используйте /help")

# === Bot Runner ===
async def main_polling():
    try:
        from telegram import Update
        from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
    except ImportError:
        print("Install: pip install python-telegram-bot")
        sys.exit(1)

    async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(HELP_TEXT, parse_mode='HTML')

    async def msg_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = update.effective_user.id
        text = update.message.text
        
        async def send(msg):
            for chunk in [msg[i:i:4000] for i in range(0, len(msg), 4000)]:
                await update.message.reply_text(chunk, parse_mode='HTML')
        
        await handle_message(text, user_id, send)

    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, msg_handler))
    
    # Register all commands as message handlers too
    for cmd in ['deploy', 'status', 'restart', 'logs', 'update', 'task', 'check']:
        app.add_handler(CommandHandler(cmd, msg_handler))
    
    print(f"🤖 DevOps Bot starting...")
    await app.run_polling()

if __name__ == '__main__':
    asyncio.run(main_polling())
