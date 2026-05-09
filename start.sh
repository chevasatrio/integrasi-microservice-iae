#!/bin/bash

# ╔══════════════════════════════════════════════════════════╗
# ║         MICROSERVICE IAE — START ALL SERVICES            ║
# ║   UserService | ProductService | OrderService | UI       ║
# ╚══════════════════════════════════════════════════════════╝

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Banner ──────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║         MICROSERVICE IAE — STARTING ALL SERVICES         ║${NC}"
echo -e "${CYAN}${BOLD}║        Docker + RabbitMQ + MySQL + React UI              ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── STEP 1: Cek Docker Desktop berjalan ─────────────────────
echo -e "${YELLOW}[1/5] Memeriksa Docker Desktop...${NC}"

if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker Desktop tidak berjalan!${NC}"
    echo ""

    # Coba auto-start Docker Desktop (Windows)
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        echo -e "${YELLOW}  Mencoba membuka Docker Desktop...${NC}"
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" 2>/dev/null || \
        "/c/Program Files/Docker/Docker/Docker Desktop.exe" &>/dev/null &

        echo -e "${YELLOW}  Menunggu Docker Desktop siap (maks 60 detik)...${NC}"
        WAIT=0
        until docker info > /dev/null 2>&1; do
            sleep 3
            WAIT=$((WAIT+3))
            echo -ne "${YELLOW}  Menunggu... ${WAIT}s\r${NC}"
            if [ $WAIT -ge 60 ]; then
                echo -e "${RED}✗ Docker tidak kunjung siap. Buka Docker Desktop secara manual lalu jalankan ulang script ini.${NC}"
                exit 1
            fi
        done
    else
        echo -e "${RED}  Buka Docker Desktop terlebih dahulu, lalu jalankan ulang script ini.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Docker Desktop siap.${NC}"
echo ""

# ── STEP 2: Cek docker-compose.yml ada ──────────────────────
echo -e "${YELLOW}[2/5] Memeriksa file konfigurasi...${NC}"

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ File docker-compose.yml tidak ditemukan!${NC}"
    echo -e "${RED}  Pastikan kamu menjalankan script ini dari folder root project:${NC}"
    echo -e "${RED}  integrasi-microservice-iae/${NC}"
    exit 1
fi

echo -e "${GREEN}✓ docker-compose.yml ditemukan.${NC}"

# Cek folder service ada
SERVICES=("UserService" "ProductService" "OrderService" "UserInterface")
for svc in "${SERVICES[@]}"; do
    if [ ! -d "$svc" ]; then
        echo -e "${RED}✗ Folder $svc tidak ditemukan!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Folder $svc ditemukan.${NC}"
done
echo ""

# ── STEP 3: Hentikan container lama jika ada ────────────────
echo -e "${YELLOW}[3/5] Membersihkan container lama (jika ada)...${NC}"

RUNNING=$(docker compose ps --services --filter "status=running" 2>/dev/null | wc -l)
if [ "$RUNNING" -gt "0" ]; then
    echo -e "${YELLOW}  Ditemukan container yang masih berjalan, menghentikan...${NC}"
    docker compose down --remove-orphans 2>/dev/null
    echo -e "${GREEN}  ✓ Container lama dihentikan.${NC}"
else
    echo -e "${GREEN}  ✓ Tidak ada container lama.${NC}"
fi
echo ""

# ── STEP 4: Build & jalankan semua container ────────────────
echo -e "${YELLOW}[4/5] Build image dan menjalankan semua container...${NC}"
echo -e "${BLUE}  Proses ini membutuhkan beberapa menit pertama kali.${NC}"
echo -e "${BLUE}  Selanjutnya akan lebih cepat karena Docker cache.${NC}"
echo ""

docker compose up --build -d

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                    BUILD GAGAL!                          ║${NC}"
    echo -e "${RED}║  Jalankan perintah berikut untuk melihat detail error:   ║${NC}"
    echo -e "${RED}║                                                          ║${NC}"
    echo -e "${RED}║    docker compose logs                                   ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi

echo ""

# ── STEP 5: Tunggu semua service siap ───────────────────────
echo -e "${YELLOW}[5/5] Menunggu semua service siap...${NC}"
echo ""

wait_for_service() {
    local name=$1
    local url=$2
    local max_wait=60
    local waited=0

    echo -ne "  Menunggu ${name}..."
    until curl -s "$url" > /dev/null 2>&1; do
        sleep 2
        waited=$((waited+2))
        echo -ne "."
        if [ $waited -ge $max_wait ]; then
            echo -e " ${YELLOW}(timeout, mungkin masih loading)${NC}"
            return
        fi
    done
    echo -e " ${GREEN}✓ Siap!${NC}"
}

sleep 5  # beri waktu container start

wait_for_service "UserService"    "http://localhost:8001/api/users"
wait_for_service "ProductService" "http://localhost:8002/api/products"
wait_for_service "OrderService"   "http://localhost:8003/api/orders"
wait_for_service "UI"             "http://localhost:3000"

echo ""

# ── Tampilkan status container ───────────────────────────────
echo -e "${CYAN}${BOLD}Status Container:${NC}"
docker compose ps
echo ""

# ── Tampilkan info akses ─────────────────────────────────────
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║              ✅ SEMUA SERVICE BERJALAN!                  ║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║  🖥️  User Interface   →  http://localhost:3000            ║${NC}"
echo -e "${GREEN}${BOLD}║  👤 UserService      →  http://localhost:8001/api/users  ║${NC}"
echo -e "${GREEN}${BOLD}║  📦 ProductService   →  http://localhost:8002/api/products║${NC}"
echo -e "${GREEN}${BOLD}║  🛒 OrderService     →  http://localhost:8003/api/orders  ║${NC}"
echo -e "${GREEN}${BOLD}║  🐇 RabbitMQ UI      →  http://localhost:15672            ║${NC}"
echo -e "${GREEN}${BOLD}║     (user: guest | pass: guest)                           ║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║  📋 Lihat log semua:   docker compose logs -f             ║${NC}"
echo -e "${GREEN}${BOLD}║  📋 Lihat log worker:  docker compose logs -f product-worker║${NC}"
echo -e "${GREEN}${BOLD}║  🛑 Untuk mematikan:   ./stop.sh                          ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""