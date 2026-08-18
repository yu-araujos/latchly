import { Card } from "@/types/kanban";
import React, { useEffect, useState } from "react";

interface CardModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description: string }) => void;
}

export default function CardModal({
  card,
  isOpen,
  onClose,
  onSave,
}: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!card) return;
    setTitle(card.title);
    setDescription(card.description ?? "");
  }, [card]);

  useEffect(() => {
    if (!isOpen) return;

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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Editing card</h2>
        <span>Time left: {timeLeft}s</span>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={isSaving}>
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
