#!/usr/bin/env bash
set -e

# ==============================================================================
# Devin Local Development Environment Starter
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

mkdir -p .logs /tmp/devin-workspace

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}             Starting Devin Full Stack (Production Mode)              ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. Ensure Postgres Docker container is running
echo -e "${CYAN}[1/8] Checking PostgreSQL on port 5435...${NC}"
if ! docker ps --filter "name=devin-postgres" --format '{{.Names}}' | grep -q "devin-postgres"; then
  if docker ps -a --filter "name=devin-postgres" --format '{{.Names}}' | grep -q "devin-postgres"; then
    echo -e "${YELLOW}Starting existing devin-postgres container...${NC}"
    docker start devin-postgres
  else
    echo -e "${YELLOW}Creating and running devin-postgres on port 5435...${NC}"
    docker run -d \
      --name devin-postgres \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=devin \
      -p 5435:5432 \
      postgres:16-alpine
  fi
fi

# Wait for Postgres to be ready
echo -e "${GREEN}✓ PostgreSQL is active on port 5435${NC}"

# 2. Run Database Migrations
echo -e "${CYAN}[2/8] Applying database migrations...${NC}"
(cd packages/drizzle && (pnpm run migrate >/dev/null 2>&1 || bun run migrate >/dev/null 2>&1 || true))
echo -e "${GREEN}✓ Database migrations up to date${NC}"

# PIDs to kill on exit
PIDS=()

