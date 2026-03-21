# Advanced Platform Sync Architecture

This diagram visualizes exactly how the highly scaled, robust 18-step asynchronous data sync feature functions behind the scenes in CodeVerse. 

## Flowchart: Before vs After (Visualized)

### 🚨 BEFORE: Linear Blocking Architecture (Flawed)
When users triggered a sync, the UI hung until external servers replied. If the target server failed or took 10 seconds, Express locked that thread.

```mermaid
sequenceDiagram
    participant User
    participant Express Server
    participant LeetCode API
    participant Github API
    
    User->>Express Server: "Sync All"
    activate Express Server
    Express Server->>LeetCode API: Fetch Data
    Express Server->>Github API: Fetch Data
    note right of Express Server: Thread is blocked. Application hangs.<br>DDOS bans get triggered. 
    LeetCode API-->>Express Server: Slow Response
    Github API-->>Express Server: Rate Limited (429)
    Express Server-->>User: Failed/Timeout ❌
    deactivate Express Server
```

---

### 🟢 AFTER: Queue-Based Worker Architecture (Current System)
Instead of waiting, Express drops the request onto a caching queue using **Upstash Redis** and immediately frees the HTTP thread. 
A separate background worker processor (or multiple!) pulls from the queue securely.

```mermaid
sequenceDiagram
    autonumber
    
    actor User as User (React UI)
    participant Express API as Node Controller
    participant Redis as Redis Queue (BullMQ)
    participant Worker as Background Worker
    participant External as External APIs (LeetCode, etc.)
    participant DB as MongoDB
    
    User->>Express API: 1. POST /api/platforms/sync
    
    Express API->>DB: 2. Check Local Cache (Data < 30m old?)
    
    alt Data is Fresh Cache (< 30 min)
        DB-->>Express API: Cache Valid
        Express API-->>User: 200 OK (Stop sync, UI Loads instantly)
    else Data Needs Syncing
        Express API->>Redis: 3. Create 'SyncJob' (Priority 1)
        Express API-->>User: 4. 202 Accepted (UI unlocks & shows "Syncing...")
        
        Redis->>Worker: 5. Assign Job (Enforcing concurrency limit = 3)
        Worker->>DB: 6. Update User syncStatus = "syncing"
        
        loop For Each Available Platform (O(N))
            Worker->>DB: 7. Check Cooldowns (Has Leetcode been synced in last 15 min?)
            Worker->>External: 8. Safely Fetch Platform API Data
            External-->>Worker: JSON Response Payload
            Worker->>Worker: 9. Await specific Delay!! (e.g. GitHub=500ms, LeetCode=2000ms)
        end
        
        Worker->>DB: 10. Process Aggregation & Store Data
        Worker->>DB: Update User syncStatus = "completed"
        Worker->>Redis: 11. Mark Job "Completed" in Bull Board Dashboard
        Worker->>User: 12. Emit Socket.io Real-time update to DOM
    end
```

### Component Details
1. **Node Controllers (`platformController.js`)**: Evaluates user spam limits and checks the Mongo cache timestamp. 
2. **Upstash Redis (`redis.js`)**: Serverless KV store that hosts list items securely.
3. **Queue Logic (`syncQueue.js`)**: Instructs Upstash on Retry Backoff attempts. If the external fetch fails, BullMQ waits 5 seconds and reschedules it exponentially. 
4. **The Process Worker (`syncWorker.js`)**: Isolated loop running alongside the server polling off jobs safely without using main thread resources.
5. **Insights Dashboard (`Bull Board`)**: Plugs directly into Express offering `localhost:5000/admin/queues` insight visualizer.
