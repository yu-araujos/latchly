import { prisma } from "../lib/prisma";

const LOCK_DURATION = 60 * 1000; //MS

export async function acquireLock(
  cardId: string,
  userId: string,
  socketId: string,
) {
  return await prisma.$transaction(async (tx) => {
    const now = new Date();

    const existingLocks: any[] = await tx.$queryRaw`
      SELECT id, user_id, expires_at 
      FROM "card_locks" 
      WHERE card_id = ${cardId} 
      FOR UPDATE
    `;

    const existingLock = existingLocks[0];

    if (
      existingLock &&
      existingLock.user_id !== userId &&
      new Date(existingLock.expires_at) > now
    ) {
      const activeLockWithUser = await tx.cardLock.findUnique({
        where: { cardId },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      return {
        success: false,
        lock: activeLockWithUser,
        reason: "CARD_ALREADY_LOCKED",
      };
    }

    const expiresAt = new Date(now.getTime() + LOCK_DURATION);

    const lock = await tx.cardLock.upsert({
      where: { cardId },
      update: { userId, socketId, expiresAt, lockedAt: now },
      create: { cardId, userId, socketId, expiresAt, lockedAt: now },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
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