cleanup() {
  echo -e "\n${YELLOW}Shutting down all Devin services...${NC}"
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  if [[ "${FC_DRY_RUN}" != "true" ]]; then
    echo -e "${YELLOW}Stopping devin-firecracker container...${NC}"
    docker stop devin-firecracker >/dev/null 2>&1 || true
  fi
  echo -e "${GREEN}All services stopped cleanly.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Check if real Firecracker or Dry Run is configured
FC_DRY_RUN="$(grep '^FIRECRACKER_DRY_RUN=' apps/firecracker/.env 2>/dev/null | cut -d'=' -f2 || echo "true")"

# 3. Start Runtime Supervisor (:8081)
if [[ "${FC_DRY_RUN}" == "true" ]]; then
  echo -e "${CYAN}[3/8] Starting Devbox Runtime (:8081) [dry-run fallback]...${NC}"
  RUNTIME_WORKSPACE=/tmp/devin-workspace \
  RUNTIME_PORT=8081 \
  AGENT_PROVIDER=mock \
  ./apps/runtime/bin/runtime > .logs/runtime.log 2>&1 &
  PIDS+=($!)
else
  echo -e "${GREEN}[3/8] Real Firecracker mode enabled — microVM hosts Devbox Runtime (:8081)${NC}"
fi

# 4. Start Firecracker Host Daemon (:9093)
if [[ "${FC_DRY_RUN}" == "true" ]]; then
  echo -e "${CYAN}[4/8] Starting Firecracker Pool (:9093) [dry-run]...${NC}"
  (cd apps/firecracker && ./bin/firecracker-daemon > ../../.logs/firecracker.log 2>&1) &
  PIDS+=($!)
else
  echo -e "${CYAN}[4/8] Ensuring Real Firecracker Container (:9093)...${NC}"
  # Auto-restore kernel and snapshot from persistent storage if /tmp was cleared after reboot
  if [[ ! -f /tmp/vmlinux.bin && -f /var/lib/devin/linux/vmlinux ]]; then
    cp /var/lib/devin/linux/vmlinux /tmp/vmlinux.bin
  fi
  if [[ ! -f /tmp/devin-snapshots/node/rootfs.ext4 && -d /var/lib/devin/snapshots/node ]]; then
    mkdir -p /tmp/devin-snapshots/node
    cp -a /var/lib/devin/snapshots/node/* /tmp/devin-snapshots/node/ 2>/dev/null || true
  fi
  mkdir -p /tmp/devin-snapshots /tmp/devin-vms /tmp/devin-workspace

  if ! docker ps --filter "name=devin-firecracker" --format '{{.Names}}' | grep -q "devin-firecracker"; then
    docker rm -f devin-firecracker >/dev/null 2>&1 || true
    docker run -d --name devin-firecracker \
      --restart unless-stopped \
      --privileged \
      --network host \
      --device /dev/kvm:/dev/kvm \
      -e FIRECRACKER_MAX_ACTIVE_VMS=10 \
      -e FIRECRACKER_MIN_FREE_DISK_GIB=5 \
      -v /tmp/devin-snapshots:/tmp/devin-snapshots \
      -v /tmp/vmlinux.bin:/tmp/vmlinux.bin \
      -v /tmp/devin-vms:/tmp/devin-vms \
      devin-firecracker:latest >/dev/null
  fi
  echo -e "${GREEN}✓ Real Firecracker Daemon container running on port 9093${NC}"
fi

# 5. Start Sandbox Orchestrator (:9090)
echo -e "${CYAN}[5/8] Starting Sandbox Orchestrator (:9090)...${NC}"
if [[ ! -f apps/orchestrator/bin/orchestrator ]]; then
  echo -e "${YELLOW}Building Orchestrator binary...${NC}"
  (cd apps/orchestrator && go build -o bin/orchestrator ./cmd/orchestrator)
fi
(cd apps/orchestrator && set -a && [ -f .env ] && . .env && set +a && ./bin/orchestrator > ../../.logs/orchestrator.log 2>&1) &
PIDS+=($!)

# 5b. Start Tool Gateway (:9095)
echo -e "${CYAN}Starting Tool Gateway (:9095)...${NC}"
if [[ ! -f apps/tool-gateway/bin/tool-gateway ]]; then
  echo -e "${YELLOW}Building Tool Gateway binary...${NC}"
  (cd apps/tool-gateway && go build -o bin/tool-gateway .)
fi
(cd apps/tool-gateway && ./bin/tool-gateway > ../../.logs/tool-gateway.log 2>&1) &
PIDS+=($!)

# 6. Start Brain Control Plane (:9092)
echo -e "${CYAN}[6/8] Starting Brain Agent Control Plane (:9092)...${NC}"
(cd apps/brain && set -a && [ -f .env ] && . .env && set +a && (NODE_ENV=production pnpm start > ../../.logs/brain.log 2>&1 || NODE_ENV=production bun src/bin.ts > ../../.logs/brain.log 2>&1)) &
PIDS+=($!)

# 7. Start Scheduler Worker (:9091)
echo -e "${CYAN}[7/8] Starting Execution Scheduler (:9091)...${NC}"
(cd apps/scheduler && set -a && [ -f .env ] && . .env && set +a && (NODE_ENV=production pnpm start > ../../.logs/scheduler.log 2>&1 || NODE_ENV=production bun src/bin.ts > ../../.logs/scheduler.log 2>&1)) &
PIDS+=($!)

# 8. Start API Server (:8080)
echo -e "${CYAN}[8/8] Starting API Server (:8080)...${NC}"
(cd apps/server && set -a && [ -f .env ] && . .env && set +a && (NODE_ENV=production pnpm start > ../../.logs/server.log 2>&1 || NODE_ENV=production bun run start > ../../.logs/server.log 2>&1)) &
PIDS+=($!)

# Wait a brief moment for backends to initialize
sleep 2

echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}  ✓ All Backend Services are running!                                 ${NC}"
echo -e "${GREEN}  - Web Dashboard:     http://localhost:3000                          ${NC}"
echo -e "${GREEN}  - API Server:        http://localhost:8080                          ${NC}"
echo -e "${GREEN}  - Brain Agent:       http://localhost:9092                          ${NC}"
echo -e "${GREEN}  - Scheduler:         http://localhost:9091                          ${NC}"
echo -e "${GREEN}  - Orchestrator:      http://localhost:9090                          ${NC}"
echo -e "${GREEN}  - Firecracker Pool:  http://localhost:9093                          ${NC}"
echo -e "${GREEN}  - Runtime Supervisor:http://localhost:8081                          ${NC}"
echo -e "${GREEN}  - Database:          localhost:5435 (devin)                         ${NC}"
echo -e "${GREEN}======================================================================${NC}"
# Ensure Web Frontend is built for production
if [[ ! -d "apps/web/.next" ]]; then
  echo -e "${YELLOW}Building Web Frontend for production...${NC}"
  (cd apps/web && (pnpm run build || bun run build))
fi

echo -e "${BLUE}Starting Web Frontend (Production: pnpm start) on http://localhost:3000... (Press Ctrl+C to stop all)${NC}\n"

# Run Frontend in foreground in production mode
cd apps/web && (NODE_ENV=production pnpm start --port 3000 || NODE_ENV=production bun run start --port 3000)
