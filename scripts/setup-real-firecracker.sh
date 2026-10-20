#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Setup Real Firecracker Environment (Kernel, CNI, Rootfs, and Golden Snapshot)
# Must be executed with sudo.
# ==============================================================================

if [[ $EUID -ne 0 ]]; then
   echo "Error: This script requires root privileges to configure CNI networking and mount loopback rootfs." >&2
   echo "Please run: sudo ./scripts/setup-real-firecracker.sh" >&2
   exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REAL_USER="${SUDO_USER:-$USER}"

echo "======================================================================"
echo "          Setting Up Real Firecracker Environment & Snapshots         "
echo "======================================================================"

# 1. Install CNI Plugins
echo -e "\n[1/6] Installing CNI Plugins to /opt/cni/bin..."
mkdir -p /opt/cni/bin /etc/cni/conf.d
if [[ -d /tmp/cni-plugins ]]; then
  cp -r /tmp/cni-plugins/* /opt/cni/bin/
  chmod 755 /opt/cni/bin/*
  echo "✓ CNI plugins installed (ptp, tc-redirect-tap, bridge, host-local, etc.)"
else
  echo "Error: /tmp/cni-plugins directory not found." >&2
  exit 1
fi

# 2. Install CNI Network Config
echo -e "\n[2/6] Installing CNI Configuration..."
cp "${ROOT}/apps/firecracker/config/cni/fcnet.conflist" /etc/cni/conf.d/fcnet.conflist
cp "${ROOT}/apps/firecracker/config/cni/resolv.conf" /etc/cni/resolv.conf
chmod 644 /etc/cni/conf.d/fcnet.conflist /etc/cni/resolv.conf
echo "✓ /etc/cni/conf.d/fcnet.conflist and /etc/cni/resolv.conf configured"

# 3. Install Linux Kernel
echo -e "\n[3/6] Installing Linux Guest Kernel..."
mkdir -p /var/lib/devin/linux
if [[ -f /tmp/vmlinux.bin ]]; then
  cp /tmp/vmlinux.bin /var/lib/devin/linux/vmlinux
  chmod 644 /var/lib/devin/linux/vmlinux
  echo "✓ Linux guest kernel installed at /var/lib/devin/linux/vmlinux"
else
  echo "Downloading Linux guest kernel..."
  curl -fsSL -o /var/lib/devin/linux/vmlinux https://s3.amazonaws.com/spec.ccfc.min/img/quickstart_guide/x86_64/kernels/vmlinux.bin
  chmod 644 /var/lib/devin/linux/vmlinux
fi

# 4. Setup Directories & Permissions
echo -e "\n[4/6] Creating Devin snapshot and VM pools under /var/lib/devin..."
mkdir -p /var/lib/devin/snapshots /var/lib/devin/vms
chown -R "${REAL_USER}:${REAL_USER}" /var/lib/devin

# Install snapshot-cni helper
if [[ -f "${ROOT}/apps/firecracker/bin/snapshot-cni" ]]; then
  install -m 755 "${ROOT}/apps/firecracker/bin/snapshot-cni" /usr/local/bin/snapshot-cni
fi

# 5. Build or Copy Rootfs
echo -e "\n[5/6] Preparing ext4 rootfs image for 'node' runtime..."
mkdir -p /var/lib/devin/snapshots/node
if [[ -f /tmp/devin-snapshots/node/rootfs.ext4 ]]; then
  echo "Using pre-built rootfs from /tmp/devin-snapshots/node/rootfs.ext4..."
  cp /tmp/devin-snapshots/node/rootfs.ext4 /var/lib/devin/snapshots/node/rootfs.ext4
else
  export FIRECRACKER_SNAPSHOT_DIR="/var/lib/devin/snapshots"
  "${ROOT}/scripts/build-firecracker-rootfs.sh" node devin-runtime-node:latest
fi

# 6. Boot Firecracker MicroVM and Create Golden Snapshot
echo -e "\n[6/6] Booting Firecracker microVM and capturing snapshot..."
"${ROOT}/scripts/build-firecracker-snapshot.sh" node

# Fix file permissions so local processes can read/write VM dirs
chown -R "${REAL_USER}:${REAL_USER}" /var/lib/devin

echo -e "\n======================================================================"
echo "  ✓ Real Firecracker environment is ready!                           "
echo "  - Kernel:   /var/lib/devin/linux/vmlinux                           "
echo "  - CNI:      /opt/cni/bin and /etc/cni/conf.d/fcnet.conflist         "
echo "  - Snapshot: /var/lib/devin/snapshots/node/                         "
echo "======================================================================"
