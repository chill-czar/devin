# Devin Deep-Dive: Codebase Exploration & Flow Tracing

> **Document Version:** 1.0.0  
> **Target Audience:** Backend engineers learning AI agent architectures and MicroVM sandboxing  
> **Primary Subject:** `chill-czar/devin` — Autonomous AI Coding Agent running in Firecracker MicroVMs  
> **Verification Status:** 100% Code-Verified against repository source files  

---

## 1. Project Overview & Monorepo Architecture

`devin` is an open-source autonomous software engineering agent architecture modeled after Devin. It isolates untrusted AI code execution (file system modifications, arbitrary shell execution, browser interactions, service runs) inside hardware-isolated **Firecracker MicroVMs** while keeping the agent reasoning loop ("Brain") and task management on the control plane.

### Monorepo Structure

The repository is organized as a Turborepo + Bun workspace containing TypeScript/Node services, Go system daemons, Kubernetes controllers, and Terraform infrastructure:

```text
/home/jimmy/Desktop/DEV/resume/devin/
├── apps/
│   ├── brain/              # Agent reasoning harness, prompt assembler, ReAct loop (TypeScript/Bun)
│   ├── firecracker/        # Firecracker MicroVM host manager & warm pool daemon (Go 1.22)
│   ├── orchestrator/       # Kubernetes controller for Sandbox & FirecrackerMachine CRDs (Go)
│   ├── runtime/            # Guest supervisor daemon (PID 1 / boxd) running inside MicroVMs (Go)
│   ├── scheduler/          # Task lifecycle coordinator & execution worker (TypeScript/Bun)
│   ├── server/             # Public HTTP & WebSocket API gateway, Better-Auth, Drizzle (Express/Bun)
│   ├── tool-gateway/       # gRPC-to-HTTP tool bridge between Brain and Runtime (Go)
│   └── web/                # User dashboard, real-time task viewer, VNC desktop (Next.js 15)
├── packages/
│   ├── drizzle/            # PostgreSQL schema definitions, migrations, database client
│   ├── events/             # Shared SSE task event types and EventBus
│   ├── orchestrator/       # Shared Go libraries for CRD reconciliation & host selection
│   ├── sandbox/            # Go API definitions for Sandbox and FirecrackerMachine CRDs
│   ├── scheduler/          # Core task orchestration state machine and lifecycle runners
│   ├── secrets/            # AES-256-GCM envelope encryption (AWS KMS / LOCAL_SECRETS_KEY)
│   ├── services/           # SQS / in-memory queue factory and email service
│   ├── types/              # Shared TypeScript interfaces (Task, Event, Runtime, Agent)
│   ├── ui/                 # Shared Tailwind/React UI component library
│   └── validators/         # Zod schemas for request validation
├── runtime/                # Dockerfiles and build scripts for guest rootfs environments
│   ├── agent/              # Base toolchain rootfs (boxd supervisor, git, gh, node, python)
│   ├── go/                 # Go 1.23 development rootfs
│   ├── nextjs/             # Next.js / Node 22 development rootfs
│   ├── node/               # Node.js development rootfs
│   ├── python/             # Python 3 development rootfs
│   ├── rust/               # Rust / Cargo development rootfs
│   └── scripts/            # Install scripts for desktop stack (Xvfb/VNC) and build toolchains
├── infra/                  # Terraform modules for AWS VPC, EKS, EC2 execution hosts, Vault
├── helm/                   # Kubernetes deployment charts
└── docker/                 # Docker Compose development and production configurations
```

---

## 2. In-Depth Component Analysis

### 2.1 Frontend / Web UI (`apps/web`)

- **Role:** Web dashboard where users compose tasks, authenticate with GitHub, monitor agent progress in real time, view git diffs, and interact with the sandbox desktop.
- **Language & Stack:** TypeScript, Next.js 15 (App Router), React 19, Tailwind CSS, Lucide icons.
- **Entry Point:** `apps/web/app/layout.tsx` and `apps/web/app/(app)/s/[id]/page.tsx`.
- **Key Responsibilities:**
  1. **Task Submission:** Handled by `apps/web/components/dashboard/prompt-composer.tsx`, sending a `POST /api/v1/tasks` request via `apps/web/lib/api/tasks.ts` `createTask()`.
  2. **Real-Time Progress Streaming:** Implemented in `apps/web/lib/hooks/use-task-events.ts` and `apps/web/lib/api/task-events.ts` `subscribeToTaskEvents()`. Connects via Server-Sent Events (SSE) to `/api/v1/tasks/:id/events` with automatic reconnection (up to 40 retries) and deduplication via `seenEventIds`.
  3. **Interactive Devbox Workspace:** `apps/web/components/dashboard/devbox-workspace.tsx` renders a multi-column workspace with a terminal log feed, file diff viewer, and an embedded VNC desktop viewer (`apps/web/components/dashboard/session-detail.tsx`).
  4. **Authentication:** Integrated with Better-Auth client in `apps/web/lib/auth-client.ts`, supporting GitHub OAuth.

