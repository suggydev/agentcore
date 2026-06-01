# DevOps-структура AgentCore v3

## Текущая инфраструктура

| Компонент | Статус |
|-----------|--------|
| VDS | Ubuntu 24.04, 2 CPU / 4GB RAM / 60GB SSD |
| Веб-сервер | Nginx 1.24 + Let's Encrypt SSL |
| Process Manager | PM2 (systemd авто-старт) |
| База данных | PostgreSQL 16 (Docker) |
| API | Express.js :4000 |
| Frontend | Next.js 14 :3000 |

## Готовность к масштабированию

Проект готов к переходу на multi-VDS архитектуру:

1. **Stateless API** — все состояние в PostgreSQL, можно запускать N инстансов за балансировщиком
2. **PM2 cluster mode** — `ecosystem.config.js` поддерживает `instances: 'max'`
3. **Docker-образы** — каждый сервис можно упаковать в Docker
4. **Nginx upstream** — конфиг поддерживает несколько backend-серверов
5. **Переменные окружения** — Zod-валидация, легко переносить между средами

## План масштабирования (при росте)

```
Этап 1 (сейчас):     1 VDS (всё на одном сервере)
Этап 2 (50+ клиентов): 2 VDS (API отдельно, Web отдельно)
Этап 3 (500+):         K8s кластер + managed PostgreSQL + Redis кэш
```

## Мониторинг (рекомендации к подключению)

```bash
# Prometheus + Grafana
# PM2 metrics: pm2 install pm2-prometheus
# Nginx access log → Promtail → Loki → Grafana
```

## Бекапы

```bash
# PostgreSQL ежедневный бекап
pg_dump agentcore > /backups/agentcore_$(date +%Y%m%d).sql

# Добавить в crontab:
# 0 3 * * * pg_dump agentcore > /backups/agentcore_$(date +%Y%m%d).sql
```
