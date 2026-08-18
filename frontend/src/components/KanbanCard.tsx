"use client";

import { Card } from "@/types/kanban";
import { motion } from "framer-motion";
import { Lock, Sparkles, User as UserIcon } from "lucide-react";

interface kanbanCardProps {
  card: Card;
  currentUserId: string;
  onCardClick: (cardId: string) => void;
}

export default function KanbanCard({
  card,
  currentUserId,
  onCardClick,
}: kanbanCardProps) {
  const isLockedByMe = Boolean(card.lock && card.lock.userId === currentUserId);
  const isLockedByOther = Boolean(
    card.lock && card.lock.userId !== currentUserId,
  );

  function handleClick() {
    if (isLockedByOther) return;
    onCardClick(card.id);
  }

  return (
    <motion.div
      layout
      transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
      whileHover={isLockedByOther ? {} : { scale: 1.02, y: -2 }}
      animate={{ opacity: isLockedByOther ? 0.85 : 1 }}
      onClick={handleClick}
      className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between group ${
        isLockedByMe
          ? "border-indigo-500/90 bg-indigo-50/70 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/30"
          : isLockedByOther
            ? "border-amber-400/90 bg-amber-50/70 opacity-90 border-dashed cursor-not-allowed ring-1 ring-amber-400/30"
            : "border-slate-200/90 bg-white hover:border-indigo-300 shadow-xs hover:shadow-md cursor-pointer"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
            {card.title}
          </h3>
        </div>

        {card.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-3">
            {card.description}
          </p>
        )}
      </div>

      <div className="mt-2 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
        {isLockedByMe ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold shadow-xs">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            Editing by you
          </span>
        ) : isLockedByOther ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300/80 font-semibold animate-pulse shadow-xs">
            <Lock className="w-3 h-3 text-amber-600" />
            Locked by {card.lock?.user?.name ?? "another user"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-slate-400 font-medium group-hover:text-indigo-600 transition-colors">
            <UserIcon className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
            Click to edit
          </span>
        )}
      </div>
    </motion.div>
  );
}
