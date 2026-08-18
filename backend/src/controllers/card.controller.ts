import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function createCard(req: Request<{ id: string }>, res: Response) {
  try {
    const { columnId, title, description } = req.body;

    if (!columnId || !title) {
      return res.status(400).json({ error: "columnId and title are required" });
    }

    const lastCard = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { position: "desc" },
    });

    const position = lastCard ? lastCard.position + 1 : 0;

    const card = await prisma.card.create({
      data: {
        columnId,
        title,
        description,
        position,
      },
    });

    return res.status(201).json(card);
  } catch (error) {
    console.error("[CardController.createCard] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateCard(req: Request<{ id: string }>, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, userId } = req.body;
    const lock = await prisma.cardLock.findUnique({ where: { cardId: id } });

    if (!lock || lock.userId !== userId || lock.expiresAt <= new Date()) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message:
          "You're not allowed to edit this card, because it's locked by another user.",
      });
    }

    const card = await prisma.card.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      },
    });

    return res.status(200).json(card);
  } catch (error) {
    console.error("[CardController.updateCard] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function moveCard(req: Request<{ id: string }>, res: Response) {
  try {
    const { id } = req.params;
    const { targetColumnId, newPosition, userId } = req.body;
    const lock = await prisma.cardLock.findUnique({ where: { cardId: id } });

    if (!targetColumnId || newPosition === undefined) {
      return res
        .status(400)
        .json({ error: "targetColumnId and newPosition are required" });
    }

    if (!lock || lock.userId !== userId || lock.expiresAt <= new Date()) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message:
          "You're not allowed to move this card, because it's locked by another user.",
      });
    }

    const card = await prisma.card.update({
      where: { id },
      data: {
        columnId: targetColumnId,
        position: newPosition,
      },
    });

    return res.status(200).json(card);
  } catch (error) {
    console.error("[CardController.moveCard] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