### 2.2 API Server (`apps/server`)

- **Role:** Central gateway exposing public REST APIs, handling session authentication, persisting tasks, and proxying WebSockets.
- **Language & Stack:** TypeScript, Bun, Express (`@devin/api-v1`).
- **Entry Point:** `apps/server/src/main.ts` (`main()`) listening on `:8080`.
- **Interactions:**
  - Talks to **PostgreSQL** via Drizzle ORM (`packages/drizzle`).
  - Dispatches tasks to the **Scheduler** via task queue (`packages/services/queue`).
  - Proxies desktop VNC WebSockets from `/api/v1/tasks/:taskId/desktop-vnc/ws` to upstream Scheduler on `:9091` (`bridgeWebSockets()` in `apps/server/src/main.ts`).
  - Exposes SSE route `/api/v1/tasks/:id/events` for frontend consumers.

### 2.3 Agent Brain (`apps/brain`)

- **Role:** Autonomous reasoning engine executing the ReAct (Reasoning + Acting) loop. It decides which tools to call, inspects results, manages context compaction, and enforces strict completion guards.
- **Language & Stack:** TypeScript, Bun, OpenAI SDK (`openai`), `@grpc/grpc-js`.
- **Entry Point:** `apps/brain/src/harness/src/loop.ts` -> `runBrainHarness(options: BrainHarnessOptions)`.
- **ReAct Loop Mechanics:**
  1. **System Prompt Construction:** `apps/brain/src/harness/src/context/system-prompt.ts` (`buildSystemPrompt()`) builds prompt lines enforcing:
     - Non-negotiable Trust Policy (`apps/brain/src/harness/src/trust.ts`): User prompts, repo files, and tool outputs are wrapped in `<untrusted>` tags.
     - Filesystem listing injection: A live directory snapshot (`list_dir(".")`, up to 2,000 characters) is injected to prevent stack hallucinations (e.g., trying to read `app/page.tsx` on a Python repo).
     - Stack-specific guidance (`apps/brain/src/harness/src/stack.ts`): Rules for Go, Rust, Python, Next.js, and Node.
  2. **Model Call:** `apps/brain/src/harness/src/openai.ts` (`runModelTurn()`) invokes `chat.completions.create` using `gemini-3.8-flash` (via Google Generative Language OpenAI compatibility endpoint `https://generativelanguage.googleapis.com/v1beta/openai/`) or OpenAI models (`gpt-4o-mini`).
  3. **Context Compaction:** If the message array exceeds `COMPACT_AFTER = 24` messages, `summarizeConversation()` calls the summary model (`OPENAI_SUMMARY_MODEL` or default) to condense history into durable facts, preserving only system policy, facts summary, and the latest user turn (`apps/brain/src/harness/src/context/compact.ts` `compactMessages()`).
  4. **Execution Limits:**
     - Step Budget: `DEFAULT_MAX_STEPS = 40`, `FOLLOWUP_MAX_STEPS = 20`, or `120` for greenfield repositories (`packages/scheduler/src/task/service/brain-harness-runner.ts`).
     - Time Deadline: Enforced by `deadline = Date.now() + (options.maxWaitMs ?? 20 * 60 * 1000)`.
  5. **Finish Gates:** `apps/brain/src/harness/src/tools/finish-guards.ts` (`checkProductFinishGuards()`):
     - Blocks `finish` if template placeholder strings remain (`Scaffold ready`, `Implement the full app`, `Play ... online with friends`).
     - Blocks `finish` on games if board/canvas elements (`chessboard`, `flappy`, `canvas`) are missing.
     - Blocks non-JS projects if entry files (`main.go`, `app.py`, `src/main.rs`) have fewer than 25 lines or fail to serve an HTML 200 response on `GET /`.

