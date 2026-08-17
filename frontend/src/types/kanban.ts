export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string
}

export type CardLock = {
  id: string;
  cardId: string;
  userId: string;
  lockedAt: string;
  expiresAt: string;
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

export type Card = {
  id: string
  columnId: string
  title: string;
  description?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  lock?: CardLock | null;
}

export type Column = {
 id: string
 boardId: string
 title: string,
 position: number;
 createdAt: string
 cards: Card[] 
}

export type Board = {
  id: string
  title: string
  createdAt: string
  columns: Column[]
}