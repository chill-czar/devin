# Diagram 3: Autonomous Agent ReAct Loop & Safety Guards

```mermaid
flowchart TD
    Start(["Start Brain Harness"]) --> CheckDeadline{"Date.now() >= deadline<br/>OR abort signal?"}
    CheckDeadline -- Yes --> Fail(["Emit agent.failed & Return"])
    CheckDeadline -- No --> CheckCompaction{"Messages >= 24<br/>(COMPACT_AFTER)?"}
    
    CheckCompaction -- Yes --> Compact["Call Summary LLM<br/>Summarize Transcript<br/>compactMessages()"]
    CheckCompaction -- No --> StepCheck{"Steps >= maxSteps<br/>(40 or 120)?"}
    Compact --> StepCheck
    
    StepCheck -- Yes --> GreenfieldCheck{"Is Greenfield Task?"}
    GreenfieldCheck -- Yes --> SoftComplete(["Soft-Complete with committed code"])
    GreenfieldCheck -- No --> MaxStepFail(["Emit agent.failed (Hit max steps)"])
    
    StepCheck -- No --> ModelTurn["runModelTurn()<br/>Call Gemini / OpenAI with OPENAI_TOOLS"]
    ModelTurn --> ToolChosen{"Tool calls returned?"}
    
    ToolChosen -- No --> NudgeCheck{"requireProductImplementation?"}
    NudgeCheck -- Yes --> NudgeUser["Append user nudge:<br/>'Do not stop yet, keep implementing'"]
    NudgeUser --> CheckDeadline
    NudgeCheck -- No --> FinalSummary["Set finalSummary & Done"]
    FinalSummary --> Success(["Emit agent.completed"])
    
    ToolChosen -- Yes --> LoopTools["Execute each tool call via Tool Gateway"]
    LoopTools --> CheckFinishTool{"Is tool == 'finish'?"}
    
    CheckFinishTool -- Yes --> FinishGuards{"checkProductFinishGuards()<br/>Scaffold leaks? Stub copy? Game board?"}
    FinishGuards -- Leaks Found --> GateRefusal["Return error:<br/>'Cannot finish yet, scaffold remains'"]
    GateRefusal --> AppendResult["Wrap output with wrapToolResult()"]
    FinishGuards -- Clean --> DoneFlag["Set result.done = true"]
    DoneFlag --> Success
    
    CheckFinishTool -- No --> ExecRemote["Run tool on MicroVM (files/shell/git)"]
    ExecRemote --> AppendResult
    AppendResult --> CheckDeadline
```

---

### Loop Mechanics & Safety Gates Explanation

This flowchart details the inner workings of `apps/brain/src/harness/src/loop.ts`. It illustrates the ReAct cycle, the deadline checks, conversation compaction triggered at 24 messages, model execution with Google Gemini 3.8 Flash or OpenAI models, product implementation finish guards, and the difference between hard failure and greenfield soft completion.

---

### What to Say While Showing This

- *"Inside the Brain, we run an autonomous ReAct loop — Reasoning plus Acting."*
- *"Every turn checks two critical fuses: a wall-clock deadline and a step budget. If the task exceeds 40 steps, or 120 steps on a fresh project, the loop halts."*
- *"Notice the compaction block: at 24 messages, context fills up. Devin calls a secondary LLM to summarize past turns into durable facts, discarding verbose outputs while preserving instructions."*
- *"Look closely at the finish gate: if an agent builds a greenfield app and tries to finish while template scaffold text (`'Scaffold ready'`, `'Coming soon'`) remains, the finish guard rejects the tool call and forces the model to keep implementing."*
