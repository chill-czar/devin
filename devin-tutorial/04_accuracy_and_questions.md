# Accuracy Notes, Gap Audit & Viewer Q&A

This document serves as the presenter's reality-check sheet before recording the tutorial. It audits every discrepancy between the project documentation and the actual source code, details unfinished parts and known limitations, provides code-backed answers to 10 technical viewer questions, and includes a pre-recording verification checklist.

---

## 1. Documentation vs. Code Discrepancy Audit

### Discrepancy 1: AF_VSOCK vs. HTTP over TAP Network
- **What README / Docs Claim:** The root `README.md` and architecture diagrams state: *"AF_VSOCK (Port 5000): host-guest control communication"* and quote AF_VSOCK benchmark metrics (175.93 MB/s throughput, 2.01 ms latency).
- **What the Code Actually Does:** The actual running transport between the host and the guest is **HTTP REST over a virtual TAP device** (`tc-redirect-tap` CNI plugin). The guest supervisor listens on HTTP port `8081` (`apps/runtime/cmd/runtime/main.go`), and the Tool Gateway (`apps/tool-gateway/main.go`) makes HTTP requests (`POST http://192.168.127.8:8081/...`).
- **Citation:** `apps/firecracker/internal/vm/lifecycle.go` line 185 (`runtimeURL := fmt.Sprintf("http://%s:%d", ip.String(), meta.RuntimePort)`).
- **How to Address in Video:** State clearly that while Firecracker supports AF_VSOCK (and early prototypes evaluated it), the current production implementation uses HTTP over CNI TAP networking for simpler routing and direct browser proxying.

### Discrepancy 2: Benchmark Source Attribution
- **What README Claims:** The README includes benchmark tables comparing Devin to Docker and gVisor, citing source `collabifyy/server/benchmark.md`.
- **What the Code Shows:** `collabifyy` is a separate repository and is not present in this codebase.
- **How to Address in Video:** Present the benchmark numbers as reference measurements from the development testbed on Intel i5-11300H hardware, rather than an in-repo reproducible benchmark script.

### Discrepancy 3: Cloud Infrastructure Deployment Status
- **What Docs Suggest:** `infra/README.md` and `infra/deployment.md` contain extensive guides for deploying onto AWS EKS with bare-metal EC2 execution hosts.
- **What the Code Shows:** The Terraform modules (`infra/main.tf`) and Helm charts are fully authored, but the project is currently configured for local development using Docker Compose and `FIRECRACKER_DRY_RUN=true`.
- **How to Address in Video:** Be transparent: *"The cloud Terraform is fully authored for AWS EKS and C7i bare-metal hosts, but for local demo and development, we run in dry-run mode without requiring KVM hardware."*

### Discrepancy 4: Legacy In-Guest Agents Retired
- **What Older Configs / Docs Mention:** Mentions of running Cursor (`agent`) or Claude Code CLI inside the guest.
- **What the Code Shows:** `apps/runtime/internal/agent/runner.go` lines 61–65 explicitly retire in-guest Cursor and Claude: `if provider == "cursor" || provider == "claude" { provider = "mock" }`. All primary coding intelligence is centralized in `apps/brain` on the control plane.

---

## 2. Known Limitations & Gaps (Do Not Oversell)

1. **Static Guest IP Bottleneck (`192.168.127.8`):**
   - In `apps/firecracker/internal/cnihelper/ensure.go`, the CNI conflist hardcodes a static IP `192.168.127.8`.
   - As a consequence, `restoreNetworkMu` in `apps/firecracker/internal/vm/lifecycle.go` must hold an exclusive mutex during restore and health checking. Only **one MicroVM can be restored at a time** per host, and concurrent active VMs must be carefully managed.
2. **Missing In-Guest cgroups v2 Enforcement:**
   - The supervisor starts processes with `Setpgid: true` and kills with `SIGKILL` on timeout (`apps/runtime/internal/executil/kill_linux.go`).
   - However, Linux cgroups v2 (`cgroup.kill`) is not yet implemented inside the guest. A process that daemonizes or decouples from its process group could theoretically linger until the VM is destroyed.
3. **Unfiltered Outbound Egress (IMDS Risk):**
   - The MicroVM has outbound internet access via host NAT masquerading.
   - There is no egress IP filter blocking `169.254.169.254` (the AWS Instance Metadata Service). On AWS EC2 hosts, an untrusted script running in the guest could theoretically query IAM roles unless IMDSv2 hop limits (`HttpPutResponseHopLimit=1`) are applied to the EC2 host.
4. **Placeholder Go REST API v2:**
   - The repository roadmap notes that the Go REST API v2 (`packages/api/v2`) is planned, but current API routes remain on Express in `apps/server`.

---

## 3. 10 Likely Viewer Questions & Code-Backed Answers

#### Q1: "Why did you build your own Go supervisor inside the VM instead of running SSH or a standard agent like VS Code Server?"
- **Answer:** SSH requires public key provisioning, creates connection handshake latency, and consumes 30–50 MB of memory per instance. VS Code Server takes 300+ MB of RAM. Our custom Go daemon (`apps/runtime/cmd/runtime/main.go`) is a single 15 MB static binary that boots as PID 1 in milliseconds, serves HTTP directly, mounts `/workspace` on tmpfs, and exposes specialized tool APIs (`/terminal`, `/files/write`, `/git/commit`) without SSH overhead.

#### Q2: "How does the agent avoid hallucinatory file paths on unfamiliar codebases?"
- **Answer:** In `apps/brain/src/harness/src/loop.ts` (lines 142–158), before the LLM generates turn 1, Devin automatically executes `list_dir(".")` inside the sandbox. The real directory listing (up to 2,000 characters) is injected directly into the system prompt (`buildSystemPrompt()`). The model immediately sees which files actually exist.

