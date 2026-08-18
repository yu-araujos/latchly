"use client";

import { Card } from "@/types/kanban";
import { motion } from "framer-motion";

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
      transition={{ type: "spring", duration: 1, bounce: 0.2 }}
      whileHover={isLockedByOther ? {} : { scale: 1.02 }}
      animate={{ opacity: isLockedByOther ? 0.6 : 1 }}
      onClick={handleClick}
      className={`p-4 rounded-lg border ${
        isLockedByMe
          ? "border-blue-500 bg-blue-50/5"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <h1>{card.title}</h1>
      <p>{card.description}</p>
      {isLockedByOther && (
        <span className="lock-icon">🔒 Editing: {card.lock?.user.name}</span>
      )}
    </motion.div>
  );
}
