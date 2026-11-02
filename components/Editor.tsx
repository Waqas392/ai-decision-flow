"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { DecisionEdge } from "@/components/DecisionEdge";
import { LogsPanel } from "@/components/LogsPanel";
import { PromptNode } from "@/components/PromptNode";
import { makeEdge, useFlow } from "@/lib/store";
import type { FlowEdge, FlowNode, NodeStatus, Run } from "@/lib/types";

const nodeTypes = { prompt: PromptNode };
const edgeTypes = { yes: DecisionEdge, no: DecisionEdge };

export default function Editor() {
  const { nodes, edges, input, onNodesChange, onEdgesChange, onConnect, addNode, setInput, setGraph, reset } =
    useFlow();
  const [run, setRun] = useState<Run | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Inngest runs asynchronously, so poll the run until it settles.
  useEffect(() => {
    if (!run || run.status !== "running") return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/run/${run.id}`);
        if (res.status === 404) {
          setRun((r) => (r ? { ...r, status: "error", error: "Run state was lost (did the dev server restart?)" } : r));
        } else if (res.ok) {
          setRun(await res.json());
        }
      } catch {
        /* transient network error: keep polling */
      }
    }, 700);
    return () => clearInterval(timer);
  }, [run?.id, run?.status]);

  async function start() {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          nodes: nodes.map((n) => ({
            id: n.id, label: n.data.label, prompt: n.data.prompt, isStart: !!n.data.isStart,
          })),
          edges: edges.map((e) => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start the run.");
      setRun({ id: json.runId, status: "running", activeNodeId: null, trace: [], startedAt: Date.now() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the run.");
    } finally {
      setStarting(false);
    }
  }

  // Overlay execution state onto the graph without touching the stored graph.
  const { viewNodes, viewEdges } = useMemo(() => {
    const answers = new Map(run?.trace.map((t) => [t.nodeId, t.answer]));
    const takenIds: string[] = (run?.trace ?? []).flatMap((t) => {
      const e = edges.find((x) => x.source === t.nodeId && x.sourceHandle === t.answer.toLowerCase());
      return e ? [e.id] : [];
    });
    const lastTaken = takenIds[takenIds.length - 1];

    const status = (n: FlowNode): NodeStatus => {
      if (run?.activeNodeId === n.id) return run.status === "error" ? "error" : "active";
      const a = answers.get(n.id);
      return a ? (a === "YES" ? "yes" : "no") : "idle";
    };

    return {
      viewNodes: nodes.map((n) => ({ ...n, data: { ...n.data, status: status(n) } })) as FlowNode[],
      viewEdges: edges.map((e) => ({
        ...e,
        animated: run?.status === "running" && e.id === lastTaken,
        data: { kind: e.data?.kind ?? "yes", taken: takenIds.includes(e.id) },
      })) as FlowEdge[],
    };
  }, [nodes, edges, run]);

  function exportJson() {
    const blob = new Blob([JSON.stringify({ nodes, edges, input }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "decision-flow.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importJson(file: File) {
    try {
      const json = JSON.parse(await file.text());
      if (!Array.isArray(json.nodes) || !Array.isArray(json.edges)) throw new Error();
      const ns: FlowNode[] = json.nodes.map((n: FlowNode) => ({
        id: String(n.id),
        type: "prompt",
        position: n.position ?? { x: 0, y: 0 },
        data: { label: n.data?.label ?? "Step", prompt: n.data?.prompt ?? "", isStart: !!n.data?.isStart },
      }));
      const es: FlowEdge[] = json.edges.map((e: FlowEdge) =>
        makeEdge(e.source, e.target, e.sourceHandle === "no" ? "no" : "yes")
      );
      setGraph(ns, es);
      if (typeof json.input === "string") setInput(json.input);
      setRun(null);
      setError(null);
    } catch {
      setError("That file isn't a valid workflow. Export one from this app and try again.");
    }
  }

  const running = run?.status === "running";

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
        <h1 className="mr-2 text-base font-semibold">Decision Flow</h1>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Text for the workflow to classify"
          aria-label="Workflow input"
          className="h-9 min-w-64 flex-1 rounded-md border border-slate-300 px-3 text-sm focus-visible:outline-2 focus-visible:outline-indigo-600"
        />
        <Button onClick={start} disabled={starting || running}>
          {running ? "Running…" : run?.status === "error" ? "Retry run" : "Run workflow"}
        </Button>
        <Button variant="outline" onClick={addNode}>Add node</Button>
        <Button variant="outline" onClick={exportJson}>Export JSON</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>Import JSON</Button>
        <Button variant="ghost" onClick={() => { reset(); setRun(null); }}>Reset</Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
            e.target.value = "";
          }}
        />
      </header>

      {error && (
        <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <ReactFlow
            nodes={viewNodes}
            edges={viewEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            minZoom={0.3}
          >
            <Background gap={20} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>
        <LogsPanel run={run} nodes={nodes} />
      </div>
    </div>
  );
}
