import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-indigo-600",
        className
      )}
      {...props}
    />
  );
}
