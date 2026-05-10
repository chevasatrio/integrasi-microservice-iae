# bin/sh
# UserService/docker-entrypoint.sh

set -e

echo "=== UserService Starting ==="

# Generate app key jika belum ada
php artisan key:generate --no-interaction --force 2>/dev/null || true

# Tunggu MySQL siap
echo "Menunggu database..."
until php artisan db:show > /dev/null 2>&1; do
    echo "Database belum siap, menunggu 2 detik..."
    sleep 2
done

# Jalankan migrasi
echo "Menjalankan migrasi..."
php artisan migrate --force --no-interaction

echo "=== UserService Siap ==="

exec "$@"