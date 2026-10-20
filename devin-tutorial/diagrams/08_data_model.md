# Diagram 8: Relational Data Model & Event Storage

```mermaid
erDiagram
    user ||--o{ session : "owns"
    user ||--o{ account : "links"
    user ||--o| user_dashboard_settings : "configures"
    user ||--o{ agent_tasks : "creates"
    agent_tasks ||--o{ agent_task_events : "emits"
    agent_tasks ||--o| agent_sessions : "maintains"

    user {
        string id PK
        string name
        string email UK
        boolean email_verified
        timestamp created_at
    }

    session {
        string id PK
        string token UK
        string user_id FK
        timestamp expires_at
    }

    account {
        string id PK
        string provider_id
        string user_id FK
        bytea access_token "Encrypted KMS"
        bytea refresh_token "Encrypted KMS"
    }

    user_dashboard_settings {
        string user_id PK_FK
        string repository_label
        boolean github_can_commit
        boolean github_can_push
        boolean require_review_before_push
    }

    agent_tasks {
        string id PK
        string user_id FK
        string prompt
        string agent "brain | mock"
        string status "queued | running | completed | failed"
        string repository
        string sandbox_name
        timestamp created_at
    }

    agent_task_events {
        string id PK
        string task_id FK
        string type "agent.tool | agent.log | git.commit"
        string message
        jsonb data
        integer sequence
        timestamp timestamp
    }

    agent_sessions {
        string task_id PK_FK
        string sandbox_name
        string runtime_base_url
        string repo_cwd
        bytea github_token "Encrypted KMS"
        bytea desktop_snapshot
        timestamp last_active_at
    }
```

---

### Database Schema & Event Stream Explanation

Entity-Relationship diagram illustrating the 8 core tables in PostgreSQL (`user`, `session`, `account`, `user_dashboard_settings`, `agent_tasks`, `agent_task_events`, `agent_sessions`), emphasizing encrypted `bytea` columns and the append-only event log pattern that powers real-time UI replays.

---

### What to Say While Showing This

- *"Devin's database design relies on PostgreSQL 16 managed with Drizzle ORM."*
- *"Notice the separation between `agent_tasks` and `agent_sessions`. The task tracks the high-level request, while the session records the active sandbox metadata, including encrypted GitHub tokens and desktop preview snapshots."*
- *"The `agent_task_events` table is append-only. Every tool call, shell output line, and status change is sequentially indexed. This allows the frontend to reconnect and replay the entire session history seamlessly."*
