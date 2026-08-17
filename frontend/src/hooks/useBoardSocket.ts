import { Board } from "@/types/kanban";
import React, { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useBoardSocket(
  boardId: string,
  userId: string,
  setBoard: React.Dispatch<React.SetStateAction<Board | null>>,
) {
  const url = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";
  const clientSocket = useRef<Socket | null>(null);

  useEffect(() => {
    if (!boardId || !userId) return;

    const socket = io(url);
    clientSocket.current = socket;

    socket.emit("join-board", { boardId, userId });

    socket.on("lock-acquired", ({ cardId, lock }) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          columns: prevBoard.columns.map((col) => {
            return {
              ...col,
              cards: col.cards.map((card) => {
                return card.id === cardId ? { ...card, lock: lock } : card;
              }),
            };
          }),
        };
      });
    });

    socket.on("lock-released", ({ cardId }) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          columns: prevBoard.columns.map((col) => {
            return {
              ...col,
              cards: col.cards.map((card) => {
                return card.id === cardId ? { ...card, lock: null } : card;
              }),
            };
          }),
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [boardId, userId]);

  function claimLock(cardId: string) {
    if (!clientSocket.current) return;

    return clientSocket.current.emit("claim-lock", { boardId, cardId, userId });
  }

  function releaseLock(cardId: string) {
    if (!clientSocket.current) return;
    return clientSocket.current.emit("release-lock", {
      boardId,
      cardId,
      userId,
    });
  }

  return { claimLock, releaseLock };
}
