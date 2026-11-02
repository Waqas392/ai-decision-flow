import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decision Flow",
  description: "Visual YES/NO AI workflows powered by React Flow and Inngest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
