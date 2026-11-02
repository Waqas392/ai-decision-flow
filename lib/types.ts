import type { Edge, Node } from "@xyflow/react";

export type Answer = "YES" | "NO";
export type NodeStatus = "idle" | "active" | "yes" | "no" | "error";

export type NodeData = {
  label: string;
  prompt: string;
  isStart?: boolean;
  status?: NodeStatus;
};
export type FlowNode = Node<NodeData, "prompt">;
export type FlowEdge = Edge<{ kind: "yes" | "no"; taken?: boolean }>;

export type TraceStep = { nodeId: string; answer: Answer; at: number };

export type Run = {
  id: string;
  status: "running" | "done" | "error";
  activeNodeId: string | null;
  trace: TraceStep[];
  startedAt: number;
  error?: string;
};
