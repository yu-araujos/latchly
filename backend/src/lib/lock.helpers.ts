import { CardLock } from "@prisma/client";

export function isLockedByOther(
  lock: CardLock | null,
  requestingUserId: string,
): boolean {
  if (!lock) return false;
  if (lock.userId === requestingUserId) return false;
  return lock.expiresAt > new Date();
}
