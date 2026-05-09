#!/bin/bash

# ╔══════════════════════════════════════════════════════════╗
# ║         MICROSERVICE IAE — STOP ALL SERVICES             ║
# ║   UserService | ProductService | OrderService | UI       ║
# ╚══════════════════════════════════════════════════════════╝

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Banner ──────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║         MICROSERVICE IAE — STOPPING ALL SERVICES         ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Cek docker-compose.yml ada ──────────────────────────────
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ File docker-compose.yml tidak ditemukan!${NC}"
    echo -e "${RED}  Pastikan kamu menjalankan script ini dari folder root project.${NC}"
    exit 1
fi

# ── Tanya mode stop ─────────────────────────────────────────
echo -e "${YELLOW}Pilih mode:${NC}"
echo -e "  ${BOLD}[1]${NC} Stop saja          — container berhenti, data tetap ada"
echo -e "  ${BOLD}[2]${NC} Stop + hapus data  — container + volume database dihapus (reset total)"
echo ""
read -p "Pilihan kamu (1/2) [default: 1]: " MODE
MODE=${MODE:-1}
echo ""

# ── Jalankan stop ────────────────────────────────────────────
if [ "$MODE" == "2" ]; then
    echo -e "${RED}⚠️  Semua data database akan dihapus permanen!${NC}"
    read -p "Yakin? (y/N): " CONFIRM
    CONFIRM=${CONFIRM:-N}
    echo ""

    if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Menghentikan dan menghapus semua container + volume...${NC}"
        docker compose down -v --remove-orphans

        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}${BOLD}║  ✅ Semua container dan data berhasil dihapus.            ║${NC}"
            echo -e "${GREEN}${BOLD}║  Jalankan ./start.sh untuk memulai ulang dari awal.       ║${NC}"
            echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
        else
            echo -e "${RED}✗ Terjadi error saat menghapus. Coba jalankan manual:${NC}"
            echo -e "${RED}  docker compose down -v${NC}"
        fi
    else
        echo -e "${YELLOW}Dibatalkan. Tidak ada yang dihapus.${NC}"
    fi

else
    echo -e "${YELLOW}Menghentikan semua container (data tetap aman)...${NC}"
    docker compose down --remove-orphans

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}${BOLD}║  ✅ Semua service berhasil dihentikan.                    ║${NC}"
        echo -e "${GREEN}${BOLD}║  Data database tetap tersimpan.                           ║${NC}"
        echo -e "${GREEN}${BOLD}║  Jalankan ./start.sh untuk menghidupkan kembali.          ║${NC}"
        echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
    else
        echo -e "${RED}✗ Terjadi error. Coba jalankan manual:${NC}"
        echo -e "${RED}  docker compose down${NC}"
    fi
fi

echo ""