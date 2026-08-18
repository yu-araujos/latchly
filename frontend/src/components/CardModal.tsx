import { Card } from "@/types/kanban";
import React, { useEffect, useState } from "react";
import { Clock, Edit3, Lock, Save, X } from "lucide-react";

interface CardModalProps {
  card?: Card | null;
  columnId?: string | null;
  isOpen: boolean;
  currentUserId: string;
  onClose: () => void;
  onSave: (data: { title: string; description: string }) => void;
}

export default function CardModal({
  card,
  isOpen,
  currentUserId,
  onClose,
  onSave,
}: CardModalProps) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const isLockedByOtherUser = Boolean(
    card?.lock && card?.lock.userId !== currentUserId,
  );
  const isCreating = !card;

  useEffect(() => {
    if (!card) return;
    setTitle(card.title);
    setDescription(card.description ?? "");
  }, [card]);

  useEffect(() => {
    if (!isOpen || !card || isLockedByOtherUser) return;

    setTimeLeft(60);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();

    setIsSaving(true);

    try {
      await onSave({ title, description });
      onClose();
    } catch (error) {
      alert("Error while saving.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 text-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-lg relative space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isLockedByOtherUser
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-indigo-50 text-indigo-600 border-indigo-100"
              }`}
            >
              {isLockedByOtherUser ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Edit3 className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isLockedByOtherUser
                  ? "Viewing Card (Read-Only)"
                  : isCreating
                    ? "Create New Card"
                    : "Editing Card"}
              </h2>
              <p className="text-xs text-slate-500">
                {isLockedByOtherUser
                  ? `Currently being edited by ${card?.lock?.user?.name || "another user"}`
                  : isCreating
                    ? "Add a new task to this board"
                    : "Exclusive lock active for this session"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isLockedByOtherUser && !isCreating && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold font-mono flex items-center gap-1.5 shadow-xs">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span>{timeLeft}s</span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLockedByOtherUser}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Card title..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLockedByOtherUser}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all min-h-[110px] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Add details about this task..."
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              {isLockedByOtherUser ? "Close" : "Cancel"}
            </button>

            {!isLockedByOtherUser && (
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving
                  ? isCreating
                    ? "Creating..."
                    : "Saving..."
                  : isCreating
                    ? "Create Card"
                    : "Save Changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
