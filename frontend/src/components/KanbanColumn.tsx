"use client";

import { Column } from "@/types/kanban";
import KanbanCard from "./KanbanCard";

interface KanbanColumnProps {
  column: Column;
  currentUserId: string;
  onCardClick: (cardId: string) => void;
}

export default function KanbanColumn({
  column,
  currentUserId,
  onCardClick,
}: KanbanColumnProps) {
  return (
    <div className="w-80 flex-shrink-0">
      <h1 className="text-xl font-bold mb-4">
        {column.title} - {column.cards.length}
      </h1>
      <div className="flex flex-col gap-3">
        {column.cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            currentUserId={currentUserId}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}
