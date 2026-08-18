import { Board, Card, Column } from "@/types/kanban";
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

    socket.on("card-created", ({ card }: { card: Card }) => {
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === card.columnId) {
              const alreadyExists = col.cards.some((c) => c.id === card.id);
              if (alreadyExists) return col;
              return {
                ...col,
                cards: [...col.cards, card],
              };
            }
            return col;
          }),
        };
      });
    });

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

    socket.on("card-updated", ({ card }: { card: Card }) => {
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            cards: col.cards.map((c) => (c.id === card.id ? card : c)),
          })),
        };
      });
    });

    socket.on("card-moved", ({ card }: { card: Card }) => {
      setBoard((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          columns: prev.columns.map((col) => {
            const filteredCards = col.cards.filter((c) => c.id !== card.id);

            if (col.id === card.columnId) {
              const updatedCards = [...filteredCards, card].sort(
                (a, b) => a.position - b.position,
              );
              return { ...col, cards: updatedCards };
            }
            return { ...col, cards: filteredCards };
          }),
        };
      });
    });

    socket.on(
      "card-deleted",
      ({ cardId, columnId }: { cardId: string; columnId: string }) => {
        setBoard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            columns: prev.columns.map((col) => {
              if (col.id === columnId) {
                return {
                  ...col,
                  cards: col.cards.filter((c) => c.id !== cardId),
                };
              }
              return col;
            }),
          };
        });
      },
    );

    socket.on("column-created", ({ column }: { column: Column }) => {
      setBoard((prev) => {
        if (!prev) return prev;
        const exists = prev.columns.some((c) => c.id === column.id);
        if (exists) return prev;
        return {
          ...prev,
          columns: [...prev.columns, { ...column, cards: column.cards ?? [] }],
        };
      });
    });

    socket.on("column-updated", ({ column }: { column: Column }) => {
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((c) =>
            c.id === column.id ? { ...c, title: column.title } : c,
          ),
        };
      });
    });

    socket.on("column-deleted", ({ columnId }: { columnId: string }) => {
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.filter((c) => c.id !== columnId),
        };
      });
    });

    return () => {
      socket.off("card-created");
      socket.off("lock-acquired");
      socket.off("lock-released");
      socket.off("card-updated");
      socket.off("card-moved");
      socket.off("card-deleted");
      socket.off("column-created");
      socket.off("column-updated");
      socket.off("column-deleted");
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
