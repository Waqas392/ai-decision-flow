import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MarkerType,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import type { FlowEdge, FlowNode, NodeData } from "./types";

const COLORS = { yes: "#16a34a", no: "#dc2626" } as const;

export function makeEdge(source: string, target: string, kind: "yes" | "no"): FlowEdge {
  return {
    id: `${source}-${kind}-${target}`,
    source,
    target,
    sourceHandle: kind,
    type: kind, // "yes" and "no" are the two registered edge types
    data: { kind },
    markerEnd: { type: MarkerType.ArrowClosed, color: COLORS[kind] },
  };
}

const initialNodes: FlowNode[] = [
  {
    id: "n1",
    type: "prompt",
    position: { x: 280, y: 0 },
    data: { label: "Support?", prompt: "Is this a support request?", isStart: true },
  },
  {
    id: "n2",
    type: "prompt",
    position: { x: 40, y: 280 },
    data: { label: "Urgent?", prompt: "Is the problem urgent (outage, data loss, or a blocked user)?" },
  },
  {
    id: "n3",
    type: "prompt",
    position: { x: 520, y: 280 },
    data: { label: "Sales?", prompt: "Is the person asking about pricing, plans, or buying?" },
  },
];
const initialEdges: FlowEdge[] = [makeEdge("n1", "n2", "yes"), makeEdge("n1", "n3", "no")];
const initialInput = "My invoice shows the wrong amount and I can't log in to fix it.";

type State = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  input: string;
  onNodesChange: (c: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (c: EdgeChange<FlowEdge>[]) => void;
  onConnect: (c: Connection) => void;
  addNode: () => void;
  removeNode: (id: string) => void;
  updateNodeData: (id: string, patch: Partial<NodeData>) => void;
  setStart: (id: string) => void;
  setInput: (v: string) => void;
  setGraph: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  reset: () => void;
};

export const useFlow = create<State>()(
  persist(
    (set) => ({
      nodes: initialNodes,
      edges: initialEdges,
      input: initialInput,

      onNodesChange: (c) => set((s) => ({ nodes: applyNodeChanges(c, s.nodes) })),
      onEdgesChange: (c) => set((s) => ({ edges: applyEdgeChanges(c, s.edges) })),

      onConnect: (c) => {
        if (!c.source || !c.target || c.source === c.target) return;
        const kind = c.sourceHandle === "no" ? "no" : "yes";
        set((s) => ({
          // each handle has at most one outgoing path
          edges: [
            ...s.edges.filter((e) => !(e.source === c.source && e.sourceHandle === kind)),
            makeEdge(c.source!, c.target!, kind),
          ],
        }));
      },

      addNode: () =>
        set((s) => {
          const id = `n${Date.now().toString(36)}`;
          const i = s.nodes.length;
          const node: FlowNode = {
            id,
            type: "prompt",
            position: { x: 120 + (i % 4) * 60, y: 120 + i * 40 },
            data: { label: `Step ${i + 1}`, prompt: "", isStart: i === 0 },
          };
          return { nodes: [...s.nodes, node] };
        }),

      removeNode: (id) =>
        set((s) => {
          const nodes = s.nodes.filter((n) => n.id !== id);
          if (nodes.length && !nodes.some((n) => n.data.isStart)) {
            nodes[0] = { ...nodes[0], data: { ...nodes[0].data, isStart: true } };
          }
          return { nodes, edges: s.edges.filter((e) => e.source !== id && e.target !== id) };
        }),

      updateNodeData: (id, patch) =>
        set((s) => ({
          nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
        })),

      setStart: (id) =>
        set((s) => ({
          nodes: s.nodes.map((n) => ({ ...n, data: { ...n.data, isStart: n.id === id } })),
        })),

      setInput: (input) => set({ input }),
      setGraph: (nodes, edges) => set({ nodes, edges }),
      reset: () => set({ nodes: initialNodes, edges: initialEdges, input: initialInput }),
    }),
    {
      name: "ai-flow-graph",
      version: 1,
      // execution status is derived from the run, never stored with the graph
      partialize: (s) => ({
        input: s.input,
        edges: s.edges.map((e) => ({ ...e, data: { kind: e.data!.kind } })),
        nodes: s.nodes.map((n) => ({ ...n, data: { ...n.data, status: undefined } })),
      }),
    }
  )
);
