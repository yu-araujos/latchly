import { prisma } from "../lib/prisma";

const LOCK_DURATION = 60 * 1000; //MS

export async function acquireLock(
  cardId: string,
  userId: string,
  socketId: string,
) {
  return await prisma.$transaction(async (tx) => {
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + LOCK_DURATION);

    const existingLock = await tx.cardLock.findUnique({
      where: { cardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (
      existingLock &&
      existingLock.userId !== userId &&
      existingLock.expiresAt > now
    ) {
      return {
        success: false,
        lock: existingLock,
        reason: "CARD_ALREADY_LOCKED",
      };
    }

    const lock = await tx.cardLock.upsert({
      where: { cardId },
      create: {
        cardId,
        userId,
        lockedAt: now,
        expiresAt: newExpiresAt,
        socketId,
      },
      update: {
        userId,
        lockedAt: now,
        expiresAt: newExpiresAt,
        socketId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      lock,
    };
  });
}

export async function releaseLock(
  cardId: string,
  userId: string,
  socketId: string,
) {
  const existingLock = await prisma.cardLock.findUnique({
    where: { cardId },
  });

  if (
    !existingLock ||
    existingLock.userId !== userId ||
    existingLock.socketId !== socketId
  ) {
    return { success: false, reason: "LOCK_NOT_OWNED" };
  }

  await prisma.cardLock.delete({
    where: { cardId },
  });

  return { success: true };
}

export async function releaseLocksBySocket(socketId: string) {
  return await prisma.$transaction(async (tx) => {
    const locks = await tx.cardLock.findMany({
      where: { socketId },
      select: { cardId: true },
    });

    await tx.cardLock.deleteMany({
      where: { socketId },
    });

    return locks.map((l) => l.cardId);
  });
}
