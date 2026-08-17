import { prisma } from "../lib/prisma";

const LOCK_DURATION = 30 * 1000; //MS

export async function acquireLock(cardId:string, userId:string){
  const now = new Date();
  const newExpiresAt = new Date(now.getTime() + LOCK_DURATION);

  const existingLock = await prisma.cardLock.findUnique({
    where: {cardId},
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    }
  });

  if (existingLock && existingLock.userId !== userId && existingLock.expiresAt > now) {
    return {
      success: false,
      lock: existingLock,
      reason: 'CARD_ALREADY_LOCKED',
    }
  }


  const lock = await prisma.cardLock.upsert({
    where: { cardId },
    create: {
      cardId,
      userId,
      lockedAt: now,
      expiresAt: newExpiresAt,
    },
    update: {
      userId,
      lockedAt: now,
      expiresAt: newExpiresAt,
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
  }
}

export async function releaseLock(cardId: string, userId: string) {
  const existingLock = await prisma.cardLock.findUnique({
    where: { cardId },
  });

  if (!existingLock || existingLock.userId !== userId) {
    return { success: false, reason: 'LOCK_NOT_OWNED' };
  }

  await prisma.cardLock.delete({
    where: { cardId },
  });

  return { success: true };
}

export async function releaseUserLocks(userId: string) {
  await prisma.cardLock.deleteMany({
    where: { userId },
  });
}