### 2.4 Tool Gateway & Protocol (`apps/tool-gateway`)

- **Role:** High-performance translation proxy bridging the Brain's gRPC client to the guest MicroVM's HTTP supervisor.
- **Language & Stack:** Go 1.24, `google.golang.org/grpc`, Protobuf.
- **Entry Point:** `apps/tool-gateway/main.go` listening on `:9095`.
- **Protocol Definition:** `apps/brain/src/harness/proto/devbox/v1/tools.proto` defines service `DevboxTools`:
  - `Exec(ExecRequest) returns (ExecResponse)` -> calls guest `POST /terminal`
  - `ReadFile(ReadFileRequest) returns (ReadFileResponse)` -> calls guest `GET /files/read?path=...`
  - `WriteFile(WriteFileRequest) returns (WriteFileResponse)` -> calls guest `POST /files/write`
  - `ListDir(ListDirRequest) returns (ListDirResponse)` -> calls guest `GET /files/list?path=...`
  - `GitClone(GitCloneRequest) returns (GitResponse)` -> calls guest `POST /git/clone`
  - `GitCommit(GitCommitRequest) returns (GitResponse)` -> calls guest `POST /git/commit`
  - `GitPush(GitPushRequest) returns (GitResponse)` -> calls guest `POST /git/push`
  - `DesktopScreenshot(DesktopRequest) returns (DesktopResponse)` -> calls guest `GET /desktop/screenshot`
  - `BrowserOpen(BrowserOpenRequest) returns (BrowserOpenResponse)` -> calls guest `POST /browser/open`
- **Output Truncation:** Caps output buffers at `maxOutputBytes = 8000` to prevent LLM context exhaustion.

### 2.5 Sandbox Orchestrator & Firecracker Manager (`apps/firecracker` & `apps/orchestrator`)

- **Role:** Manages the lifecycle of Firecracker MicroVMs on bare-metal / KVM EC2 hosts, maintaining a warm pool of pre-booted VMs for sub-second assignment.
- **Language & Stack:** Go 1.22/1.24, `github.com/firecracker-microvm/firecracker-go-sdk`, CNI plugins.
- **Entry Points:**
  - `apps/firecracker/cmd/firecracker/main.go` (HTTP daemon on `:9092`).
  - `apps/orchestrator/cmd/orchestrator/main.go` (Kubernetes controller on `:9090`).
- **Warm Pool Lifecycle (`apps/firecracker/internal/pool/manager_warm.go`):**
  1. A background goroutine runs `warmRuntimePool(ctx, runtime, queue)`.
  2. Ensures `ready[runtime]` channel contains `PoolSize` (default: 1) restored instances.
  3. Preemptively invokes `launcher.Restore()` using golden snapshot files (`mem.snap`, `vm.snap`).
  4. If host disk free space drops below `MinFreeDiskGiB` (12 GiB) or `tracked + ready >= MaxActiveVMs` (2), pool expansion pauses (`GuardMinFreeDisk()` in `apps/firecracker/internal/vm/disk.go`).
- **VM Allocation (`apps/firecracker/internal/pool/manager_vm.go` `Create()`):**
  1. Checks if a warm VM is available via `takeWarm()`.
  2. Flushes guest conntrack (`cnihelper.FlushGuestConntrack()`) and executes a health check against `GET {runtimeURL}/health`.
  3. If warm pool is exhausted, falls back to cold snapshot restore via goroutine `provisionCold()`.
- **Copy-on-Write Rootfs Cloning (`apps/firecracker/internal/vm/rootfs.go`):**
  - Executes `cp --reflink=auto --sparse=always src dst` to clone the 4–8 GB golden `rootfs.ext4` in under 30 ms using filesystem reflink pointers (XFS/Btrfs).
- **Snapshot Resume Sequence (`apps/firecracker/internal/vm/lifecycle.go` `Restore()`):**
  1. Resolves runtime metadata from `internal/snapshot/runtime.go` (`meta.json`).
  2. Configures Firecracker instance with `WithSnapshot(memPath, snapshotPath)`.
  3. Calls `machine.Start(vmmCtx)` in paused state (`ResumeVM = false`).
  4. Rebinds root drive to the per-VM clone via Firecracker API: `machine.UpdateGuestDrive(vmmCtx, "root", rootfsClone)`.
  5. Resumes execution: `machine.ResumeVM(vmmCtx)`.
  6. Configures TAP device via CNI plugin `tc-redirect-tap`, brings link up, and refreshes host NAT (`RefreshGuestNAT()`).
  7. Polls `http://192.168.127.8:8081/health` for up to 30 seconds.

