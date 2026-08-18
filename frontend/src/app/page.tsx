"use client";

import CardModal from "@/components/CardModal";
import Header from "@/components/Header";
import KanbanColumn from "@/components/KanbanColumn";
import { useBoardSocket } from "@/hooks/useBoardSocket";
import { createCard, fetchBoard, updateCard } from "@/lib/api";
import { Board, Card } from "@/types/kanban";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const BOARD_ID = "7035e33a-1277-4a81-9932-d654bd7eb64d";

export default function Home() {
  const [board, setBoard] = useState<Board | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>(
    "3c8991cb-c8fa-4044-8f55-d8136533bb74",
  );
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingColumnId, setCreatingColumnId] = useState<string | null>(null);

  const { claimLock, releaseLock } = useBoardSocket(
    BOARD_ID,
    selectedUserId,
    setBoard,
  );

  useEffect(() => {
    async function loadBoard() {
      try {
        const data = await fetchBoard(BOARD_ID);
        setBoard(data);
      } finally {
        setLoading(false);
      }
    }
    loadBoard();
  }, []);

  function handleCreate(columnId: string) {
    setEditingCard(null);
    setCreatingColumnId(columnId);
  }

  function handleOpenEdit(cardId: string) {
    const cardFounded = board?.columns
      .flatMap((c) => c.cards)
      .find((c) => c.id === cardId);

    if (!cardFounded) return;

    const isLockedByOtherUser = Boolean(
      cardFounded.lock && cardFounded.lock.userId !== selectedUserId,
    );

    if (!isLockedByOtherUser) {
      claimLock(cardId);
    }

    setEditingCard(cardFounded);
  }

  function handleCloseEdit() {
    const isLockedByOtherUser = Boolean(
      editingCard?.lock && editingCard?.lock.userId !== selectedUserId,
    );

    if (editingCard && !isLockedByOtherUser) {
      releaseLock(editingCard.id);
    }
    setEditingCard(null);
    setCreatingColumnId(null);
  }

  async function handleSaveCard(data: { title: string; description: string }) {
    if (creatingColumnId) {
      const newCard = await createCard({
        columnId: creatingColumnId,
        ...data,
      });

      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === creatingColumnId) {
              const alreadyExists = col.cards.some((c) => c.id === newCard.id);
              if (alreadyExists) return col;
              return { ...col, cards: [...col.cards, newCard] };
            }
            return col;
          }),
        };
      });

      setCreatingColumnId(null);
      return;
    }

    if (editingCard) {
      const updatedCard = await updateCard(
        editingCard.id,
        data,
        selectedUserId,
      );

      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            cards: col.cards.map((card) =>
              card.id === updatedCard.id ? updatedCard : card,
            ),
          })),
        };
      });

      setEditingCard(null);
    }
  }

  if (loading || !board) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-600 font-medium text-sm">
          Loading Latchly board...
        </p>
      </div>
    );
  }

  return (
    <main className="h-screen bg-gradient-to-br from-indigo-50/70 via-slate-100 to-sky-50 text-slate-800 flex flex-col font-sans antialiased overflow-hidden">
      <Header
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
      />

      <div className="flex-1 flex gap-6 overflow-x-auto p-6 items-start max-w-7xl mx-auto w-full">
        {board?.columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            currentUserId={selectedUserId}
            onCardClick={handleOpenEdit}
            onAddCard={handleCreate}
          />
        ))}
      </div>

      {Boolean(editingCard || creatingColumnId) && (
        <CardModal
          card={editingCard}
          isOpen={Boolean(editingCard || creatingColumnId)}
          currentUserId={selectedUserId}
          onClose={handleCloseEdit}
          onSave={handleSaveCard}
        />
      )}
    </main>
  );
}
