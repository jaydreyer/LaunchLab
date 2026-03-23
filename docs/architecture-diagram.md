# LaunchLab Architecture Diagram

## System Overview

```mermaid
graph TB
    subgraph Frontend["Frontend (React + Vite)"]
        PS[Practice Setup]
        AC[Agent Config]
        SIM[Simulator]
        ER[Eval Runner]
        DB[Dashboard]
    end

    subgraph Backend["Backend (FastAPI)"]
        API[REST API Layer]
        SPA[System Prompt Assembler]

        subgraph LLM1["LLM Subsystem 1: Healthcare Agent"]
            ORCH[Orchestrator]
            TOOLS[Mocked Tool Layer]
        end

        subgraph LLM2["LLM Subsystem 2: Patient Simulator"]
            PATSIM[Patient Simulator]
            SCENARIOS[Scenario Library]
        end

        subgraph LLM3["LLM Subsystem 3: LLM-as-Judge"]
            JUDGE[Eval Judge]
            CRITERIA[Evaluation Criteria]
        end

        SVC[Services Layer]
        READY[Readiness Aggregator]
    end

    subgraph Storage["Persistence (SQLite)"]
        PRAC_DB[(Practice Profiles)]
        CONF_DB[(Agent Configs)]
        SIM_DB[(Simulation Sessions)]
        TC_DB[(Tool Call Logs)]
        EVAL_DB[(Eval Runs + Cases)]
    end

    subgraph External["External"]
        CLAUDE[Claude API - Sonnet]
    end

    %% Frontend to API
    PS --> API
    AC --> API
    SIM --> API
    ER --> API
    DB --> API

    %% API to services
    API --> SVC
    API --> SPA
    SVC --> ORCH
    SVC --> PATSIM
    SVC --> JUDGE
    SVC --> READY

    %% Prompt assembly
    SPA --> ORCH

    %% LLM calls
    ORCH --> CLAUDE
    PATSIM --> CLAUDE
    JUDGE --> CLAUDE

    %% Tool execution
    ORCH --> TOOLS

    %% Scenario data
    PATSIM --> SCENARIOS

    %% Eval criteria
    JUDGE --> CRITERIA

    %% Persistence
    SVC --> PRAC_DB
    SVC --> CONF_DB
    ORCH --> SIM_DB
    ORCH --> TC_DB
    JUDGE --> EVAL_DB
    READY --> EVAL_DB
```

## Data Flow: Simulation Session

```mermaid
sequenceDiagram
    participant U as User / Patient Sim
    participant API as FastAPI
    participant SPA as Prompt Assembler
    participant Agent as Healthcare Agent
    participant Tools as Mocked Tools
    participant Claude as Claude API
    participant DB as SQLite

    U->>API: POST /simulations (create session)
    API->>SPA: Assemble system prompt
    SPA->>DB: Load practice config + agent config
    SPA-->>API: Assembled prompt

    loop Conversation Turns
        U->>API: POST /simulations/{id}/messages
        API->>Agent: Forward message + context
        Agent->>Claude: Send with system prompt + history
        Claude-->>Agent: Response (text or tool_use)

        opt Tool Call
            Agent->>Tools: Execute tool
            Tools-->>Agent: Structured result
            Agent->>DB: Log tool call
            Agent->>Claude: Send tool result
            Claude-->>Agent: Final response
        end

        Agent->>DB: Save messages
        Agent-->>API: Response + metadata
        API-->>U: Agent reply + tool calls
    end
```

## Data Flow: Evaluation Pipeline

```mermaid
sequenceDiagram
    participant ER as Eval Runner
    participant API as FastAPI
    participant PS as Patient Simulator
    participant Agent as Healthcare Agent
    participant Judge as LLM-as-Judge
    participant DB as SQLite

    ER->>API: POST /eval-runs (start suite)
    API->>DB: Create eval run record

    loop Each Scenario
        API->>PS: Generate patient messages
        PS->>Agent: Simulated conversation
        Agent-->>DB: Save session + tool calls
        API->>Judge: Grade conversation
        Judge->>DB: Save eval case + scores
    end

    API->>DB: Finalize eval run
    API-->>ER: Results summary

    ER->>API: GET /dashboard/readiness
    API->>DB: Aggregate eval results
    API-->>ER: Readiness score + categories
```

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Three separate LLM calls | Keeps agent, simulator, and judge independent — no prompt contamination |
| Dynamic prompt assembly | Practice config changes automatically update agent behavior |
| Mocked tools | Proves orchestration pattern without real EMR integration |
| SQLite | Zero-config persistence, sufficient for single-user portfolio project |
| Scenario-based evaluation | Each scenario has its own criteria, not a one-size-fits-all rubric |
