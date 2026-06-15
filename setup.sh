#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Auto Setup - AbsenKu             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Helper: confirm action
confirm() {
  echo -en "${YELLOW}$1 (y/N): ${NC}"
  read -r ans
  [[ "$ans" == "y" || "$ans" == "Y" ]]
}

# =====================================================
# 1. GITHUB
# =====================================================
echo -e "\n${CYAN}══════════════════════════════════════${NC}"
echo -e "${CYAN}  [1/3] GitHub Repository${NC}"
echo -e "${CYAN}══════════════════════════════════════${NC}"

if confirm "Buat repo GitHub & push code?"; then
  echo -n "Nama repository (default: absen-pegawai): "
  read -r REPO_NAME
  REPO_NAME="${REPO_NAME:-absen-pegawai}"

  echo -n "GitHub username: "
  read -r GITHUB_USER

  echo -n "GitHub Personal Access Token (classic, repo scope): "
  read -rs GITHUB_TOKEN
  echo ""

  # Create repo via GitHub API
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -u "$GITHUB_USER:$GITHUB_TOKEN" \
    https://api.github.com/user/repos \
    -d "{\"name\":\"$REPO_NAME\",\"private\":false}" 2>/dev/null || echo "000")

  if [[ "$STATUS" == "201" ]] || [[ "$STATUS" == "422" ]]; then
    echo -e "${GREEN}✓ Repo $REPO_NAME siap${NC}"
  else
    echo -e "${RED}✗ Gagal buat repo (HTTP $STATUS). Cek token/username.${NC}"
    exit 1
  fi

  # Init git if needed
  if [ ! -d .git ]; then
    git init
    git branch -M main
  fi

  # Create .gitignore if not exists
  if [ ! -f .gitignore ]; then
    cat > .gitignore << 'EOF'
node_modules/
.next/
.env.local
*.local
EOF
  fi

  git remote remove origin 2>/dev/null || true
  git remote add origin "https://$GITHUB_USER:$GITHUB_TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git"

  git add -A
  git commit -m "Initial commit: AbsenKu - Sistem Manajemen Kehadiran" 2>/dev/null || true
  git push -u origin main 2>&1

  echo -e "${GREEN}✓ Push ke GitHub berhasil${NC}"
fi

# =====================================================
# 2. SUPABASE
# =====================================================
echo -e "\n${CYAN}══════════════════════════════════════${NC}"
echo -e "${CYAN}  [2/3] Supabase Database${NC}"
echo -e "${CYAN}══════════════════════════════════════${NC}"

if confirm "Setup Supabase database?"; then
  # Check supabase CLI
  SUPABASE_CLI=""
  for cmd in supabase npx; do
    if command -v "$cmd" &>/dev/null; then
      SUPABASE_CLI="$cmd"
      break
    fi
  done

  if [ "$SUPABASE_CLI" == "npx" ]; then
    SUPABASE_CMD="npx supabase"
  else
    SUPABASE_CMD="supabase"
  fi

  # Login to Supabase (browser-based or token)
  echo -e "${YELLOW}Login ke Supabase (buka browser jika diminta)...${NC}"
  $SUPABASE_CMD login 2>&1 || {
    echo -e "${YELLOW}Atau masukkan access token: https://supabase.com/dashboard/account/tokens${NC}"
    echo -n "Supabase Access Token: "
    read -rs SUPABASE_TOKEN
    echo ""
    echo "$SUPABASE_TOKEN" | $SUPABASE_CMD login --token-stdin 2>&1 || true
  }

  echo -n "\nSupabase Project Ref (lihat di Settings > General): "
  read -r PROJECT_REF

  echo -n "Supabase Database Password: "
  read -rs DB_PASSWORD
  echo ""

  # Link project
  $SUPABASE_CMD link --project-ref "$PROJECT_REF" --password "$DB_PASSWORD" 2>&1 || {
    echo -e "${YELLOW}Link manual via dashboard? Lanjutkan upload SQL langsung...${NC}"
  }

  # Create migration
  mkdir -p supabase/migrations

  # Run SQL migrations
  echo -e "${YELLOW}Menjalankan schema.sql...${NC}"
  if command -v psql &>/dev/null; then
    # Direct DB connection
    echo -n "Supabase DB Host (contoh: db.xxxxx.supabase.co): "
    read -r DB_HOST
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U postgres -d postgres -f supabase/schema.sql 2>&1 | tail -3
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U postgres -d postgres -f supabase/rls.sql 2>&1 | tail -3
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U postgres -d postgres -f supabase/seed.sql 2>&1 | tail -3
    echo -e "${GREEN}✓ Database setup via psql selesai${NC}"
  else
    echo -e "${YELLOW}psql tidak tersedia. Jalankan SQL manual:${NC}"
    echo "  1. Buka https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
    echo "  2. Copy-paste isi supabase/schema.sql"
    echo "  3. Copy-paste isi supabase/rls.sql"
    echo "  4. Copy-paste isi supabase/seed.sql"
  fi

  # Get API keys
  echo -e "\n${CYAN}URL & Key dari Supabase Dashboard:${NC}"
  echo ""
  echo -n "NEXT_PUBLIC_SUPABASE_URL (https://xxxxx.supabase.co): "
  read -r SUPABASE_URL
  echo -n "NEXT_PUBLIC_SUPABASE_ANON_KEY (anon public): "
  read -r SUPABASE_ANON_KEY
