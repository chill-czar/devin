# Architecture Diagrams & Presentation Guide

This directory contains the focused architecture diagrams for the Devin project tutorial video. Each diagram is provided as a standalone Markdown file (`.md`) containing the rendered Mermaid code block, a paragraph explanation, and spoken presenter cues.

---

### Presentation Sequence Overview

1. [01_system_overview.md](01_system_overview.md) — High-Level System Architecture & Component Interactions
2. [02_task_lifecycle.md](02_task_lifecycle.md) — Task Submission & Devbox Provisioning Flow (Flow A)
3. [03_agent_loop.md](03_agent_loop.md) — Autonomous Agent ReAct Loop & Safety Guards
4. [04_tool_execution.md](04_tool_execution.md) — Tool Call Bridge: Brain -> Gateway -> Guest Supervisor (Flow B)
5. [05_vm_lifecycle.md](05_vm_lifecycle.md) — Firecracker MicroVM Lifecycle, Warm Pools & Snapshot Restore
6. [06_host_guest_boundary.md](06_host_guest_boundary.md) — The Virtualization Boundary: KVM, Kernel, Rootfs & Init
7. [07_networking_security.md](07_networking_security.md) — Sandboxed Networking, Egress NAT & Security Guardrails
8. [08_data_model.md](08_data_model.md) — Relational Data Schema & Event Storage
9. [09_infra_deployment.md](09_infra_deployment.md) — Production AWS Topology vs. Local Development
10. [10_devin_vs_sonofanton.md](10_devin_vs_sonofanton.md) — MicroVM Isolation vs. Container-Based Agent Architectures

---

### Diagram 1: System Overview ([01_system_overview.md](01_system_overview.md))

- **Explanation:** This diagram captures the complete end-to-end topology of Devin. The web frontend interacts with an Express API gateway, backed by PostgreSQL and an SQS task queue. The Scheduler coordinates tasks, commanding the Firecracker Host Manager to spin up dedicated MicroVMs via Linux KVM while launching the Brain reasoning harness. The Brain issues gRPC tool calls through a Go Tool Gateway, which routes HTTP commands to the in-guest supervisor daemon (`boxd`). Event updates and terminal outputs stream back to the browser via Server-Sent Events.
- **What to say while showing this:**
  - *"At a high level, Devin splits cleanly into two realms: the Control Plane, where the agent thinks, and the Execution Plane, where code actually runs."*
  - *"When a user types a prompt in the browser, the API server enqueues the job and the scheduler picks it up."*
  - *"Notice the isolation seam: the Brain never executes code directly. It talks through a gRPC Tool Gateway to an in-guest supervisor daemon running inside a hardware-isolated Firecracker MicroVM."*
  - *"All output streams back through SSE so the user watches terminal logs, diffs, and desktop activity with zero polling."*

---

### Diagram 2: Task Lifecycle Sequence ([02_task_lifecycle.md](02_task_lifecycle.md))

- **Explanation:** A detailed sequence trace of Flow A, following the exact route from the user clicking "Run Agent" to the first LLM reasoning turn. It highlights the asynchronous queueing, the database status transitions (`queued` -> `scheduling` -> `sandbox_starting` -> `running`), the warm-pool assignment from the Firecracker daemon, guest health checking, repo cloning, and initial filesystem tree seeding to prevent hallucination.
- **What to say while showing this:**
  - *"Let's follow the lifecycle of a task from the moment you hit submit."*
  - *"The server writes the task to Postgres and pushes it to an SQS queue. This prevents traffic spikes from crushing the execution hosts."*
  - *"The scheduler asks the Firecracker host for a sandbox. If a warm VM is ready, assignment takes less than 30 milliseconds."*
  - *"Before the LLM generates a single token, Devin runs a shallow git clone inside the sandbox and seeds the real file tree into the prompt. That simple trick stops the model from hallucinating file paths."*

---

