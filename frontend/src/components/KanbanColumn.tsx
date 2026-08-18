"use client";

import { Column } from "@/types/kanban";
import KanbanCard from "./KanbanCard";
import {
  Check,
  CheckCircle2,
  Clock,
  Layers,
  ListTodo,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { Droppable } from "@hello-pangea/dnd";
import { useState, useRef, useEffect } from "react";

interface KanbanColumnProps {
  column: Column;
  currentUserId: string;
  onCardClick: (cardId: string) => void;
  onAddCard: (columnId: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onUpdateTitle?: (columnId: string, newTitle: string) => void;
}

export default function KanbanColumn({
  column,
  currentUserId,
  onCardClick,
  onAddCard,
  onDeleteColumn,
  onUpdateTitle,
}: KanbanColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleValue(column.title);
  }, [column.title]);

  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = () => {
    const trimmed = titleValue.trim();
    if (!trimmed || trimmed === column.title) {
      setTitleValue(column.title);
      setIsEditingTitle(false);
      return;
    }
    onUpdateTitle?.(column.id, trimmed);
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      setTitleValue(column.title);
      setIsEditingTitle(false);
    }
  };

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
    <div className="w-80 shrink-0 bg-slate-200/80 backdrop-blur-md rounded-2xl p-4 border border-slate-300/80 shadow-sm flex flex-col max-h-[calc(100vh-9rem)]">
      <div className="group flex items-center justify-between mb-4 pb-3 border-b border-slate-300/70">
        <div className="flex items-center gap-2 flex-1 mr-2 min-w-0">
          {getColumnIcon(column.title)}

          {isEditingTitle ? (
            <div className="flex items-center flex-1 min-w-0 border-b-2 border-indigo-600 pb-0.5">
              <input
                ref={inputRef}
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none px-0.5 py-0"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSaveTitle}
                className="text-emerald-600 hover:text-emerald-700 p-0.5 cursor-pointer shrink-0 transition-transform active:scale-95"
                title="Save title"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h2
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-bold text-slate-800 tracking-wide truncate cursor-pointer hover:bg-slate-300/50 px-1.5 py-0.5 -mx-1.5 rounded-md transition-colors"
              title="Click to edit column title"
            >
              {column.title}
            </h2>
          )}

          <span className="bg-slate-300/70 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-slate-400/30 shrink-0">
            {column.cards.length}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onAddCard(column.id)}
            className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Add card"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              const hasCards = column.cards.length > 0;
              const confirmMsg = hasCards
                ? `Are you sure you want to delete "${column.title}" and its ${column.cards.length} card(s)?`
                : `Are you sure you want to delete "${column.title}"?`;

              if (window.confirm(confirmMsg)) {
                onDeleteColumn?.(column.id);
              }
            }}
            className="max-w-0 opacity-0 -mr-2 group-hover:max-w-8 group-hover:opacity-100 group-hover:mr-0 overflow-hidden transition-all duration-200 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer flex items-center justify-center shrink-0"
            title="Delete column"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Droppable droppableId={column.id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1 min-h-30"
          >
            {column.cards.map((card, index) => (
              <KanbanCard
                key={card.id}
                card={card}
                currentUserId={currentUserId}
                onCardClick={onCardClick}
                index={index}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
