# Diagram 2: Task Lifecycle Sequence (Flow A)

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant Web as Web (Next.js)
    participant Server as API Server (:8080)
    participant DB as Postgres DB
    participant Queue as SQS / Queue
    participant Sched as Scheduler (:9091)
    participant FC as Firecracker Host (:9092)
    participant VM as Guest MicroVM (:8081)
    participant Brain as Brain Harness

    User->>Web: Click "Run Agent" with prompt
    Web->>Server: POST /api/v1/tasks {prompt, repo}
    Server->>DB: INSERT INTO agent_tasks (status='queued')
    Server->>Queue: Push ScheduleJob
    Server-->>Web: 201 Created {taskId}
    Web->>Server: GET /api/v1/tasks/:id/events (SSE connect)

    Queue->>Sched: Pop ScheduleJob
    Sched->>DB: UPDATE agent_tasks (status='scheduling')
    Sched->>Server: Emit event task.scheduled
    Sched->>FC: POST /v1/vms {name, runtime, cpu, memory}
    FC->>FC: takeWarm() or Restore Snapshot
    FC-->>Sched: 202 Accepted {vmId, runtimeURL: "192.168.127.8:8081"}

    Sched->>VM: GET /health (poll ready)
    VM-->>Sched: 200 OK {"status": "ok"}
    Sched->>VM: POST /git/clone {url, token}
    VM-->>Sched: 200 OK {"status": "completed"}

    Sched->>Brain: runBrainHarness(taskId, runtimeBaseUrl)
    Brain->>VM: GET /files/list?path=. (seed repo tree)
    VM-->>Brain: 200 OK {files: [...]}
    Brain->>Brain: Construct System Prompt & Enter ReAct Loop
```

---

### Step-by-Step Sequence Explanation

A detailed sequence trace of Flow A, following the exact route from the user clicking "Run Agent" to the first LLM reasoning turn. It highlights asynchronous queueing, database status transitions (`queued` -> `scheduling` -> `sandbox_starting` -> `running`), warm-pool assignment from the Firecracker daemon, guest health checking, repo cloning, and initial filesystem tree seeding to prevent hallucination.

---

### What to Say While Showing This

- *"Let's follow the lifecycle of a task from the moment you hit submit."*
- *"The server writes the task to Postgres and pushes it to an SQS queue. This prevents traffic spikes from crushing the execution hosts."*
- *"The scheduler asks the Firecracker host for a sandbox. If a warm VM is ready, assignment takes less than 30 milliseconds."*
- *"Before the LLM generates a single token, Devin runs a shallow git clone inside the sandbox and seeds the real file tree into the prompt. That simple trick stops the model from hallucinating file paths."*