### Diagram 3: Agent Loop & ReAct Mechanics ([03_agent_loop.md](03_agent_loop.md))

- **Explanation:** This flowchart details the inner workings of `apps/brain/src/harness/src/loop.ts`. It illustrates the ReAct cycle, the deadline checks, conversation compaction triggered at 24 messages, model execution with Google Gemini 3.8 Flash or OpenAI models, product implementation finish guards, and the difference between hard failure and greenfield soft completion.
- **What to say while showing this:**
  - *"Inside the Brain, we run an autonomous ReAct loop — Reasoning plus Acting."*
  - *"Every turn checks two critical fuses: a wall-clock deadline and a step budget. If the task exceeds 40 steps, or 120 steps on a fresh project, the loop halts."*
  - *"Notice the compaction block: at 24 messages, context fills up. Devin calls a secondary LLM to summarize past turns into durable facts, discarding verbose outputs while preserving instructions."*
  - *"Look closely at the finish gate: if an agent builds a greenfield app and tries to finish while template scaffold text (`'Scaffold ready'`, `'Coming soon'`) remains, the finish guard rejects the tool call and forces the model to keep implementing."*

---

### Diagram 4: Tool Execution Bridge ([04_tool_execution.md](04_tool_execution.md))

- **Explanation:** This sequence diagram visualizes Flow B: how an abstract model tool call (e.g. `write_file`) travels across the system boundary to become a concrete filesystem change inside the guest MicroVM, returning untrusted data wrapped in security tags.
- **What to say while showing this:**
  - *"When the model outputs a structured JSON tool call, here is how it actually executes."*
  - *"First, Brain runs path security checks: it blocks edits to `node_modules`, `.next`, or `.git`."*
  - *"Brain sends a gRPC call to the Tool Gateway. The Gateway translates this into an HTTP POST over the host TAP bridge into the MicroVM's supervisor on port 8081."*
  - *"The guest daemon writes the file, returns status, and Brain wraps the response in `<untrusted>` tags before feeding it back to the model. This guarantees tool output is treated as data, not prompt injection instructions."*

---

### Diagram 5: Firecracker MicroVM Lifecycle ([05_vm_lifecycle.md](05_vm_lifecycle.md))

- **Explanation:** A state machine showing how golden rootfs images and snapshot states (`mem.snap` and `vm.snap`) are generated, kept in a pre-booted warm pool, cloned via copy-on-write reflinks upon assignment, actively managed during task execution, and cleanly dismantled during teardown.
- **What to say while showing this:**
  - *"Firecracker MicroVMs boot cold in about 1 second, but Devin takes this further with snapshotting."*
  - *"We pre-boot a VM, let it configure its network, and take a memory snapshot. In the background, the manager holds a warm pool of pre-restored VMs."*
  - *"When a task arrives, we clone the golden root filesystem using XFS reflink pointers — copy-on-write takes roughly 28 milliseconds with zero disk duplication."*
  - *"When the session ends, the VMM process terminates, the TAP device is torn down, the cloned disk is wiped, and conntrack tables are flushed."*

---

### Diagram 6: Host-Guest Boundary ([06_host_guest_boundary.md](06_host_guest_boundary.md))

- **Explanation:** An architectural breakdown of the virtualization boundary separating the bare-metal Linux host from the guest sandbox. It details the roles of the host KVM kernel module, uncompressed `vmlinux` binary, copy-on-write `rootfs.ext4`, the PID 1 `devin-runtime-supervisor` init process, and the 12 GB in-memory `tmpfs` workspace.
- **What to say while showing this:**
  - *"Here is what makes MicroVMs different from Docker containers."*
  - *"In Docker, the container shares the host kernel. If a malicious script triggers a kernel exploit, it can compromise the entire host."*
  - *"In Devin, each sandbox runs its own dedicated Linux kernel binary via `/dev/kvm`. Even if a user command gets root inside the guest, it is trapped inside its own hardware-isolated memory space."*
  - *"Inside the guest, our custom Go binary is PID 1. It mounts a 12-gigabyte tmpfs in RAM for lightning-fast builds without thrashing host disks."*

