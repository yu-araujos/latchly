# 🔒 Latchly

A real-time collaborative Kanban board built to explore one specific problem: what happens when two users try to edit or move the same card at the same time?

<video src="https://github.com/user-attachments/assets/26375eaa-27d7-4c0a-bab4-00fe6b2f5d06"  alt="Latchly Demo" controls></video>

## Features

- **Pessimistic Concurrency Locks:** Opening a card registers a 60-second lock (TTL) backed by PostgreSQL & Socket.io.
- **Real-Time Drag & Drop:** Move cards between columns seamlessly. If a card is locked by another user, dragging is automatically disabled.
- **Real-Time Column & Card CRUD:** Create, rename (inline title editing), move, and delete columns or cards with instant updates across all connected clients.
- **Atomic Position Reordering:** Backend transaction handling for card movement that shifts neighbor card positions safely without race conditions.

## How it works

When a user opens a card to edit it, the backend registers a lock with a 60-second TTL and notifies everyone connected via WebSocket. While the lock is active, other users see the card as locked in real time. If the person closes the tab or loses connection, the lock is released along with it.

Pessimistic locking was chosen over optimistic locking (where conflicts are resolved after they happen) because it simplifies the user experience: better to warn someone upfront than ask them to merge changes after the fact.

## Architecture & Trade-offs

### Client-supplied User Identity (Known Limitation)

The WebSocket events and HTTP request payloads accept `userId` directly from the client to simplify profile switching and facilitate local testing of concurrency conflicts without requiring authentication setup (e.g., login/password screens). 

In a production environment, this value would be strictly extracted and verified from an authenticated session token (e.g., JWT, NextAuth, or IronSession) within Express middleware rather than trusted from the client payload.

### No Automated Tests (Known Limitation)

This project has no automated test suite or CI pipeline. The scope was proving out the concurrency/locking model end-to-end, not production hardening; verification was done manually (see "Testing locally" below). Automated testing and CI are deliberately out of scope here and are being explored in a separate project instead.

## Stack

- **Backend:** Node.js, Express, Socket.io, PostgreSQL (Neon Serverless) + Prisma ORM
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS v4, `@hello-pangea/dnd`, Framer Motion, Sonner, Socket.io client

## Concurrency & Real-Time Flow

```text
User A (Client)               Backend (Socket.io + Postgres)              User B (Client)
      │                                     │                                    │
      ├─── claim-lock (cardId, userId) ────►│                                    │
      │                                     ├── [Validates lock & TTL]           │
      │◄── lock-acquired (cardId, lock) ────┼─── lock-acquired (cardId, lock) ──►│ (Card turns locked)
      │                                     │                                    │
      │    [User A edits modal / drags]     │                                    │
      │                                     │                                    │
      ├─── release-lock (cardId, userId) ──►│                                    │
      │                                     ├── [Deletes CardLock record]        │
      │◄── lock-released (cardId) ──────────┼─── lock-released (cardId) ────────►│ (Card unlocked)
```

## Testing locally

1. Open `http://localhost:3000` in a regular browser window and pick a user (John).
2. Open the same URL in an incognito window and pick a different user (Bob).
3. Open a card as John, then try opening or dragging the same card as Bob.
4. Bob's screen updates instantly, showing the card locked by John (drag is disabled).
5. Close John's modal (or wait for the 60s TTL) and the card unlocks for Bob.

## Setup

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@ep-example.pooler.neon.tech/neondb?sslmode=require"
PORT=4000
```

```bash
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Server runs at `http://localhost:4000`.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_WS_URL="http://localhost:4000"
```

```bash
npm run dev
```

App runs at `http://localhost:3000`.