### 2.6 Guest Runtime Supervisor (`apps/runtime`)

- **Role:** In-guest daemon (`boxd` / `devin-runtime-supervisor`) acting as PID 1 and tool server.
- **Language & Stack:** Go 1.24, Linux system calls.
- **Entry Point:** `apps/runtime/cmd/runtime/main.go` listening on `:8081`.
- **Boot & Initialization:**
  1. Mounts Linux pseudo-filesystems: `/proc`, `/sys`, `/dev`, `/dev/pts`, `/dev/shm` (`EnsurePseudoFilesystems()`).
  2. Mounts `/workspace` as a 12 GB `tmpfs` with `size=12G,mode=1777` (`workspace_linux.go` `ensureTmpfs()`).
  3. Configures DNS nameservers (`8.8.8.8`, `1.1.1.1`, `8.8.4.4`) in `/etc/resolv.conf` (`EnsureDNS()`).
  4. Sets up pseudo-terminal environment and build cache directories (`/workspace/.build`).
- **Execution & Process Isolation (`apps/runtime/internal/executil/`):**
  - All shell commands are spawned in an isolated process group: `cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}` (`kill_linux.go`).
  - On timeout or cancellation, kills the entire process tree using `syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)`.
- **Desktop Stack Subsystem (`apps/runtime/internal/supervisor/desktop_computer.go`):**
  - Spawns and supervises:
    - `Xvfb :99 -screen 0 1024x768x24` (virtual frame buffer).
    - `x11vnc` on port 5900.
    - `websockify` on port 6080 for browser noVNC access.
    - Headless Chromium with Chrome DevTools Protocol (CDP) on port 29229.

### 2.7 Sandbox Artifacts (Kernel, Rootfs, Snapshots)

| Artifact | Location | Build Script / Source | Purpose |
| :--- | :--- | :--- | :--- |
| **Guest Kernel** (`vmlinux`) | `/var/lib/devin/linux/vmlinux` | Downloaded minimal uncompressed Linux kernel | Boots KVM vCPU without BIOS/bootloader overhead |
| **Golden Rootfs** (`rootfs.ext4`) | `/var/lib/devin/snapshots/<runtime>/rootfs.ext4` | Built via `scripts/build-firecracker-rootfs.sh` from Dockerfiles in `runtime/` | Ext4 filesystem containing Ubuntu base, Go/Node/Python, git, Chromium, and supervisor binary |
| **Memory State** (`mem.snap`) | `/var/lib/devin/snapshots/<runtime>/mem.snap` | Captured via `scripts/build-firecracker-snapshot.sh` | Dump of guest RAM after OS boot, network configuration, and supervisor startup |
| **MicroVM State** (`vm.snap`) | `/var/lib/devin/snapshots/<runtime>/vm.snap` | Captured via `scripts/build-firecracker-snapshot.sh` | Serialized Firecracker device models, CPU registers, interrupt controllers |
| **Metadata** (`meta.json`) | `/var/lib/devin/snapshots/<runtime>/meta.json` | Generated by snapshot build script | Stores port (`8081`), vCPU count (2), RAM (8192 MiB), static guest IP (`192.168.127.8`) |

### 2.8 Networking & Security

- **Network Interface & CNI:**
  - Uses CNI `ptp` + `tc-redirect-tap` (`apps/firecracker/config/cni/fcnet.conflist`).
  - Static IPAM assigns `192.168.127.8/24` with gateway `192.168.127.1`.
  - Host iptables creates `MASQUERADE` and `FORWARD` rules for outbound internet egress (`cnihelper.RefreshGuestNAT()`).
- **Mutual Exclusion on Network:**
  - Because all restored snapshots share the static guest IP `192.168.127.8`, `restoreNetworkMu` mutex in `lifecycle.go` ensures only one restore + health-probe occurs at any instant.
  - When a VM is assigned, `cnihelper.FlushGuestConntrack()` clears stale connection states.
