# Smart Contest Reminder System

This document outlines the architecture and workflow of the Smart Contest Reminder System for CodeVerse. This system is designed to send timely and relevant contest notifications to active users via email and in-app alerts.

## System Architecture (Block Diagram)

```mermaid
graph TD
    A[Cron Job] -- Every Minute --> B{Process Reminders};
    B -- Find Contests --> C[MongoDB Atlas];
    B -- Find Eligible Users --> C;
    
    subgraph "Smart Targeting Logic"
        D[1. Active Users (Last 2 days)];
        E[2. Contest Participants (contestCount > 0)];
        F[3. Not Notified Today];
        G[4. Daily Limit (Max 100)];
    end

    B -- Applies --> D;
    B -- Applies --> E;
    B -- Applies --> F;
    B -- Applies --> G;

    B -- For Each User/Contest --> H{Dispatch Notifications};

    subgraph "Notification Channels"
        H -- Queues Email Job --> I[Redis (BullMQ)];
        H -- Creates Notification --> C;
    end

    J[Email Worker] -- Processes Job --> I;
    J -- Sends Email --> K[Nodemailer (Gmail)];
    
    L[Frontend App] -- Fetches Notifications --> M[API Endpoint];
    M -- Reads from --> C;
    L -- Displays --> N[Notification Bell UI];

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style J fill:#ccf,stroke:#333,stroke-width:2px
    style L fill:#9cf,stroke:#333,stroke-width:2px
```

## How It Works

The system is composed of several components that work together to deliver reminders efficiently and intelligently.

### 1. Cron Job Scheduler (`cronService.js`)

-   **Trigger**: A cron job runs **every minute** to check for upcoming contests.
-   **Timing**: It looks for contests that are scheduled to start between **60 and 61 minutes** from the current time. This narrow window ensures that reminders are sent only once for each contest.

### 2. Smart User Targeting

To avoid spamming users and to ensure notifications are relevant, the system uses a "smart targeting" strategy. A user is considered eligible for a reminder only if they meet **all** of the following criteria:

-   **Active Recently**: The user must have been active on the CodeVerse platform within the **last 2 days** (`lastActivityAt`).
-   **Engaged with Contests**: The user must have participated in at least one contest previously (`contestCount > 0`).
-   **Notified Today**: The user must not have already received a contest reminder notification on the current day (`lastNotifiedAt`).
-   **Email Settings**: The user must have email notifications enabled in their settings (`settings.emailNotifications` and `settings.notifyContests`).

### 3. Daily Sending Limit

-   To manage email volume and stay within the limits of email providers (especially Gmail), the system will send reminders to a maximum of **100 eligible users** per day.

### 4. Notification Dispatch

For each upcoming contest, the system iterates through the list of eligible users and performs two actions:

1.  **In-App Notification (`notificationService.js`)**: It immediately creates a new notification document in the `NotificationLog` collection in MongoDB. This appears in the user's notification bell on the website.
2.  **Email Queuing (`emailQueue.js`)**: It adds a new job to the **BullMQ email queue**, which is backed by Redis. The job contains the user's email, the subject, and the generated HTML content for the email. This queuing mechanism prevents the main application from blocking while sending emails and handles retries automatically in case of failures.

### 5. Email Worker (`emailWorker.js`)

-   A separate worker process constantly listens for new jobs in the email queue.
-   When a job is available, the worker picks it up and uses **Nodemailer** (configured with the provided Gmail credentials) to send the email.

### 6. Frontend Display (`NotificationBell.jsx`)

-   The React component in the frontend polls an API endpoint (`/api/notifications`) to fetch the user's notifications.
-   It displays the unread count and a list of recent notifications, providing a seamless in-app experience.

## Configuration

-   **Email Credentials**: Stored in the `.env` file (`EMAIL_USER`, `EMAIL_PASSWORD`).
-   **Logo URL**: The logo displayed in the email is located in `backend/src/services/emailService.js`. To change it, update the `logoUrl` variable to your publicly hosted image URL.
-   **Cron Schedules**: All job schedules are defined in `backend/src/services/cronService.js`.
