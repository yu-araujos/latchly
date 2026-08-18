import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function createCard(req: Request, res: Response) {
  try {
    const { columnId, title, description } = req.body;

    if (!columnId || !title || !title.trim()) {
      return res.status(400).json({ error: "Missing columnId or title" });
    }

    const lastCard = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { position: "desc" },
    });

    const position = lastCard ? lastCard.position + 1 : 0;

    const card = await prisma.card.create({
      data: {
        columnId,
        title: title.trim(),
        description: description ? description.trim() : null,
        position,
      },
      include: {
        lock: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    const column = await prisma.column.findUnique({
      where: { id: columnId },
      select: { boardId: true },
    });

    const io = req.app.get("io");
    if (io && column?.boardId) {
      io.to(column.boardId).emit("card-created", { card });
    }

    return res.status(201).json(card);
  } catch (error) {
    console.error("[CardController.createCard] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateCard(req: Request<{ id: string }>, res: Response) {
  try {
    const { id: cardId } = req.params;
    const { title, description, userId } = req.body;

    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
      include: { lock: true, column: { select: { boardId: true } } },
    });

    if (!existingCard) {
      return res.status(404).json({ error: "Card not found" });
    }

    const now = new Date();
    const isLockedByOther =
      existingCard.lock &&
      existingCard.lock.userId !== userId &&
      existingCard.lock.expiresAt > now;

    if (isLockedByOther) {
      return res.status(423).json({ error: "Card is locked by another user" });
    }

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        title: title !== undefined ? title.trim() : existingCard.title,
        description:
          description !== undefined
            ? description.trim()
            : existingCard.description,
      },
      include: {
        lock: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    const io = req.app.get("io");
    if (io && existingCard.column?.boardId) {
      io.to(existingCard.column.boardId).emit("card-updated", {
        card: updatedCard,
      });
    }

    return res.status(200).json(updatedCard);
  } catch (error) {
    console.error("[CardController.updateCard] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function moveCard(req: Request<{ id: string }>, res: Response) {
  try {
    const { id: cardId } = req.params;
    const { targetColumnId, newPosition, userId } = req.body;

    if (!targetColumnId || typeof newPosition !== "number" || !userId) {
      return res
        .status(400)
        .json({ error: "Missing required move parameters" });
    }

    const updatedCard = await prisma.$transaction(async (tx) => {
      const card = await tx.card.findUnique({
        where: { id: cardId },
        include: { lock: true },
      });

      if (!card) {
        throw new Error("CARD_NOT_FOUND");
      }

      const now = new Date();
      const isLockedByOther =
        card.lock && card.lock.userId !== userId && card.lock.expiresAt > now;

      if (isLockedByOther) {
        throw new Error("CARD_LOCKED");
      }

      const sourceColumnId = card.columnId;
      const oldPosition = card.position;

      if (sourceColumnId === targetColumnId) {
        if (newPosition > oldPosition) {
          await tx.card.updateMany({
            where: {
              columnId: sourceColumnId,
              id: { not: cardId },
              position: {
                gt: oldPosition,
                lte: newPosition,
              },
            },
            data: { position: { decrement: 1 } },
          });
        } else if (newPosition < oldPosition) {
          await tx.card.updateMany({
            where: {
              columnId: sourceColumnId,
              id: { not: cardId },
              position: {
                gte: newPosition,
                lt: oldPosition,
              },
            },
            data: { position: { increment: 1 } },
          });
        }
      } else {
        await tx.card.updateMany({
          where: {
            columnId: sourceColumnId,
            id: { not: cardId },
            position: { gt: oldPosition },
          },
          data: { position: { decrement: 1 } },
        });

        await tx.card.updateMany({
          where: {
            columnId: targetColumnId,
            id: { not: cardId },
            position: { gte: newPosition },
          },
          data: { position: { increment: 1 } },
        });
      }

      return await tx.card.update({
        where: { id: cardId },
        data: {
          columnId: targetColumnId,
          position: newPosition,
        },
        include: {
          lock: {
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          },
        },
      });
    });

    const column = await prisma.column.findUnique({
      where: { id: targetColumnId },
      select: { boardId: true },
    });

    const io = req.app.get("io");
    if (io && column?.boardId) {
      io.to(column.boardId).emit("card-moved", { card: updatedCard });
    }

    return res.status(200).json(updatedCard);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CARD_LOCKED") {
        return res.status(423).json({ error: "Card is locked by another user" });
      }
      if (error.message === "CARD_NOT_FOUND") {
        return res.status(404).json({ error: "Card not found" });
      }
    }

    console.error("[CardController.moveCard] Error:", error);
    return res.status(500).json({ error: "Failed to move card" });
  }
}

export async function deleteCard(req: Request<{ id: string }>, res: Response) {
  try {
    const { id: cardId } = req.params;
    const { userId } = req.body;

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        lock: true,
        column: { select: { boardId: true } },
      },
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    const now = new Date();
    const isLockedByOther =
      card.lock && card.lock.userId !== userId && card.lock.expiresAt > now;

    if (isLockedByOther) {
      return res.status(423).json({ error: "Card is locked by another user" });
    }

    const columnId = card.columnId;
    const oldPosition = card.position;
    const boardId = card.column?.boardId;

    await prisma.$transaction([
      prisma.cardLock.deleteMany({
        where: { cardId },
      }),
      prisma.card.delete({
        where: { id: cardId },
      }),
      prisma.card.updateMany({
        where: {
          columnId,
          position: { gt: oldPosition },
        },
        data: { position: { decrement: 1 } },
      }),
    ]);

    const io = req.app.get("io");
    if (io && boardId) {
      io.to(boardId).emit("card-deleted", { cardId, columnId });
    }

    return res.status(200).json({ success: true, cardId });
  } catch (error) {
    console.error("[CardController.deleteCard] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
