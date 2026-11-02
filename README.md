# Decision Flow: React Flow + Inngest

A visual AI workflow builder. Each node is a prompt the model answers with `YES` or `NO`.
The graph is drawn with React Flow, and execution runs as an Inngest function, one step per node.

> **Before submitting:** add a screenshot or GIF of a successful workflow run at `docs/screenshot.png` and include it here if you want it displayed.

## Stack

Next.js 15 (App Router) · React Flow (`@xyflow/react`) · Inngest · OpenAI SDK · Tailwind + shadcn-style components · Zustand

## Setup

Install Node.js 20 or newer, then run:

```bash
npm install
cp .env.example .env.local   # macOS/Linux; on Windows use: copy .env.example .env.local
```

Add your provider key to `.env.local`, then open two terminals in the project folder:

```bash
npm run dev                  # terminal 1: http://localhost:3000
npm run inngest              # terminal 2: Inngest dev server at http://localhost:8288
```

Open http://localhost:3000, press **Run workflow**, and watch the nodes light up.
Open http://localhost:8288 to see the same run as Inngest steps.

### Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `LLM_API_KEY` | API key for any OpenAI-compatible provider | required |
| `LLM_BASE_URL` | Provider endpoint | `https://api.groq.com/openai/v1` |
| `LLM_MODEL` | Model name | `llama-3.3-70b-versatile` |
| `INNGEST_DEV` | Use the local Inngest dev server | `1` |

For OpenAI itself, set `LLM_BASE_URL=https://api.openai.com/v1` and `LLM_MODEL=gpt-4o-mini`.

## How it works

1. **Editor** (`components/Editor.tsx`): nodes have an editable name and prompt plus two handles, `YES` and `NO`.
   A connection takes its edge type from the handle it starts at. Each handle allows one outgoing edge.
   The graph is saved to `localStorage` through Zustand `persist`.
2. **Run**: `POST /api/run` validates the graph and sends a `workflow/run` event to Inngest.
3. **Execution** (`inngest/functions.ts`): starting at the start node, the function loops:
   `activate-N` step marks the node active, then `decide-N-<nodeId>` step asks the LLM. The model is
   called with `temperature: 0`, a tiny `max_tokens`, and a system prompt demanding `YES` or `NO`.
   Anything else throws, which triggers Inngest's retry. The answer picks the outgoing edge,
   and the loop continues until a node has no matching edge (or 25 steps, to stop cycles).
4. **Live state**: the function writes progress to a small server-side store (`lib/runStore.ts`),
   and the client polls `GET /api/run/[id]` every 700 ms.

## Polish features (Phase 4)

- Visual execution state: nodes turn indigo while running, then green (YES) or red (NO). Failed nodes get a red ring.
- Animated active edges: the edge leading to the running node is animated; taken edges are drawn thicker.
- Execution log panel: ordered steps with answers and timestamps, plus the error message on failure.
- JSON export/import of the workflow.
- Error handling and retries: steps retry twice automatically. A missing API key fails fast with no retries.
  After a failure, **Retry run** re-runs the workflow.

## Design notes and limits

- The run store is in memory, which is fine for local dev. Use Redis or a database in production
  (and Inngest's realtime or a webhook instead of polling).
- Groq is used through the OpenAI SDK by changing `baseURL`, which FlyRank confirmed is allowed.
- A node with no outgoing edge for its answer ends the run.
