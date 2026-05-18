#!/bin/sh
# ✅ FIX: shebang yang benar (sebelumnya: # bin/sh — tidak valid!)
# UserService/docker-entrypoint.sh
 
set -e
 
echo "=== UserService Starting ==="
 
# Generate app key
php artisan key:generate --no-interaction --force 2>/dev/null || true
 
# ✅ FIX: Gunakan mysqladmin ping (lebih reliable dari php artisan db:show)
echo "Menunggu database user-db..."
for i in $(seq 1 30); do
    mysqladmin ping -h "${DB_HOST:-user-db}" -u "${DB_USERNAME:-root}" -p"${DB_PASSWORD:-root}" --silent 2>/dev/null && break
    echo "Percobaan $i/30 - menunggu 3 detik..."
    sleep 3
done
echo "Database siap!"
 
# Jalankan migrasi
echo "Menjalankan migrasi..."
php artisan migrate --force --no-interaction 2>/dev/null || true
 
echo "=== UserService Siap ==="
 
# ✅ Jalankan server
exec php artisan serve --host=0.0.0.0 --port=8000