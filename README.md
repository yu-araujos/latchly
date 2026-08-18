# 🔒 Latchly

A real-time collaborative Kanban board built to solve one specific problem: what happens when two people try to edit the same card at the same time.

I built this after running into a similar problem at work (concurrent edit conflicts on an invoicing platform). I wanted to rebuild the logic from scratch, without reusing anything from that codebase, to actually understand the decisions involved rather than just having solved it once under deadline pressure.

## How it works

When a user opens a card to edit it, the backend registers a lock with a 60-second TTL and notifies everyone connected via WebSocket. While the lock is active, other users see the card as locked in real time. If the person closes the tab or loses connection, the lock is released along with it.

I went with pessimistic locking (rather than optimistic, where you resolve conflicts after they happen) because I wanted to simplify the user experience: better to warn someone upfront than ask them to merge changes after the fact.

## Stack

**Backend:** Node.js, Express, Socket.io, PostgreSQL (Neon Serverless) + Prisma ORM
**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, Socket.io client

## Concurrency flow

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

| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-board` | Client → Server | `{ boardId, userId }` | Joins a specific board room. |
| `claim-lock` | Client → Server | `{ boardId, cardId, userId }` | Requests exclusive edit access for a card. |
| `lock-acquired` | Server → Room | `{ cardId, lock }` | Broadcasted when a lock is successfully claimed. |
| `lock-failed` | Server → Client | `{ cardId, reason, currentLock }` | Notifies requester that the card is already locked. |
| `release-lock` | Client → Server | `{ boardId, cardId, userId }` | Releases the card lock explicitly. |
| `lock-released` | Server → Room | `{ cardId }` | Broadcasted when a lock is freed. |

## Testing locally

1. Open `http://localhost:3000` in a regular browser window and pick a user (Alice).
2. Open the same URL in an incognito window and pick a different user (Bob).
3. Open a card as Alice, then try opening the same card as Bob.
4. Bob's screen should update instantly, showing the card locked by Alice.
5. Trying to open the card as Bob shows a lock conflict.
6. Close Alice's modal (or wait for the 60s TTL) and the card unlocks for Bob.

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