"use client";

import { User } from "@/types/kanban";
import { Kanban } from "lucide-react";

interface HeaderProps {
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
}

const users: User[] = [
  {
    id: "347fafa2-442f-4524-965a-a6d5b0b53afa",
    name: "Bob",
    email: "bob@email.com",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
  {
    id: "3c8991cb-c8fa-4044-8f55-d8136533bb74",
    name: "John",
    email: "john@email.com",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  },
];

export default function Header({ selectedUserId, onSelectUser }: HeaderProps) {
  const selectedUser = users.find((u) => u.id === selectedUserId) ?? users[0];

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-sm flex items-center justify-center">
            <div className="h-full w-full bg-white rounded-[10px] flex items-center justify-center">
              <Kanban className="w-4.5 h-4.5 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Latchly
          </h1>
        </div>

        {/* User Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedUser.avatarUrl}
              alt={selectedUser.name}
              className="w-6 h-6 rounded-full border border-slate-200"
            />
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              User:
            </span>
          </div>

          <select
            value={selectedUserId}
            onChange={(e) => onSelectUser(e.target.value)}
            className="bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

