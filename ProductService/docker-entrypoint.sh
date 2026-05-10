#!/bin/bash
# ProductService/docker-entrypoint.sh

set -e

echo "=== ProductService Starting ==="

php artisan key:generate --no-interaction --force 2>/dev/null || true

echo "Menunggu database..."
until php artisan db:show > /dev/null 2>&1; do
    echo "Database belum siap..."
    sleep 2
done

echo "Menjalankan migrasi..."
php artisan migrate --force --no-interaction

echo "=== ProductService Siap ==="

exec "$@"