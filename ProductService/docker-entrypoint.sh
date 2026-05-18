#!/bin/sh
# ✅ FIX: Ganti #!/bin/bash → #!/bin/sh (Alpine tidak punya bash by default)
# ProductService/docker-entrypoint.sh
 
set -e
 
echo "=== ProductService Starting ==="
 
# Generate app key
php artisan key:generate --no-interaction --force 2>/dev/null || true
 
# ✅ FIX: Gunakan mysqladmin ping bukan php artisan db:show
echo "Menunggu database product-db..."
for i in $(seq 1 30); do
    mysqladmin ping -h "${DB_HOST:-product-db}" -u "${DB_USERNAME:-root}" -p"${DB_PASSWORD:-root}" --silent 2>/dev/null && break
    echo "Percobaan $i/30 - menunggu 3 detik..."
    sleep 3
done
echo "Database siap!"
 
# Jalankan migrasi
echo "Menjalankan migrasi..."
php artisan migrate --force --no-interaction 2>/dev/null || true
 
echo "=== ProductService Siap ==="
 
# Jalankan command yang diberikan (serve atau queue:work)
exec "$@"