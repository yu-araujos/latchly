import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Latchly — Real-Time Kanban",
  description: "Real-time collaborative Kanban board",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
