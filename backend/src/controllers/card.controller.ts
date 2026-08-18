import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

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
  } catch (error: any) {
    if (error.message === "CARD_LOCKED") {
      return res.status(423).json({ error: "Card is locked by another user" });
    }
    if (error.message === "CARD_NOT_FOUND") {
      return res.status(404).json({ error: "Card not found" });
    }

    console.error("[CardController.moveCard] Error:", error);
    return res.status(500).json({ error: "Failed to move card" });
  }
}
