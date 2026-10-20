# Diagram 10: Devin vs. Container-Based Agent Architectures

```mermaid
graph TB
    subgraph Devin ["Devin Architecture (Hardware Virtualization)"]
        D_Brain["Control Plane Brain (Remote)"]
        D_FC["Firecracker Manager + KVM"]
        D_VM["MicroVM Sandbox (Own Kernel, Own Memory)"]
        D_Daemon["boxd Guest Supervisor (PID 1)"]
        D_Security["Strong Kernel Boundary<br/>Zero Host Kernel Exploits<br/>Snapshot Resume in ~28ms"]
        
        D_Brain -->|"gRPC / HTTP"| D_FC
        D_FC -->|"Launches"| D_VM
        D_VM --> D_Daemon
        D_VM --- D_Security
    end

    subgraph Sonofanton ["Container-Based Agent Architecture (Docker / Shared Kernel)"]
        S_Agent["Agent Loop (Local / Container)"]
        S_Docker["Docker / Containerd Daemon"]
        S_Container["Docker Container Sandbox (Shared Host Kernel)"]
        S_Exec["Docker Exec / Shell Pipe"]
        S_Security["Weak Kernel Boundary<br/>Shared Host Kernel / sysfs / proc<br/>Vulnerable to Container Escapes"]
        
        S_Agent -->|"Docker API"| S_Docker
        S_Docker -->|"Spawns"| S_Container
        S_Container --> S_Exec
        S_Container --- S_Security
    end
```

---

### Architectural Contrast & Isolation Models Explanation

A side-by-side structural comparison contrasting Devin's MicroVM architecture (hardware virtualization, independent kernels, COW rootfs clones, remote Brain) against the common container-based agent pattern (Docker daemon, shared host kernel, docker exec pipes).

---

### What to Say While Showing This

- *"To wrap up our architecture review, let's contrast Devin with container-based agent architectures."*
- *"In a container-based system like Sonofanton or standard Docker agents, you spin up Docker containers. While lightweight, they share the host kernel, access `/proc` and `/sys`, and cannot safely execute untrusted kernel modules or root-level system edits."*
- *"Devin's Firecracker approach gives each agent its own genuine virtual machine with dedicated kernel and memory. You get the isolation of a full cloud VM with the sub-second speed of a container."*
