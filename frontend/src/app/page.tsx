"use client";

import CardModal from "@/components/CardModal";
import Header from "@/components/Header";
import KanbanColumn from "@/components/KanbanColumn";
import { useBoardSocket } from "@/hooks/useBoardSocket";
import {
  createCard,
  createColumn,
  deleteCard,
  deleteColumn,
  fetchBoard,
  moveCard,
  updateCard,
  updateColumn,
} from "@/lib/api";
import { Board, Card } from "@/types/kanban";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import AddColumnButton from "@/components/AddColumnButton";

// Architectural Note: Using a fixed Board ID intentionally for the single-board real-time demo showcase.
// The backend schema and socket rooms fully support dynamic multi-board routing via `/boards/[id]`.
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

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const previousBoard = board;

    setBoard((prev) => {
      if (!prev) return prev;

      const sourceCol = prev.columns.find((c) => c.id === source.droppableId);
      const destinationCol = prev.columns.find(
        (c) => c.id === destination.droppableId,
      );

      if (!sourceCol || !destinationCol) return prev;

      const sourceCards = [...sourceCol.cards];

      const destinationCards =
        source.droppableId === destination.droppableId
          ? sourceCards
          : [...destinationCol.cards];

      const [moveCard] = sourceCards.splice(source.index, 1);

      if (!moveCard) return prev;

      const updatedMovedCard = {
        ...moveCard,
        columnId: destination.droppableId,
        position: destination.index,
      };

      destinationCards.splice(destination.index, 0, updatedMovedCard);

      return {
        ...prev,
        columns: prev.columns.map((col) => {
          if (
            col.id === source.droppableId &&
            source.droppableId === destination.droppableId
          ) {
            return { ...col, cards: destinationCards };
          }
          if (col.id === source.droppableId) {
            return { ...col, cards: sourceCards };
          }
          if (col.id === destination.droppableId) {
            return { ...col, cards: destinationCards };
          }
          return col;
        }),
      };
    });

    try {
      await moveCard(
        draggableId,
        {
          targetColumnId: destination.droppableId,
          newPosition: destination.index,
        },
        selectedUserId,
      );
    } catch (error) {
      console.error("Failed to move card on server:", error);
      setBoard(previousBoard);
    }
  }

  async function handleDelete(cardId: string) {
    try {
      await deleteCard(cardId, selectedUserId);

      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            cards: col.cards.filter((c) => c.id !== cardId),
          })),
        };
      });
      handleCloseEdit();
    } catch (error) {
      console.error("Failed to delete card:", error);
    }
  }

  async function handleCreateColumn(title: string) {
    try {
      const newCol = await createColumn(BOARD_ID, title);
      setBoard((prev) => {
        if (!prev) return prev;
        const exists = prev.columns.some((c) => c.id === newCol.id);
        if (exists) return prev;
        return {
          ...prev,
          columns: [...prev.columns, { ...newCol, cards: [] }],
        };
      });
    } catch (error) {
      console.error("Failed to create column:", error);
    }
  }

  async function handleUpdateColumnTitle(columnId: string, title: string) {
    try {
      await updateColumn(columnId, title);
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((c) =>
            c.id === columnId ? { ...c, title } : c,
          ),
        };
      });
    } catch (error) {
      console.error("Failed to update column:", error);
    }
  }

  async function handleDeleteColumn(columnId: string) {
    try {
      await deleteColumn(columnId);
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.filter((c) => c.id !== columnId),
        };
      });
    } catch (error) {
      console.error("Failed to delete column:", error);
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-6 overflow-x-auto p-6 items-start w-full">
          {board?.columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              currentUserId={selectedUserId}
              onCardClick={handleOpenEdit}
              onAddCard={handleCreate}
              onDeleteColumn={handleDeleteColumn}
              onUpdateTitle={handleUpdateColumnTitle}
            />
          ))}

          <AddColumnButton onAdd={handleCreateColumn} />
        </div>

        {Boolean(editingCard || creatingColumnId) && (
          <CardModal
            card={editingCard}
            isOpen={Boolean(editingCard || creatingColumnId)}
            currentUserId={selectedUserId}
            onClose={handleCloseEdit}
            onSave={handleSaveCard}
            onDelete={handleDelete}
          />
        )}
      </DragDropContext>
    </main>
  );
}
