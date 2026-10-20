# Devin

Autonomous AI software engineering agent with hardware-isolated Firecracker MicroVM execution sandboxes.

[![Go](https://img.shields.io/badge/Go-1.24-blue.svg)](https://go.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Firecracker](https://img.shields.io/badge/Firecracker-v1.15-orange.svg)](https://firecracker-microvm.github.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Overview

Allowing autonomous AI agents to execute code on behalf of users introduces severe security risks: container escapes, host resource exhaustion, and credential leakage. Devin solves this by running every task inside a dedicated, hardware-virtualized Linux KVM Firecracker MicroVM. It pairs a multi-turn ReAct orchestration loop with a custom Go control plane and in-guest supervisor communicating over `AF_VSOCK` to deliver sub-second sandbox boots and safe code execution without exposing network attack surfaces.

<!-- TODO: add interactive agent task execution GIF / architecture diagram here -->

## Key Features

- **Hardware-Isolated MicroVM Sandboxes:** Provisions ephemeral Firecracker MicroVMs via Linux KVM with uncompressed kernels and ext4 rootfs overlays.
- **Sub-Second Cold Boot:** Snapshot resume and rootfs cloning delivering ready-to-execute sandboxes in **1062 ms p50** with **sub-30 ms teardown**.
- **Host–Guest `AF_VSOCK` Transport:** Custom in-guest Go supervisor (`boxd`) executing commands, file operations, and SSE stdout streaming without open SSH ports.
- **Autonomous ReAct Planning Loop:** Multi-step reasoning loop supporting tool calling, deadline management, and context compaction at 24 conversation turns.
- **Surgical Workspace Editing:** In-guest ripgrep pattern matching, structured file replacements, and automated Git branch and commit generation.
- **Pre-Emptive Hallucination Defense:** Seeds the actual repository file tree into the agent's initial prompt, preventing hallucinated paths on unfamiliar project layouts.
- **Process Group Timeout Enforcement:** Sub-millisecond execution timeout precision terminating runaway processes via Linux process groups.
- **Dynamic Host Recovery:** Startup orphan process sweeper and automated rootfs clone retries with garbage collection upon host `ENOSPC` conditions.

## Architecture

Devin splits orchestration from execution. The TypeScript Brain harness manages the LLM planning loop and dispatches tool requests. The Go Firecracker Manager interacts directly with the Linux KVM hypervisor over Unix domain sockets to spin up MicroVMs. Inside each MicroVM, a lightweight supervisor daemon (`boxd`) communicates bidirectionally with the host via `AF_VSOCK`, executing commands inside the guest filesystem.

```mermaid
flowchart TD
    User["Developer / Web Client"]
    Server["Express API Server (:8080)"]
    Brain["Brain Harness (ReAct Loop)"]
    ToolGW["Tool Gateway (gRPC / HTTP)"]
    FCManager["Firecracker Manager (Go Daemon :8080)"]
    KVM["Linux KVM Hypervisor (/dev/kvm)"]
    MicroVM["Firecracker MicroVM (Guest)"]
    Boxd["boxd (In-Guest Go Daemon)"]
    PG[("PostgreSQL 16 (Drizzle ORM)")]

    User -->|Submit Task| Server
    Server -->|Persist Task & Session| PG
    Server -->|Dispatch| Brain
    Brain -->|Tool Calls| ToolGW
    ToolGW -->|Execute| FCManager
    FCManager -->|Unix Socket API| KVM
    KVM -->|Boot Hardware VM| MicroVM
    FCManager <-->|AF_VSOCK (Port 5000)| Boxd
    Boxd -->|Exec / Edit / Stream| MicroVM
    Server <-->|WebSocket VNC Bridge| User
```

### Key Design Decisions
- **KVM Virtualization over Containers:** Containers share the host kernel. Firecracker provides hardware virtualization via `/dev/kvm`, isolating untrusted agent code at the hypervisor boundary.
- **`AF_VSOCK` over SSH:** Vsock multiplexes directly over host Unix domain sockets, eliminating exposed guest networking, credential handshakes, and SSH daemon overhead.
- **Snapshot Resumption & Golden Images:** Boots guest environments from pre-configured snapshots and golden rootfs images, bypassing full Linux init sequences.
- **Automatic Context Compaction:** Summarizes older message history after 24 turns to prevent context window saturation during extended coding tasks.

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **MicroVM & Systems** | Go 1.24, Firecracker Go SDK, Linux KVM, `AF_VSOCK`, TAP / CNI Networking |
| **Agent Core** | TypeScript, Bun, OpenAI / Gemini (`gemini-3.8-flash`), ReAct Loop |
| **Backend & APIs** | Express, WebSockets, gRPC (`@grpc/grpc-js`), Better-Auth |
| **Data Layer** | PostgreSQL 16 (Drizzle ORM, 7 tables, encrypted token columns) |
| **Cloud & Infra** | Docker, AWS Terraform modules (EKS, EC2 bare-metal KVM, SQS), Helm |

## Performance & Benchmarks

Measured on an 11th Gen Intel i5-11300H (4 cores / 8 threads, Ubuntu 24.04, KVM enabled). Source: [`collabifyy/server/benchmark.md`](../collabifyy/server/benchmark.md#part-1--son-of-anton-benchmark--reliability-report).

| Metric | Result | Methodology / Condition |
| :--- | :---: | :--- |
| **MicroVM Cold Boot** | **1062.02 ms** | p50 API-to-ready shell (11.28 ms host control plane + 1006.02 ms guest init) |
| **MicroVM Teardown**  | **28.13 ms** | p50 graceful `SIGTERM` teardown (25.95 ms forced `SIGKILL`) |
| **AF_VSOCK Throughput**| **175.93 MB/s** | Sustained streaming throughput on 10MB payloads |
| **AF_VSOCK Latency**   | **2.01 ms** | p50 round-trip ping vs. 0.23 ms localhost baseline |
| **Host Memory Usage**  | **~47 MiB** | Physical host RSS memory per idle MicroVM |
| **Timeout Precision**  | **1001.75 ms** | Accuracy within 1.75 ms on a 1.0-second execution limit (exit code 124) |

## Getting Started

### Prerequisites
- Linux host with KVM enabled (`/dev/kvm` accessible)
- [Bun](https://bun.sh/) $\ge$ 1.2
- [Docker](https://www.docker.com/)

### Local Setup
```bash
# 1. Clone repository
git clone https://github.com/chill-czar/devin.git
cd devin

# 2. Configure environment
cp .env.sample .env
# Provide GEMINI_API_KEY (or OPENAI_API_KEY), DATABASE_URL, BETTER_AUTH_SECRET

# 3. Launch full stack via local development script
# (Starts PostgreSQL, applies Drizzle migrations, and launches microservices)
bash start-dev.sh
```

Open `http://localhost:3000` to access the web console. The API server listens on `http://localhost:8080`.

## Project Structure

```
devin/
├── apps/
│   ├── firecracker/            # Go Firecracker microVM daemon, warm pool, CNI helper
│   ├── brain/                  # ReAct agent loop, tool execution harness, context compaction
│   ├── server/                 # Express backend API, auth, and WebSocket VNC bridge
│   ├── scheduler/              # Task scheduling and dispatching service
│   ├── tool-gateway/           # gRPC / HTTP proxy forwarding tool requests to sandboxes
│   └── web/                    # Next.js web dashboard and session journey console
├── infra/                      # AWS Terraform modules (EKS, EC2 bare-metal KVM) and Go CLI
├── packages/
│   ├── drizzle/                # Drizzle ORM schema (7 tables) and database migrations
│   └── api/                    # API route definitions and contracts (v1 active, v2 planned)
├── scripts/                    # Firecracker rootfs and snapshot build scripts
└── start-dev.sh                # Automated local full-stack development launcher
```

## Status & Roadmap

**Current Status:** Working local implementation with complete Go Firecracker runtime and Docker development loop; cloud infrastructure-as-code included, not currently deployed.

- [ ] Implement in-guest cgroups v2 (`cgroup.kill`) to eliminate subshell process group escapes when commands spawn background tasks (`&`).
- [ ] Add egress IP destination filtering to the host HTTP CONNECT proxy (restricting access to `169.254.169.254` and host loopback).
- [ ] Implement full Go REST API v2 (`packages/api/v2` is currently a placeholder).
- [ ] Provision AWS bare-metal `.metal` execution hosts using the included Terraform modules.

## Links & Contact

- **Portfolio:** [itsmesarthak.site](https://www.itsmesarthak.site/)
- **GitHub:** [@chill-czar](https://github.com/chill-czar)
- **LinkedIn:** [Sarthak Chaudhari](https://www.linkedin.com/in/its-sarthak-chaudhari/)
- **Email:** [aisarthak2@gmail.com](mailto:aisarthak2@gmail.com)
