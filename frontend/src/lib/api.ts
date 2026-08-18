import { Board, Card, Column } from "@/types/kanban";

const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchBoard(boardId: string): Promise<Board> {
  const res = await fetch(`${url}/boards/${boardId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch board");
  return res.json();
}

export async function createCard(data: {
  columnId: string;
  title: string;
  description?: string;
}): Promise<Card> {
  const res = await fetch(`${url}/cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create card");
  return res.json();
}

export async function updateCard(
  cardId: string,
  data: { title?: string; description?: string },
  userId: string,
): Promise<Card> {
  const res = await fetch(`${url}/cards/${cardId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...data, userId }),
  });
  if (!res.ok) throw new Error("Failed to update card");
  return res.json();
}

export async function moveCard(
  cardId: string,
  data: { targetColumnId: string; newPosition: number },
  userId: string,
): Promise<Card> {
  const res = await fetch(`${url}/cards/${cardId}/move`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      targetColumnId: data.targetColumnId,
      newPosition: data.newPosition,
      userId,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.message || errorBody.error || "Failed to move card",
    );
  }

  return res.json();
}

export async function deleteCard(
  cardId: string,
  userId: string,
): Promise<void> {
  const res = await fetch(`${url}/cards/${cardId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete card");
  }
}

export async function createColumn(
  boardId: string,
  title: string,
): Promise<Column> {
  const res = await fetch(`${url}/boards/${boardId}/columns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create column");
  return res.json();
}

export async function updateColumn(
  columnId: string,
  title: string,
): Promise<Column> {
  const res = await fetch(`${url}/columns/${columnId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update column");
  return res.json();
}

export async function deleteColumn(columnId: string): Promise<void> {
  const res = await fetch(`${url}/columns/${columnId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete column");
}
