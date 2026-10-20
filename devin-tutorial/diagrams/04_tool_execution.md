# Diagram 4: Tool Execution Protocol & gRPC Bridge (Flow B)

```mermaid
sequenceDiagram
    autonumber
    participant LLM as Model (Gemini/OpenAI)
    participant Brain as Brain Harness (loop.ts)
    participant Trust as Trust Policy (trust.ts)
    participant Dispatch as Tool Dispatcher (execute.ts)
    participant Gateway as Tool Gateway (:9095 Go)
    participant Supervisor as Guest Supervisor (:8081 boxd)
    participant OS as Linux Guest OS / workspace

    LLM->>Brain: Return tool_call: write_file("src/index.ts", content)
    Brain->>Brain: toolProgressDetail() -> emit agent.tool
    Brain->>Dispatch: executeTool(ctx, "write_file", args)
    
    Dispatch->>Dispatch: isForbiddenProjectPath("src/index.ts") -> OK
    Dispatch->>Dispatch: isWrongStackPath("node", "src/index.ts") -> OK
    
    Dispatch->>Gateway: gRPC DevboxTools.WriteFile(path, content)
    Gateway->>Gateway: requireBase(runtimeBaseUrl)
    Gateway->>Supervisor: HTTP POST /files/write {path, content}
    
    Supervisor->>Supervisor: resolveWorkspacePath("repo/src/index.ts")
    Supervisor->>OS: os.MkdirAll() & os.WriteFile()
    OS-->>Supervisor: Write 142 bytes OK
    Supervisor-->>Gateway: HTTP 200 {"status": "written", "path": "repo/src/index.ts"}
    
    Gateway-->>Dispatch: gRPC WriteFileResponse{Status: "ok", Path: "src/index.ts"}
    Dispatch-->>Brain: ToolResult{content: "wrote src/index.ts (ok)"}
    
    Brain->>Trust: wrapToolResult("write_file", content)
    Trust-->>Brain: Wrapped <untrusted>TOOL_RESULT...END_TOOL_RESULT</untrusted>
    Brain->>Brain: Append tool message to ChatMessages
    Brain->>LLM: Next Model Turn with Tool Result
```

---

### Protocol & Translation Explanation

This sequence diagram visualizes Flow B: how an abstract model tool call (e.g. `write_file`) travels across the system boundary to become a concrete filesystem change inside the guest MicroVM, returning untrusted data wrapped in security tags.

---

### What to Say While Showing This

- *"When the model outputs a structured JSON tool call, here is how it actually executes."*
- *"First, Brain runs path security checks: it blocks edits to `node_modules`, `.next`, or `.git`."*
- *"Brain sends a gRPC call to the Tool Gateway. The Gateway translates this into an HTTP POST over the host TAP bridge into the MicroVM's supervisor on port 8081."*
- *"The guest daemon writes the file, returns status, and Brain wraps the response in `<untrusted>` tags before feeding it back to the model. This guarantees tool output is treated as data, not prompt injection instructions."*
