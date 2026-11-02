"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFlow } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { FlowNode } from "@/lib/types";

const ring: Record<string, string> = {
  idle: "border-slate-300 bg-white",
  active: "border-indigo-500 bg-indigo-50 ring-4 ring-indigo-200",
  yes: "border-green-600 bg-green-50",
  no: "border-red-600 bg-red-50",
  error: "border-red-600 bg-red-50 ring-4 ring-red-200",
};

export function PromptNode({ id, data }: NodeProps<FlowNode>) {
  const update = useFlow((s) => s.updateNodeData);
  const remove = useFlow((s) => s.removeNode);
  const setStart = useFlow((s) => s.setStart);
  const status = data.status ?? "idle";

  return (
    <div className={cn("w-64 rounded-lg border-2 p-3 shadow-sm transition-colors", ring[status])}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-slate-500" />

      <div className="mb-2 flex items-center gap-2">
        <input
          value={data.label}
          onChange={(e) => update(id, { label: e.target.value })}
          aria-label="Node name"
          className="nodrag min-w-0 flex-1 rounded bg-transparent px-1 text-sm font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-600"
        />
        {status !== "idle" && (
          <span className="rounded bg-slate-900/80 px-1.5 text-[11px] font-semibold text-white">
            {status === "active" ? "running" : status === "error" ? "failed" : status.toUpperCase()}
          </span>
        )}
      </div>

      <Textarea
        value={data.prompt}
        onChange={(e) => update(id, { prompt: e.target.value })}
        placeholder="A question the model can answer with YES or NO"
        rows={3}
        aria-label="Node prompt"
        className="nodrag nowheel"
      />

      <div className="mt-2 flex items-center justify-between">
        {data.isStart ? (
          <span className="text-xs font-medium text-indigo-700">Start node</span>
        ) : (
          <Button variant="ghost" size="sm" className="nodrag" onClick={() => setStart(id)}>
            Make start
          </Button>
        )}
        <Button variant="ghost" size="sm" className="nodrag" onClick={() => remove(id)}>
          Delete
        </Button>
      </div>

      <div className="relative mt-3 h-5 text-[11px] font-semibold">
        <span className="absolute left-[25%] -translate-x-1/2 text-green-700">YES</span>
        <span className="absolute left-[75%] -translate-x-1/2 text-red-700">NO</span>
      </div>
      <Handle id="yes" type="source" position={Position.Bottom} style={{ left: "25%" }} className="!h-3 !w-3 !bg-green-600" />
      <Handle id="no" type="source" position={Position.Bottom} style={{ left: "75%" }} className="!h-3 !w-3 !bg-red-600" />
    </div>
  );
}