- **Secrets Management & Transit Encryption:**
  - Implemented in `packages/secrets/src/envelope.ts` and `job-tokens.ts`.
  - AES-256-GCM envelope encryption: uses AWS KMS (`GenerateDataKeyCommand`) in production or `LOCAL_SECRETS_KEY` (32-byte base64) locally.
  - Plaintext GitHub tokens are never passed to the LLM or stored unencrypted. When sending tokens to the guest for git clone/push, they are passed ephemerally via HTTP headers (`X-Runtime-Env`) or stripped clone URLs (`tokenFreeCloneUrl`).
- **Prompt Injection Defense (`apps/brain/src/harness/src/trust.ts`):**
  - Input wrapping: User prompts, repo contents, and tool results are wrapped in `<untrusted source="...">` blocks with system instructions to ignore embedded commands.
  - Secret Exfiltration Defense: `isSecretExfilShellCommand()` tests shell strings against patterns searching for env dumps (`printenv`, `env`, `cat /proc/environ`, `DATABASE_URL`) and blocks execution with an explicit refusal message.

### 2.9 Data Layer (`packages/drizzle`)

Database schema defined in `packages/drizzle/src/database/schema.ts` on PostgreSQL 16:
1. `user` — User identity and profile data.
2. `session` — Active user web sessions (Better-Auth).
3. `account` — OAuth accounts, storing encrypted `accessToken`, `refreshToken`, and `idToken` as `bytea` columns.
4. `verification` — Magic-link email tokens.
5. `userDashboardSettings` — User preferences, permissions (`githubCanCommit`, `githubCanPush`, `requireReviewBeforePush`).
6. `agentTasks` — Central task table (`id`, `userId`, `prompt`, `agent`, `status`, `sandboxName`, `repository`, `branch`, `prUrl`).
7. `agentTaskEvents` — Append-only chronological log of all task events (`type`, `message`, `data` JSONB, `sequence`).
8. `agentSessions` — Devbox session metadata (`sandboxName`, `runtimeBaseUrl`, `repoCwd`, encrypted `githubToken`, `desktopSnapshot` bytea).

### 2.10 Infrastructure & Deployment (`infra/`)

- **Terraform Foundation (`infra/main.tf`):**
  - Multi-AZ VPC (`10.0.0.0/16`) with public and private subnets, NAT Gateways.
  - EKS Cluster (Kubernetes 1.34) for control plane services (`web`, `server`, `orchestrator`, `brain`).
  - EC2 Execution Hosts: `c7i.2xlarge` instances with hardware nested virtualization (`execution_host_enable_nested_virtualization = true`), dedicated `/dev/kvm`, and 200 GB root EBS for snapshot pools.
  - AWS KMS key for envelope encryption (`modules/secrets-kms`).
  - Task Queue: AWS SQS (`modules/task-queue`).
  - HashiCorp Vault on EKS with KMS auto-unseal (`modules/vault`).
- **Deployment Status:** Fully authored Infrastructure-as-Code; designed for AWS production deployment, but currently running locally in development mode (`FIRECRACKER_DRY_RUN=true`).

---

## 3. End-to-End Flow Tracing

### Flow A: User Submits a Task -> First Agent Step

```text
[User Browser]
      │
      │ 1. POST /api/v1/tasks { prompt, repository }
      ▼
[apps/server (:8080)]
      │
      │ 2. Inserts agentTasks record (status: "queued")
      │ 3. Pushes ScheduleJob to SQS / memory queue
      ▼
[packages/services/queue]
      │
      │ 4. Dequeued by packages/scheduler
      ▼
[packages/scheduler (:9091)]
      │ 5. processJob() in process-job/index.ts
      │ 6. Updates status -> "scheduling" -> emits task.scheduled
      │ 7. resolveRuntimeForTask() selects snapshot (e.g., "node")
      │ 8. POST /internal/v1/sandboxes { taskId, runtime, cpu, memory }
      ▼
[apps/orchestrator (:9090)]
      │ 9. Selects FirecrackerHost, calls POST /v1/vms
      ▼
[apps/firecracker (:9092)]
      │ 10. takeWarm("node") claims restored MicroVM
      │ 11. Refreshes NAT, verifies GET http://192.168.127.8:8081/health
      │ 12. Returns { vmId, runtimeURL: "http://192.168.127.8:8081" }
      ▼
[packages/scheduler]
      │ 13. Calls runtime POST /git/clone (clones repo into /workspace/repo)
      │ 14. Launches Brain Harness: runBrainHarness()
      ▼
[apps/brain]
      │ 15. list_dir(".") seeds real filesystem tree
      │ 16. buildSystemPrompt() compiles trust policy + guidelines
      │ 17. runModelTurn() invokes Gemini/OpenAI with OPENAI_TOOLS
      ▼
[Model Turn 1 complete, first tool chosen]
```

