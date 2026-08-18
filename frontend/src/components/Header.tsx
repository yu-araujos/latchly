"use client";

import { User } from "@/types/kanban";
import { Kanban, User as UserIcon } from "lucide-react";

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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-6 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-white rounded-[10px] flex items-center justify-center">
              <Kanban className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent tracking-tight">
                Latchly
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 uppercase tracking-wider shadow-xs">
                Live Locks
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Real-time Pessimistic Locking Kanban
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-1.5 pr-3 shadow-inner">
          <div className="flex items-center gap-2.5 pl-2">
            <div className="relative">
              <img
                src={selectedUser.avatarUrl}
                alt={selectedUser.name}
                className="w-7 h-7 rounded-full bg-slate-100 ring-2 ring-indigo-500/30"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {selectedUser.name}
              </span>
              <span className="text-[10px] text-slate-500 leading-none">
                Active Profile
              </span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 my-auto"></div>

          <div className="relative flex items-center">
            <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              value={selectedUserId}
              onChange={(e) => onSelectUser(e.target.value)}
              className="bg-white text-slate-700 text-xs font-medium pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none transition-all shadow-xs"
            >
              {users.map((user) => (
                <option
                  key={user.id}
                  value={user.id}
                  className="bg-white text-slate-800"
                >
                  Switch to {user.name}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
