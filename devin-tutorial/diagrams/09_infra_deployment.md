# Diagram 9: Production Infrastructure vs. Local Development

```mermaid
graph TD
    subgraph WrittenDesign ["Authored Production Design (Terraform & Helm)"]
        AWSVPC["AWS VPC 10.0.0.0/16 (Multi-AZ)"]
        EKS["Amazon EKS Cluster (Control Plane)<br/>web, server, brain, orchestrator pods"]
        Vault["HashiCorp Vault on EKS (Auto-unseal)"]
        SQS["AWS SQS Queue (Task distribution)"]
        EC2BareMetal["EC2 c7i.2xlarge Execution Hosts<br/>Dedicated /dev/kvm + nested virt"]
        NeonDB["Managed Postgres 16 (Neon / RDS)"]
    end

    subgraph RunningLocal ["Actually Running Environment (Local Dev)"]
        BunLocal["Bun Dev Server (Local Process)"]
        DockerCompose["Docker Compose (Postgres 16 + Redis)"]
        DryRunFC["Firecracker Manager (FIRECRACKER_DRY_RUN=true)<br/>Stubbed VM allocation, no real KVM"]
        LocalSupervisor["Local Runtime Supervisor (:8081)<br/>Runs on host directly"]
    end

    WrittenDesign -.->|"Simulated in dev via"| RunningLocal

    EKS -->|"Controls via gRPC/NLB"| EC2BareMetal
    EC2BareMetal -->|"Boots real KVM VMs"| EC2BareMetal
    EKS -->|"Queries"| NeonDB
    EKS -->|"Pushes/Pulls"| SQS
```

---

### Cloud Architecture vs. Development Emulation Explanation

A structural comparison contrasting the written production Terraform / Kubernetes architecture (EKS control plane, bare-metal C7i EC2 execution hosts, HashiCorp Vault, AWS SQS) against the local development environment (`FIRECRACKER_DRY_RUN=true`, local Bun processes, Docker Compose Postgres).

---

### What to Say While Showing This

- *"Let's talk about deployment reality versus development."*
- *"The codebase includes full Terraform for an AWS EKS control plane coupled with bare-metal EC2 C7i instances that support nested KVM virtualization."*
- *"However, for day-to-day development without expensive bare-metal AWS servers, the Firecracker daemon has a dry-run flag. In dry-run mode, it stubs out VM allocations and routes commands to a local supervisor process on your machine."*
