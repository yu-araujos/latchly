# Latchly

A real-time collaborative Kanban board built to explore one specific problem: what happens when two users try to edit or move the same card at the same time?

<video src="https://github.com/user-attachments/assets/26375eaa-27d7-4c0a-bab4-00fe6b2f5d06"  alt="Latchly Demo" controls></video>

## Features

- **Pessimistic concurrency locks:** opening a card registers a 60-second lock (TTL) backed by PostgreSQL & Socket.io.
- **Real-time drag & drop:** move cards between columns seamlessly. If a card is locked by another user, dragging is disabled.
- **Real-time column & card CRUD:** create, rename (inline title editing), move, and delete columns or cards, with instant updates across all connected clients.
- **Atomic position reordering:** card moves run inside a backend transaction that shifts neighboring positions safely, without race conditions.

## How it works

When a user opens a card to edit it, the backend registers a lock with a 60-second TTL and notifies everyone connected via WebSocket. While the lock is active, other users see the card as locked in real time. If the person closes the tab or loses connection, the lock is released along with it.

Pessimistic locking was chosen over optimistic locking (resolving conflicts after they happen) because it's simpler for the user: better to warn someone upfront than ask them to merge changes after the fact.

The flow for a lock, end to end:

1. User A opens a card and the client emits `claim-lock` with the card and user id.
2. The backend validates there's no active lock from someone else and writes the lock (with its TTL) to Postgres.
3. It broadcasts `lock-acquired` to everyone in the board's room — User A can now edit, User B sees the card as locked.
4. When User A closes the card (or disconnects), `release-lock` fires, the lock row is deleted, and `lock-released` unlocks the card for everyone else.

## Architecture & trade-offs

**Client-supplied user identity.** WebSocket events and HTTP payloads accept `userId` directly from the client, which keeps profile switching and local testing of concurrency conflicts simple without needing a login flow. In production this would come from an authenticated session (JWT, NextAuth, IronSession, etc.) verified in Express middleware, never trusted from the payload as-is.

**No automated tests.** The goal here was proving out the concurrency/locking model end to end, not production hardening, so there's no test suite or CI yet — verification was manual (see "Testing locally" below). Automated testing is being explored separately.

## Stack

- **Backend:** Node.js, Express, Socket.io, PostgreSQL (Neon Serverless) + Prisma ORM
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS v4, `@hello-pangea/dnd`, Framer Motion, Sonner, Socket.io client

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
