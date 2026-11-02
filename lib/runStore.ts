import type { Run } from "./types";

// Next.js route handlers and the Inngest serve route share one Node process in dev,
// so a globalThis Map survives hot reloads and is visible to both. Swap for Redis/DB in prod.
const g = globalThis as unknown as { __flowRuns?: Map<string, Run> };
const runs: Map<string, Run> = (g.__flowRuns ??= new Map());

export function getRun(id: string) {
  return runs.get(id);
}

export function updateRun(id: string, patch: Partial<Run>) {
  const prev: Run = runs.get(id) ?? {
    id,
    status: "running",
    activeNodeId: null,
    trace: [],
    startedAt: Date.now(),
  };
  runs.set(id, { ...prev, ...patch, id });
}
