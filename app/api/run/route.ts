import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { updateRun } from "@/lib/runStore";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const nodes = body?.nodes;
  const edges = body?.edges ?? [];
  const input = String(body?.input ?? "");

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return NextResponse.json({ error: "Add at least one node before running." }, { status: 400 });
  }
  if (nodes.length > 100) {
    return NextResponse.json({ error: "A workflow can contain at most 100 nodes." }, { status: 400 });
  }
  if (nodes.some((n: { id?: unknown; prompt?: unknown }) =>
    typeof n.id !== "string" || !n.id.trim() || typeof n.prompt !== "string" || !n.prompt.trim()
  )) {
    return NextResponse.json({ error: "Every node needs an ID and a non-empty prompt." }, { status: 400 });
  }
  if (nodes.some((n: { prompt: string }) => n.prompt.length > 2000)) {
    return NextResponse.json({ error: "Node prompts must be 2,000 characters or fewer." }, { status: 400 });
  }
  if (new Set(nodes.map((n: { id: string }) => n.id)).size !== nodes.length) {
    return NextResponse.json({ error: "Node IDs must be unique." }, { status: 400 });
  }
  const ids = new Set(nodes.map((n: { id: string }) => n.id));
  const starts = nodes.filter((n: { isStart?: boolean }) => n.isStart);
  if (starts.length > 1) {
    return NextResponse.json({ error: "Choose only one start node." }, { status: 400 });
  }
  if (!Array.isArray(edges) || edges.some((e: { source?: string; target?: string; sourceHandle?: string }) =>
    typeof e.source !== "string" || typeof e.target !== "string" ||
    !ids.has(e.source) || !ids.has(e.target) || !["yes", "no"].includes(e.sourceHandle ?? "")
  )) {
    return NextResponse.json({ error: "Each connection must link existing nodes from a YES or NO handle." }, { status: 400 });
  }
  if (input.length > 10000) {
    return NextResponse.json({ error: "Workflow input must be 10,000 characters or fewer." }, { status: 400 });
  }

  const runId = crypto.randomUUID();
  updateRun(runId, { status: "running", activeNodeId: null, trace: [], startedAt: Date.now() });

  try {
    await inngest.send({ name: "workflow/run", data: { runId, nodes, edges, input } });
  } catch {
    updateRun(runId, { status: "error", error: "Could not reach Inngest." });
    return NextResponse.json(
      { error: "Could not reach Inngest. Start it with `npm run inngest`." },
      { status: 502 }
    );
  }
  return NextResponse.json({ runId });
}
