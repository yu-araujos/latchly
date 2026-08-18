"use client";

import { User } from "@/types/kanban";

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
    name: "Alice",
    email: "alice@email.com",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  },
];

export default function Header({ selectedUserId, onSelectUser }: HeaderProps) {
  return (
    <div className="p-4">
      <h1>Latchly</h1>
      <div className="flex items-center justify-between">
        <select onChange={(e) => onSelectUser(e.target.value)}>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
