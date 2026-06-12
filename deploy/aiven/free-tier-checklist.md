# Aiven Free Tier Checklist

This checklist is documentation only. Do not create services before explicit PO approval.

## Target Services

- Aiven for MySQL: primary relational database for FlowCore staging.
- Aiven for Valkey: Redis-compatible cache, queue, session and Reverb scaling backend.

## Requirements Before Creation

- Confirm the Aiven organization/account to use.
- Confirm free-tier availability for MySQL and Valkey in the selected account.
- Confirm acceptable region constraints; free tier may not allow choosing a specific cloud provider or region.
- Confirm demo data reset policy.
- Confirm who owns credentials and where secrets will be stored.

## MySQL Variables To Export

```text
DB_CONNECTION=mysql
DB_HOST=<aiven-mysql-host>
DB_PORT=<aiven-mysql-port>
DB_DATABASE=<database-name>
DB_USERNAME=<database-user>
DB_PASSWORD=<secret>
```

## Valkey Variables To Export

```text
REDIS_CLIENT=phpredis
REDIS_HOST=<aiven-valkey-host>
REDIS_PORT=<aiven-valkey-port>
REDIS_PASSWORD=<secret>
SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
```

## Resettable Demo Procedure

```powershell
php artisan migrate:fresh --force
php artisan db:seed --force
```

Run only against the approved staging database. Never run this against production or a shared non-resettable database.
