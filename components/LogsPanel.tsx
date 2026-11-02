"use client";
import type { FlowNode, Run } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LogsPanel({ run, nodes }: { run: Run | null; nodes: FlowNode[] }) {
  const name = (id: string) => nodes.find((n) => n.id === id)?.data.label ?? id;
  const active = run?.activeNodeId ? name(run.activeNodeId) : null;

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Execution log</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {!run && "Run the workflow to see each decision here."}
          {run?.status === "running" && "Running through Inngest…"}
          {run?.status === "done" && `Finished after ${run.trace.length} step${run.trace.length === 1 ? "" : "s"}.`}
          {run?.status === "error" && "Run failed."}
        </p>
      </div>

      <ol className="flex-1 space-y-2 overflow-y-auto p-4 text-sm">
        {run?.trace.map((t, i) => (
          <li key={`${t.nodeId}-${i}`} className="rounded-md border border-slate-200 p-2.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">{i + 1}. {name(t.nodeId)}</span>
              <span
                className={cn(
                  "rounded px-1.5 text-xs font-semibold text-white",
                  t.answer === "YES" ? "bg-green-600" : "bg-red-600"
                )}
              >
                {t.answer}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">{new Date(t.at).toLocaleTimeString()}</div>
          </li>
        ))}
        {run?.status === "running" && active && (
          <li className="rounded-md border border-indigo-300 bg-indigo-50 p-2.5 text-indigo-900">
            Asking the model: {active}
          </li>
        )}
        {run?.status === "error" && (
          <li className="rounded-md border border-red-300 bg-red-50 p-2.5 text-red-900">
            <p className="font-medium">{active ? `Failed at “${active}”` : "Run failed"}</p>
            <p className="mt-1 break-words text-xs">{run.error}</p>
          </li>
        )}
      </ol>
    </aside>
  );
}