fi

# =====================================================
# 3. VERCEL
# =====================================================
echo -e "\n${CYAN}══════════════════════════════════════${NC}"
echo -e "${CYAN}  [3/3] Vercel Deployment${NC}"
echo -e "${CYAN}══════════════════════════════════════${NC}"

if confirm "Deploy ke Vercel?"; then
  # Check vercel CLI
  VERCEL_CMD=""
  for cmd in vercel npx; do
    if command -v "$cmd" &>/dev/null; then
      VERCEL_CMD="$cmd"
      break
    fi
  done

  if [ "$VERCEL_CMD" == "npx" ]; then
    VERCEL_CMD="npx vercel"
  fi

  # Login
  echo -e "${YELLOW}Login ke Vercel (buka browser jika diminta)...${NC}"
  $VERCEL_CMD login 2>&1 || true

  # Deploy
  echo -e "${YELLOW}Deploy ke Vercel...${NC}"
  $VERCEL_CMD --prod --yes 2>&1

  # Set env vars
  echo -e "${YELLOW}Set environment variables...${NC}"
  echo "$SUPABASE_URL" | $VERCEL_CMD env add NEXT_PUBLIC_SUPABASE_URL production 2>&1 || true
  echo "$SUPABASE_ANON_KEY" | $VERCEL_CMD env add NEXT_PUBLIC_SUPABASE_ANON_KEY production 2>&1 || true

  # Redeploy with env vars
  $VERCEL_CMD --prod --yes 2>&1

  # Get URL
  echo -e "\n${GREEN}========================================${NC}"
  echo -e "${GREEN}  ✅ DEPLOY BERHASIL!${NC}"
  echo -e "${GREEN}========================================${NC}"
  $VERCEL_CMD ls 2>&1 | tail -5
fi

# =====================================================
# FINAL INSTRUCTIONS
# =====================================================
echo -e "\n${CYAN}══════════════════════════════════════${NC}"
echo -e "${CYAN}  POST-SETUP INSTRUCTIONS${NC}"
echo -e "${CYAN}══════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}1. Buat Admin User (via Supabase Dashboard):${NC}"
echo "   a. Buka https://supabase.com/dashboard/project/$PROJECT_REF/auth/users"
echo "   b. Klik 'Invite user' atau 'Add user'"
echo "   c. Email: admin@example.com, Password: (buat sendiri)"
echo ""
echo -e "${YELLOW}2. Insert profile ke tabel users (SQL Editor):${NC}"
echo "   INSERT INTO users (id, email, full_name, role)"
echo "   VALUES ("
echo "     '<UUID_dari_auth_users>',"
echo "     'admin@example.com',"
echo "     'Administrator',"
echo "     'grand_admin'"
echo "   );"
echo ""
echo -e "${YELLOW}3. Buat Petugas User (opsional):${NC}"
echo "   INSERT INTO users (id, email, full_name, role)"
echo "   VALUES ("
echo "     '<UUID_dari_auth_users>',"
echo "     'petugas@example.com',"
echo "     'Petugas Absensi',"
echo "     'petugas'"
echo "   );"
echo ""
echo -e "${GREEN}Selamat! Aplikasi AbsenKu sudah live! 🎉${NC}"
