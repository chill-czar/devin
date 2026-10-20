# Diagram 6: The Virtualization Boundary (Host vs. Guest)

```mermaid
graph TB
    subgraph Host ["Bare-Metal Linux Host (EC2 / KVM)"]
        FCManager["apps/firecracker Manager"]
        KVMModule["/dev/kvm (Linux Kernel KVM module)"]
        HostTAP["Host TAP Device (veth / fcnet)"]
        IPTables["Host NAT / IP Masquerade"]
        KernelBin["vmlinux Kernel Binary (Read-only)"]
        RootfsBase["Golden rootfs.ext4 (Read-only)"]
        RootfsClone["Per-VM rootfs.ext4 (COW Reflink)"]
    end

    subgraph Boundary ["Virtualization & Transport Boundary"]
        KVMInterface["KVM Hypercalls / Hardware Virtualization"]
        NetBridge["TAP Bridge / CNI ptp + tc-redirect-tap"]
    end

    subgraph Guest ["Firecracker MicroVM (Isolated Guest)"]
        GuestKernel["Guest Linux Kernel (in-memory)"]
        Init["Init Process (PID 1) cmd/runtime/main.go"]
        TmpfsMount["/workspace (12GB tmpfs in RAM)"]
        Supervisor["Runtime Supervisor (:8081 HTTP)"]
        UserShell["Subprocesses (sh, git, node, python)<br/>SysProcAttr: Setpgid=true"]
    end

    FCManager -->|"ioctl()"| KVMModule
    KVMModule -->|"Loads"| KernelBin
    KVMModule -->|"Mounts"| RootfsClone
    KVMModule === KVMInterface === GuestKernel

    FCManager -->|"Sets up"| HostTAP
    HostTAP -->|"Routes via"| IPTables
    HostTAP === NetBridge === Supervisor

    GuestKernel -->|"Starts PID 1"| Init
    Init -->|"Mounts pseudo-filesystems"| TmpfsMount
    Init -->|"Spawns"| Supervisor
    Supervisor -->|"Executes with timeout"| UserShell
```

---

### Hardware Boundary & Isolation Mechanics Explanation

An architectural breakdown of the virtualization boundary separating the bare-metal Linux host from the guest sandbox. It details the roles of the host KVM kernel module, uncompressed `vmlinux` binary, copy-on-write `rootfs.ext4`, the PID 1 `devin-runtime-supervisor` init process, and the 12 GB in-memory `tmpfs` workspace.

---

### What to Say While Showing This

- *"Here is what makes MicroVMs different from Docker containers."*
- *"In Docker, the container shares the host kernel. If a malicious script triggers a kernel exploit, it can compromise the entire host."*
- *"In Devin, each sandbox runs its own dedicated Linux kernel binary via `/dev/kvm`. Even if a user command gets root inside the guest, it is trapped inside its own hardware-isolated memory space."*
- *"Inside the guest, our custom Go binary is PID 1. It mounts a 12-gigabyte tmpfs in RAM for lightning-fast builds without thrashing host disks."*