#### Q3: "How does the system prevent an agent from running an infinite start server command like `npm run dev`?"
- **Answer:** In `apps/brain/src/harness/src/tools/execute.ts` (lines 43–52), `executeShell()` runs `isForegroundServerCommand(command)`. If the command matches patterns like `npm run dev`, `next dev`, or `python app.py` in the foreground, the tool call is immediately rejected with a refusal message instructing the agent to run background smoke checks (`nohup ... &`) instead.

#### Q4: "What happens if a user submits a malicious prompt that tries to print environment variables or steal GitHub tokens?"
- **Answer:** Two layers defend against this. First, `apps/brain/src/harness/src/trust.ts` (`isSecretExfilShellCommand()`) scans shell strings for commands like `printenv`, `env`, `cat /proc/environ`, or `DATABASE_URL` and refuses them before execution. Second, plaintext GitHub tokens are never passed to the LLM; they are envelope-encrypted with AWS KMS in PostgreSQL (`packages/secrets/src/envelope.ts`) and injected ephemerally into the guest via HTTP headers.

#### Q5: "How does the warm pool achieve sub-30ms startup times?"
- **Answer:** As shown in `apps/firecracker/internal/vm/lifecycle.go`, we do not cold-boot the VM or run system init on task creation. In the background, `manager_warm.go` restores paused VMs from golden memory snapshots (`mem.snap`). When assigned, we clone the golden `rootfs.ext4` using Linux copy-on-write filesystem reflinks (`cp --reflink=auto`), issue a Firecracker PATCH request to rebind the drive, and call `machine.ResumeVM()`. The CPU resumes running where it paused in under 30 ms.

#### Q6: "Why mount `/workspace` as a tmpfs instead of keeping it on the rootfs ext4 drive?"
- **Answer:** In `apps/runtime/internal/workspace/workspace_linux.go`, `/workspace` is mounted as a 12 GB `tmpfs` in RAM (`size=12G,mode=1777`). Running `npm install`, `cargo build`, and file writes in memory eliminates physical disk I/O bottlenecks and avoids filling the host's physical EBS volume. When the VM is destroyed, the RAM is reclaimed instantly.

#### Q7: "How does the web frontend receive live terminal updates without polling?"
- **Answer:** The in-guest supervisor has an internal event bus (`apps/runtime/internal/events/bus.go`). As commands run, `executil.RunStreamingUntilGuest()` streams output lines to `GET /events?taskId=...` via Server-Sent Events. The scheduler persists these into PostgreSQL `agent_task_events`, and the API gateway proxies them directly to `apps/web/lib/hooks/use-task-events.ts`.

#### Q8: "What prevents the model from generating thin scaffolds and falsely declaring victory?"
- **Answer:** In `apps/brain/src/harness/src/tools/finish-guards.ts`, `checkProductFinishGuards()` intercepts the `finish` tool call. It runs grep checks across the codebase: if strings like `"Scaffold ready"` or `"Play online with friends"` remain without game board components, or if non-JS entrypoints (`main.go`, `app.py`) have under 25 lines, the `finish` call is rejected, and the model is ordered to continue implementing.

#### Q9: "Can you run this on a standard developer laptop without AWS bare-metal?"
- **Answer:** Yes! The Firecracker manager has a `FIRECRACKER_DRY_RUN=true` flag (`apps/firecracker/internal/config/config.go`). In dry-run mode, it stubs out VM allocations and routes commands to a locally running supervisor binary on port 8081, allowing full end-to-end development on macOS or Linux without KVM.

#### Q10: "Why use gRPC between Brain and Tool Gateway, but HTTP inside the guest?"
- **Answer:** Brain (TypeScript) and Tool Gateway (Go) both live on the control plane where gRPC and Protobuf provide high-throughput, type-safe RPC with binary serialization. Inside the guest, however, HTTP REST was chosen so web browsers can directly proxy preview assets (VNC WebSockets, desktop screenshots, preview server routing) through standard HTTP reverse proxies.

---

## 4. Pre-Recording Run Checklist

Execute and verify each of these commands before hitting record:

- [ ] **1. Start Database & Dependencies:**
  ```bash
  docker compose -f docker/compose-dev.yaml up -d postgres
  ```
  *Verify:* `docker ps` shows PostgreSQL listening on port 5432.

- [ ] **2. Run Database Migrations:**
  ```bash
  bun run --cwd packages/drizzle db:migrate
  ```
  *Verify:* Tables (`user`, `agent_tasks`, `agent_sessions`) exist in database.

- [ ] **3. Verify Firecracker Host Daemon in Dry-Run Mode:**
  ```bash
  FIRECRACKER_DRY_RUN=true bun run --cwd apps/firecracker dev
  ```
  *Verify:* `curl http://localhost:9092/health` returns `{"status":"ok","readyVMs":1}`.

- [ ] **4. Build & Start Local Runtime Supervisor:**
  ```bash
  go run ./apps/runtime/cmd/runtime
  ```
  *Verify:* `curl http://localhost:8081/health` returns `{"status":"ok"}`.

- [ ] **5. Start Tool Gateway:**
  ```bash
  go run ./apps/tool-gateway/main.go
  ```
  *Verify:* Terminal prints `tool-gateway listening on :9095`.

- [ ] **6. Start Scheduler & API Server:**
  ```bash
  bun run --cwd apps/server dev
  bun run --cwd apps/scheduler dev
  ```
  *Verify:* `curl http://localhost:8080/health` returns 200 OK.

- [ ] **7. Launch Frontend:**
  ```bash
  bun run --cwd apps/web dev
  ```
  *Verify:* Navigate to `http://localhost:3000`, log in, and ensure prompt composer renders cleanly.
