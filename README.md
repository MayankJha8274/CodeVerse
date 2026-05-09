# CodeVerse - System Flowchart

Here is the complete application flow presented in block format to show exactly how data moves through the CodeVerse platform.

## 1. Primary Request Flow (User Journey)

When a user visits the dashboard or views leaderboards, the system prioritizes speed using our caching block diagram:

```text
+-----------------------------+
|                             |
|    React Frontend (Vite)    |   User clicks "Dashboard" or "Daily Challenge"
|       (Fast UI Mount)       |
|                             |
+--------------+--------------+
               | 1. HTTP GET Request
               v
+--------------+--------------+
|                             |
|     Express Backend API     |   Receives request
|     (Node.js / Express)     |
|                             |
+--------------+--------------+
               | 2. Intercepts request
               v
+--------------+--------------+             +---------------------------+
|                             |  Hit (Yes)  |                           |
|  Redis Cache Middleware     +------------>|  RETURN DATA IMMEDIATELY  |
|  (Upstash RAM ~140ms Load)  |             |  (Bypasses DB entirely)   |
|                             |             +-------------+-------------+
+--------------+--------------+                           |
               | Miss (No)                                |
               v                                          |
+--------------+--------------+                           |
|                             |                           |
|     MongoDB Atlas (DB)      |                           |
| (Heavy Aggregation Queries) |                           |
|                             |                           |
+--------------+--------------+                           |
               | 3. Returns aggregated data               |
               v                                          |
+--------------+--------------+                           v
|                             |                 (Result rendered 
|  Save to Redis Cache RAM    |                  on user screen)
|                             |
+-----------------------------+
```

---

## 2. Background Sync Flow ( Automated Data Fetching )

To prevent the website from freezing while waiting for Github or LeetCode to respond, CodeVerse uses a background queue system:

```text
+-----------------------------+
|                             |
|     Express Backend API     |  Triggers when user profile needs update
|                             |
+--------------+--------------+
               | 1. Enqueue Job
               v
+--------------+--------------+
|                             |
|   BullMQ Queue Engine       |  Holds tasks in memory safely
|   (Powered by Redis)        |
|                             |
+--------------+--------------+
               | 2. Passes Job to Worker
               v
+--------------+--------------+
|                             |
|   syncWorker.js Process     |  Background worker starts processing
|                             |
+---+----------+----------+---+
    |          |          |     3. Fetches live competitive stats
+---v---+  +---v---+  +---v---+
| Leet- |  | GitHub|  | Code- | 
| Code  |  |  API  |  | forces|
+-------+  +-------+  +-------+
    |          |          |     4. Stats returned
    +----------+----------+
               |
               v
+--------------+--------------+
|                             |
|     MongoDB Atlas (DB)      |  Updates the user's records & leaderboards
|                             |
+--------------+--------------+
               | 5. Triggers Cache Invalidation
               v
+--------------+--------------+
|                             |
|    Upstash Redis Cache      |  Deletes stale cache for this user
|    (Flushed / Cleared)      |  Next user request triggers a fresh DB fetch
|                             |
+-----------------------------+
```

---

## Interactive Diagram (Auto-Renders in VSCode or GitHub)

If you use a MarkDown previewer, this node-based flowchart graphically illustrates the application:

```mermaid
graph TD
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:white;
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:white;
    classDef database fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:white;
    classDef cache fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:white;
    classDef external fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:white;

    %% Frontend
    Client[React User Interface]:::frontend -->|1. Requests Data| API(Express Backend API):::backend

    %% Backend logic
    API -->|2. Check Cache| RedisMiddleware{Is Data in Cache?}:::cache
    
    %% Fast Path
    RedisMiddleware -->|Yes - FAST HIT| RAM[(Redis Upstash RAM)]:::cache
    RAM -.->|Instant Return| Client

    %% Slow Path
    RedisMiddleware -->|No - CACHE MISS| MongoDB[(MongoDB Atlas)]:::database
    MongoDB -->|3. Run heavy queries| API
    API -->|4. Save to Cache| RAM
    API -->|Return Data| Client

    %% Background Queueing
    API -->|5. Need to update stats| Queue[BullMQ Queue]:::backend
    Queue -->|6. Send Task| Worker(syncWorker Background Process):::backend

    %% External APIs
    Worker -->|Fetch| LC[LeetCode API]:::external
    Worker -->|Fetch| GH[GitHub API]:::external
    Worker -->|Fetch| CF[Codeforces API]:::external

    %% DB Updates
    LC & GH & CF -->|7. Return fresh points| Worker
    Worker -->|8. Save New Standings| MongoDB

    %% Cache auto clear
    Worker -->|9. Flush Stale UI Data| RAM
```