### Flow B: One Full Agent Iteration (ReAct Step)

```text
1. Brain Harness (apps/brain/src/harness/src/loop.ts):
   Calls runModelTurn(client, messages, model).
   Response returns tool_call:
   {
     "id": "call_123",
     "function": {
       "name": "write_file",
       "arguments": "{\"path\": \"src/index.ts\", \"content\": \"console.log('hello');\"}"
     }
   }

2. Tool Progress & Log Emission:
   Emits agent.tool: { tool: "Write", detail: "src/index.ts" }.
   Emits agent.log: { message: "Write -> wrote src/index.ts (ok)" }.

3. Tool Dispatcher (apps/brain/src/harness/src/tools/execute.ts):
   executeTool() validates path:
   - Checks isForbiddenProjectPath("src/index.ts") -> false.
   - Checks isWrongStackPath("node", "src/index.ts") -> false.
   Invokes toolsClient.WriteFile() via gRPC to Tool Gateway (:9095).

4. Tool Gateway (apps/tool-gateway/main.go):
   WriteFile() handler receives Protobuf request.
   Converts to HTTP POST to runtimeBaseUrl:
   POST http://192.168.127.8:8081/files/write
   Body: {"path": "repo/src/index.ts", "content": "console.log('hello');"}

5. In-Guest Supervisor (apps/runtime/internal/supervisor/files.go):
   handleFilesWrite() resolves target path under /workspace/repo/src/index.ts.
   Calls os.MkdirAll() and os.WriteFile().
   Returns HTTP 200 {"status": "written", "path": "repo/src/index.ts"}.

6. Result Return & Trust Tagging:
   Tool Gateway returns Protobuf WriteFileResponse{Status: "ok"}.
   Brain Harness wraps output:
   wrapToolResult("write_file", "wrote src/index.ts (ok)")
   Appends tool message to conversation history:
   { "role": "tool", "tool_call_id": "call_123", "content": "<untrusted>..." }

7. Loop Continuation:
   Checks Date.now() < deadline and steps < maxSteps.
   Advances to step 2 with updated conversation history.
```

### Flow C: MicroVM Lifecycle (Warm Pool, Snapshots, Teardown)

```text
       ┌────────────────────────────────────────────────────────┐
       │ 1. Boot-time Snapshot Creation                         │
       │    - Docker build compiles rootfs.ext4                │
       │    - Firecracker boots vmlinux + rootfs.ext4           │
       │    - boxd supervisor starts and reaches /health        │
       │    - Firecracker API CreateSnapshot -> mem.snap + vm.snap
       └──────────────────────────┬─────────────────────────────┘
                                  │
                                  ▼
       ┌────────────────────────────────────────────────────────┐
       │ 2. Background Warm Pool Manager (apps/firecracker)    │
       │    - manager_warm.go runs warmRuntimePool()           │
       │    - launcher.Restore() restores VM in paused state   │
       │    - Reflink clone rootfs: cp --reflink=auto           │
       │    - Drive PATCH to per-VM copy -> ResumeVM           │
       │    - Puts ready Instance into chan *vm.Instance       │
       └──────────────────────────┬─────────────────────────────┘
                                  │
                                  ▼ (Task Requested)
       ┌────────────────────────────────────────────────────────┐
       │ 3. Assignment & Execution                              │
       │    - takeWarm() pops instance from channel             │
       │    - FlushGuestConntrack() clears NAT state            │
       │    - Supervisor processes tool commands                │
       └──────────────────────────┬─────────────────────────────┘
                                  │
                                  ▼ (Task Done / Failed)
       ┌────────────────────────────────────────────────────────┐
       │ 4. Teardown & Cleanup (instance.go Shutdown())         │
       │    - machine.StopVMM() halts Firecracker process       │
       │    - cnihelper.Delete() removes TAP device and veth    │
       │    - Unmounts and deletes /var/run/netns/<vmId>        │
       │    - os.RemoveAll(vmDir) wipes per-VM rootfs clone    │
       │    - FlushGuestConntrack() resets conntrack table      │
       └────────────────────────────────────────────────────────┘
```

