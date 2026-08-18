"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, X, Check } from "lucide-react";

interface AddColumnButtonProps {
  onAdd: (title: string) => Promise<void> | void;
}

export default function AddColumnButton({ onAdd }: AddColumnButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAdd(title.trim());
      setTitle("");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to add column:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setTitle("");
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="w-80 shrink-0 h-28 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white/80 transition-all flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 font-semibold cursor-pointer shadow-xs"
      >
        <Plus className="w-5 h-5" />
        <span>Add Column</span>
      </button>
    );
  }

  return (
    <div className="w-80 shrink-0 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Column title (e.g., Review)..."
          disabled={isSubmitting}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
        />

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="flex-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            {isSubmitting ? "Adding..." : "Add Column"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
