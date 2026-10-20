#!/usr/bin/env bash
set -euo pipefail

echo "[container] Installing system packages..."
apt-get update -qq
apt-get install -y -qq curl jq iproute2 iptables >/dev/null

echo "[container] Installing CNI..."
mkdir -p /opt/cni/bin /etc/cni/conf.d
cp -r /tmp/cni-plugins/* /opt/cni/bin/
chmod 755 /opt/cni/bin/*
cp /app/apps/firecracker/config/cni/fcnet.conflist /etc/cni/conf.d/
cp /app/apps/firecracker/config/cni/resolv.conf /etc/cni/

echo "[container] Running build-firecracker-snapshot.sh..."
export FIRECRACKER_SNAPSHOT_DIR="/tmp/devin-snapshots"
export FIRECRACKER_KERNEL_PATH="/tmp/vmlinux.bin"
export FIRECRACKER_BIN="/usr/local/bin/firecracker"
export SNAPSHOT_CNI_BIN="/app/apps/firecracker/bin/snapshot-cni"

/app/scripts/build-firecracker-snapshot.sh node

echo "[container] Snapshot creation finished successfully!"
