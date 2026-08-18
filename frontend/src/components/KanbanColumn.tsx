"use client";

import { Column } from "@/types/kanban";
import KanbanCard from "./KanbanCard";
import { CheckCircle2, Clock, Layers, ListTodo } from "lucide-react";

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
  const getColumnIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("done") || t.includes("concluíd")) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (t.includes("progress") || t.includes("andamento")) {
      return <Clock className="w-4 h-4 text-amber-600" />;
    }
    if (t.includes("to do") || t.includes("fazer")) {
      return <ListTodo className="w-4 h-4 text-indigo-600" />;
    }
    return <Layers className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="w-80 flex-shrink-0 bg-slate-200/80 backdrop-blur-md rounded-2xl p-4 border border-slate-300/80 shadow-sm flex flex-col max-h-[calc(100vh-9rem)]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-300/70">
        <div className="flex items-center gap-2">
          {getColumnIcon(column.title)}
          <h2 className="text-sm font-bold text-slate-800 tracking-wide">
            {column.title}
          </h2>
        </div>
        <span className="bg-slate-300/70 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-slate-400/30">
          {column.cards.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-1">
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