### Flow D: Git Clone, Edit, Commit, Push & Secret Injection

1. **Token Retrieval:** Scheduler fetches user's GitHub OAuth token from `agentSessions.githubToken`, decrypting via `packages/secrets/src/envelope.ts` (`decryptSecret()`).
2. **Safe Clone (No Token in URL):** `packages/secrets/src/job-tokens.ts` `tokenFreeCloneUrl(repo)` generates `https://github.com/org/repo.git`. The token is passed via HTTP header `X-Runtime-Env: {"GITHUB_TOKEN": "..."}` to `POST /git/clone`.
3. **Execution inside Guest:** `apps/runtime/internal/supervisor/git.go` runs `timeout 120 git clone --depth 1 ...`. Git uses the credential helper or env var inside the VM; the token never appears in process command lines or agent prompts.
4. **Agent Edits & Conventional Commits:**
   - Brain calls tool `git_commit` with `{ "message": "feat(core): implement feature\n\n- Add entrypoint" }`.
   - `apps/brain/src/harness/src/tools/commit-message.ts` appends `Co-authored-by: baby-devin-bot <bot@devin.baby>`.
   - `apps/brain/src/harness/src/tools/execute.ts` probes git status first. If clean (`dirty == 0`) or duplicate subject, the commit is skipped to avoid polluting git history.
5. **Git Push:** `POST /git/push` executes `git push -u origin <branch>` using the injected ephemeral environment credentials.

### Flow E: Real-Time Event & Terminal Streaming

```text
[Guest Command Execution]
       │
       │ stdout / stderr scanner in apps/runtime/internal/executil/command.go
       ▼
[Runtime EventBus (apps/runtime/internal/events/bus.go)]
       │
       │ SSE stream: GET http://192.168.127.8:8081/events?taskId=...
       ▼
[Scheduler TaskService (packages/scheduler/src/server/task-events.ts)]
       │
       │ 1. Emits to in-memory EventBus
       │ 2. Persists event into PostgreSQL agentTaskEvents table (sequence index)
       ▼
[Server API (apps/server)]
       │
       │ Proxies text/event-stream at GET /api/v1/tasks/:id/events
       ▼
[Frontend Hook (apps/web/lib/hooks/use-task-events.ts)]
       │
       │ subscribeToTaskEvents() parses "data: {...}" chunks
       │ Updates React state, auto-scrolls feedRef terminal log
```

### Flow F: Comprehensive Failure Paths

1. **Hung Shell Command:**
   - `apps/runtime/internal/executil/command.go` executes shell command with `context.WithTimeout(ctx, timeout)`.
   - When context expires, `killCmdTree(cmd)` executes `syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)`. The process group is terminated cleanly; exit code `124` is returned.
2. **Host Disk Full (ENOSPC):**
   - Pre-check: `GuardMinFreeDisk()` in `apps/firecracker/internal/vm/disk.go` refuses new MicroVM allocations if free space < 12 GiB.
   - Clone failure: If `cloneRootfs()` hits `ENOSPC`, `PruneOrphanVMDirs()` purges stale directories under `/var/lib/devin/vms` not tracked in active VM memory maps, then retries.
3. **MicroVM Crash / Unresponsive Guest:**
   - During restore, `waitForRuntimeHealth()` polls `GET http://192.168.127.8:8081/health` for 30s. If the supervisor fails to answer, `instance.Shutdown()` stops Firecracker, tears down CNI, deletes the rootfs clone, and returns an error to the scheduler.
4. **Infinite Model Loop / Unfinished Scaffolds:**
   - If the model attempts to call `finish` while placeholder scaffold copy remains, `checkProductFinishGuards()` intercepts the tool call, returns an error instruction ("Cannot finish yet — scaffold placeholders remain in..."), and nudges the model to continue implementing.
   - If steps reach `maxSteps` (40 or 120), the harness terminates gracefully with status `completed` (soft-complete on greenfield) or `failed`.
   - If execution exceeds `maxWaitMs`, the deadline check breaks the while loop with a timeout error.
