# Diagram 1: System Overview & Component Topology

```mermaid
graph TD
    User["Web Browser / User"]
    Web["Web Frontend (Next.js 15)<br/>:3000"]
    Server["API Gateway (Express)<br/>:8080"]
    DB[("PostgreSQL 16<br/>Drizzle ORM")]
    Queue["Task Queue<br/>(AWS SQS / Memory)"]
    Scheduler["Scheduler Service<br/>:9091"]
    Brain["Agent Brain Harness<br/>(ReAct Loop)"]
    Gateway["Tool Gateway (gRPC)<br/>:9095"]
    FCManager["Firecracker Host Manager<br/>:9092"]
    KVM["Linux KVM & Kernel<br/>/dev/kvm"]
    GuestVM["Firecracker MicroVM<br/>(Guest Sandbox)"]
    Supervisor["Runtime Supervisor (boxd)<br/>:8081 inside VM"]

    User -->|"HTTP / SSE"| Web
    Web -->|"REST API / Auth"| Server
    Server -->|"Reads / Writes"| DB
    Server -->|"Pushes Task"| Queue
    Queue -->|"Pulls Task"| Scheduler
    Scheduler -->|"Updates Status"| DB
    Scheduler -->|"Provisions Sandbox"| FCManager
    FCManager -->|"ioctl / KVM"| KVM
    KVM -->|"Boots / Resumes"| GuestVM
    Scheduler -->|"Executes Harness"| Brain
    Brain -->|"gRPC Tool Calls"| Gateway
    Gateway -->|"HTTP REST API"| Supervisor
    Supervisor -->|"Executes Shell/Git"| GuestVM
    Supervisor -.->|"Streams Events"| Scheduler
    Scheduler -.->|"Streams SSE"| Server
    Server -.->|"Streams SSE"| Web
```

---

### Component Breakdown & Explanation

This diagram captures the complete end-to-end topology of Devin. The web frontend interacts with an Express API gateway, backed by PostgreSQL and an SQS task queue. The Scheduler coordinates tasks, commanding the Firecracker Host Manager to spin up dedicated MicroVMs via Linux KVM while launching the Brain reasoning harness. The Brain issues gRPC tool calls through a Go Tool Gateway, which routes HTTP commands to the in-guest supervisor daemon (`boxd`). Event updates and terminal outputs stream back to the browser via Server-Sent Events.

---

### What to Say While Showing This

- *"At a high level, Devin splits cleanly into two realms: the Control Plane, where the agent thinks, and the Execution Plane, where code actually runs."*
- *"When a user types a prompt in the browser, the API server enqueues the job and the scheduler picks it up."*
- *"Notice the isolation seam: the Brain never executes code directly. It talks through a gRPC Tool Gateway to an in-guest supervisor daemon running inside a hardware-isolated Firecracker MicroVM."*
- *"All output streams back through SSE so the user watches terminal logs, diffs, and desktop activity with zero polling."*
