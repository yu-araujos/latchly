import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Latchly — Real-Time Kanban with Pessimistic Locking",
  description: "Real-time collaborative Kanban board with pessimistic locking and TTL",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
