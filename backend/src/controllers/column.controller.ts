import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function createColumn(
  req: Request<{ boardId: string }>,
  res: Response,
) {
  try {
    const { boardId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: "desc" },
    });

    const position = lastColumn ? lastColumn.position + 1 : 0;

    const column = await prisma.column.create({
      data: {
        boardId,
        title: title.trim(),
        position,
      },
      include: {
        cards: {
          include: {
            lock: {
              include: {
                user: {
                  select: { id: true, name: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(boardId).emit("column-created", { column });
    }

    return res.status(201).json(column);
  } catch (error) {
    console.error("[ColumnController.createColumn] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateColumn(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const column = await prisma.column.update({
      where: { id },
      data: {
        title: title.trim(),
      },
      select: {
        id: true,
        boardId: true,
        title: true,
        position: true,
        createdAt: true,
      },
    });

    const io = req.app.get("io");
    if (io && column.boardId) {
      io.to(column.boardId).emit("column-updated", { column });
    }

    return res.status(200).json(column);
  } catch (error) {
    console.error("[ColumnController.updateColumn] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteColumn(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const { id } = req.params;

    const column = await prisma.column.findUnique({
      where: { id },
      select: { id: true, boardId: true },
    });

    if (!column) {
      return res.status(404).json({ error: "Column not found" });
    }

    const cards = await prisma.card.findMany({
      where: { columnId: id },
      select: { id: true },
    });

    const cardIds = cards.map((c: { id: string }) => c.id);

    await prisma.$transaction([
      prisma.cardLock.deleteMany({
        where: { cardId: { in: cardIds } },
      }),
      prisma.card.deleteMany({
        where: { columnId: id },
      }),
      prisma.column.delete({
        where: { id },
      }),
    ]);

    const io = req.app.get("io");
    if (io && column.boardId) {
      io.to(column.boardId).emit("column-deleted", { columnId: id });
    }

    return res.status(200).json({ success: true, columnId: id });
  } catch (error) {
    console.error("[ColumnController.deleteColumn] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