---

### Diagram 7: Networking & Security Guardrails ([07_networking_security.md](07_networking_security.md))

- **Explanation:** A detailed topology of network isolation, host iptables NAT rules, CNI configuration, envelope encryption for tokens via AWS KMS, prompt exfiltration blockers, and explicit callouts of known security gaps (lack of cgroups v2 kill and unprotected AWS IMDS endpoint).
- **What to say while showing this:**
  - *"Networking in Devin balances internet access for package managers with tenant isolation."*
  - *"The guest connects through a TAP interface bridged via CNI plugins with iptables NAT masquerading."*
  - *"OAuth tokens are encrypted using AES-256-GCM envelope encryption with AWS KMS. The plaintext token is only passed to git operations inside the sandbox via ephemeral headers."*
  - *"Here are two crucial gaps you must understand: currently, the guest lacks cgroups v2 process grouping, so orphan fork bombs are possible. Additionally, outbound HTTP does not block AWS IMDS at 169.254.169.254 — a critical hardening step before multi-tenant production."*

---

### Diagram 8: Data Model & Event Storage ([08_data_model.md](08_data_model.md))

- **Explanation:** Entity-Relationship diagram illustrating the 8 core tables in PostgreSQL (`user`, `session`, `account`, `user_dashboard_settings`, `agent_tasks`, `agent_task_events`, `agent_sessions`), emphasizing encrypted `bytea` columns and the append-only event log pattern that powers real-time UI replays.
- **What to say while showing this:**
  - *"Devin's database design relies on PostgreSQL 16 managed with Drizzle ORM."*
  - *"Notice the separation between `agent_tasks` and `agent_sessions`. The task tracks the high-level request, while the session records the active sandbox metadata, including encrypted GitHub tokens and desktop preview snapshots."*
  - *"The `agent_task_events` table is append-only. Every tool call, shell output line, and status change is sequentially indexed. This allows the frontend to reconnect and replay the entire session history seamlessly."*

---

### Diagram 9: Infrastructure & Deployment ([09_infra_deployment.md](09_infra_deployment.md))

- **Explanation:** A structural comparison contrasting the written production Terraform / Kubernetes architecture (EKS control plane, bare-metal C7i EC2 execution hosts, HashiCorp Vault, AWS SQS) against the local development environment (`FIRECRACKER_DRY_RUN=true`, local Bun processes, Docker Compose Postgres).
- **What to say while showing this:**
  - *"Let's talk about deployment reality versus development."*
  - *"The codebase includes full Terraform for an AWS EKS control plane coupled with bare-metal EC2 C7i instances that support nested KVM virtualization."*
  - *"However, for day-to-day development without expensive bare-metal AWS servers, the Firecracker daemon has a dry-run flag. In dry-run mode, it stubs out VM allocations and routes commands to a local supervisor process on your machine."*

---

### Diagram 10: Devin vs. Sonofanton Architecture Comparison ([10_devin_vs_sonofanton.md](10_devin_vs_sonofanton.md))

- **Explanation:** A side-by-side structural comparison contrasting Devin's MicroVM architecture (hardware virtualization, independent kernels, COW rootfs clones, remote Brain) against the common container-based agent pattern (Docker daemon, shared host kernel, docker exec pipes).
- **What to say while showing this:**
  - *"To wrap up our architecture review, let's contrast Devin with container-based agent architectures."*
  - *"In a container-based system like Sonofanton or standard Docker agents, you spin up Docker containers. While lightweight, they share the host kernel, access `/proc` and `/sys`, and cannot safely execute untrusted kernel modules or root-level system edits."*
  - *"Devin's Firecracker approach gives each agent its own genuine virtual machine with dedicated kernel and memory. You get the isolation of a full cloud VM with the sub-second speed of a container."*
