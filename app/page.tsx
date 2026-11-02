"use client";
import dynamic from "next/dynamic";

// The graph is persisted in localStorage, so render it on the client only to avoid hydration mismatches.
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function Page() {
  return <Editor />;
}
