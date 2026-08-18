import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { boardRoutes } from "./routes/board.route";
import { cardRotutes } from "./routes/card.route";
import {
  acquireLock,
  releaseLock,
  releaseLocksBySocket,
} from "./services/lock.service";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/boards", boardRoutes);
app.use("/cards", cardRotutes);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

app.get("/health", (req, res) => {
  return res
    .status(200)
    .json({ status: "ok", timeStamp: new Date().toISOString() });
});

app.set("io", io);

const socketMetadata = new Map<string, { boardId: string; userId: string }>();

io.on("connection", (socket) => {
  console.log(`[Socket] new client connected: ${socket.id}`);

  socket.on(
    "join-board",
    ({ boardId, userId }: { boardId: string; userId: string }) => {
      socket.join(boardId);
      socketMetadata.set(socket.id, { boardId, userId });
      console.log(`[Socket] User ${userId} joined board room: ${boardId}`);
    },
  );

  socket.on(
    "claim-lock",
    async ({
      boardId,
      cardId,
      userId,
    }: {
      boardId: string;
      cardId: string;
      userId: string;
    }) => {
      try {
        const result = await acquireLock(cardId, userId, socket.id);

        if (result.success && result.lock) {
          io.to(boardId).emit("lock-acquired", {
            cardId,
            lock: result.lock,
          });
        } else {
          socket.emit("lock-failed", {
            cardId,
            reason: result.reason,
            currentLock: result.lock,
          });
        }
      } catch (error) {
        console.error("[Socket.claim-lock] Error:", error);
        socket.emit("lock-failed", { cardId, reason: "INTERNAL_ERROR" });
      }
    },
  );

  socket.on(
    "release-lock",
    async ({
      boardId,
      cardId,
      userId,
    }: {
      boardId: string;
      cardId: string;
      userId: string;
    }) => {
      try {
        const result = await releaseLock(cardId, userId, socket.id);

        if (result.success) {
          io.to(boardId).emit("lock-released", { cardId });
        }
      } catch (error) {
        console.error("[Socket.release-lock] Error:", error);
      }
    },
  );

  socket.on("disconnect", async () => {
    const meta = socketMetadata.get(socket.id);

    if (meta) {
      console.log(
        `[Socket] User ${meta.userId} disconnected, cleaning up locks...`,
      );

      const releasedCardIds = await releaseLocksBySocket(socket.id);

      for (const cardId of releasedCardIds) {
        io.to(meta.boardId).emit("lock-released", { cardId });
      }

      socketMetadata.delete(socket.id);
    }

    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`[Server] running on port ${PORT}`);
});
