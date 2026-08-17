# 🔒 Latchly — Real-Time Kanban with Pessimistic Locking

Latchly is a real-time collaborative Kanban board built to solve concurrent editing conflicts using a **Pessimistic Locking strategy with TTL (Time-To-Live)**. When a user opens a card to edit, the card is locked across all connected clients via WebSockets, preventing race conditions and overwrites.

---

## ⚡ Features

- **Real-Time Board Synchronization**: Instant card status updates across all connected clients.
- **Pessimistic Locking**: Prevents concurrent edits by assigning exclusive edit access to a single user.
- **Lock Expiration (TTL)**: Locks automatically expire after 30 seconds of inactivity to avoid deadlocks.
- **Presence & Lock Indicators**: Visual indicators displaying which user currently holds the edit lock.
- **Graceful Disconnect Handling**: Automatically releases locks when a user closes their tab or loses connection.
- **Fluid UI & Micro-interactions**: Smooth transitions and lock state animations powered by Framer Motion.
- **Multi-User Simulation**: Easily switch between simulated profiles (e.g., Alice and Bob) to test concurrent behavior locally.

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-Time Engine**: Socket.io (WebSockets)
- **Database & ORM**: PostgreSQL (Neon Serverless) + Prisma ORM 7 (`@prisma/adapter-pg`)
- **Language**: TypeScript (`tsx` for zero-build execution)

### Frontend
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **WebSocket Client**: Socket.io Client
- **Language**: TypeScript

---

## 🏗️ Architecture & WebSocket Events

### Concurrency Flow

```text
User A (Client)               Backend (Socket.io + Postgres)              User B (Client)
      │                                     │                                    │
      ├─── claim-lock (cardId, userId) ────►│                                    │
      │                                     ├── [Validates lock & TTL]           │
      │◄── lock-acquired (cardId, lock) ────┼─── lock-acquired (cardId, lock) ──►│ (Card turns locked)
      │                                     │                                    │
      │    [User A edits modal]             │                                    │
      │                                     │                                    │
      ├─── release-lock (cardId, userId) ──►│                                    │
      │                                     ├── [Deletes CardLock record]        │
      │◄── lock-released (cardId) ──────────┼─── lock-released (cardId) ────────►│ (Card unlocked)
```

### WebSocket Event Reference

| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-board` | Client $\to$ Server | `{ boardId, userId }` | Joins a specific board room. |
| `claim-lock` | Client $\to$ Server | `{ boardId, cardId, userId }` | Requests exclusive edit access for a card. |
| `lock-acquired` | Server $\to$ Room | `{ cardId, lock }` | Broadcasted when a lock is successfully claimed. |
| `lock-failed` | Server $\to$ Client | `{ cardId, reason, currentLock }` | Notifies requester that the card is already locked. |
| `release-lock` | Client $\to$ Server | `{ boardId, cardId, userId }` | Releases the card lock explicitly. |
| `lock-released` | Server $\to$ Room | `{ cardId }` | Broadcasted when a lock is freed. |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: (v20+ recommended)
- **Package Manager**: npm or pnpm
- **Database**: PostgreSQL database URL (e.g., Neon DB)

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Configure your `.env` file in `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@ep-example.pooler.neon.tech/neondb?sslmode=require"
PORT=4000
```

Run database migrations:
```bash
npx prisma migrate dev --name init
```

Seed the database with initial users, board, and cards:
```bash
npx prisma db seed
```

Start the backend development server:
```bash
npm run dev
```

The server will run at `http://localhost:4000`.

### 2. Frontend Setup

Navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Set up environment variables in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_WS_URL="http://localhost:4000"
```

Start the Next.js development server:
```bash
npm run dev
```

The app will run at `http://localhost:3000`.

---

## 🧪 Testing Concurrency Locally

1. Open `http://localhost:3000` in a browser window and select **Alice**.
2. Open `http://localhost:3000` in an incognito window and select **Bob**.
3. Click on any card with **Alice** to open the edit modal.
4. Notice **Bob's** screen instantly updates with a lock badge showing *Locked by Alice*.
5. Attempting to click the card with **Bob** will display a lock conflict alert.
6. Close **Alice's** modal or wait 30 seconds for the TTL to expire — the card unlocks immediately for **Bob**.
