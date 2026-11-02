
import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { getLLM, MODEL } from "@/lib/llm";
import { updateRun } from "@/lib/runStore";
import type { Answer, TraceStep } from "@/lib/types";

type WNode = {
  id: string;
  label: string;
  prompt: string;
  isStart?: boolean;
};

type WEdge = {
  source: string;
  target: string;
  sourceHandle: string | null;
};

type RunEvent = {
  runId: string;
  nodes: WNode[];
  edges: WEdge[];
  input: string;
};

const MAX_STEPS = 25;

export const runWorkflow = inngest.createFunction(
  {
    id: "run-workflow",
    retries: 2,

    onFailure: async ({ event, error }) => {
      const runId = (event.data.event.data as RunEvent).runId;

      updateRun(runId, {
        status: "error",
        error: error.message,
      });
    },
  },

  { event: "workflow/run" },

  async ({ event, step }) => {
    const { runId, nodes, edges, input } = event.data as RunEvent;

    const byId = new Map(nodes.map((node) => [node.id, node]));

    let current: WNode | undefined =
      nodes.find((node) => node.isStart) ?? nodes[0];

    const trace: TraceStep[] = [];

    for (let i = 0; current && i < MAX_STEPS; i++) {
      const node = current;

      await step.run(`activate-${i}`, () => {
        updateRun(runId, {
          status: "running",
          activeNodeId: node.id,
          trace: [...trace],
        });
      });

      const result = await step.run(
        `decide-${i}-${node.id}`,
        async () => {
          const llm = getLLM();

          if (!llm) {
            throw new NonRetriableError(
              "Missing LLM_API_KEY. Add it to .env.local and restart."
            );
          }

          const res = await llm.chat.completions.create({
            model: MODEL,
            temperature: 0.6,
            max_completion_tokens: 512,
            reasoning_effort: "low",
            include_reasoning: false,

            messages: [
              {
                role: "system",
                content:
                  "You are a decision classifier. Answer with exactly one word: YES or NO. Do not provide explanations, punctuation, or additional text.",
              },
              {
                role: "user",
                content: `${node.prompt}\n\nInput: ${input}`,
              },
            ],
          });

          const choice = res.choices[0];
          const raw = choice?.message?.content ?? "";

          const answer = raw
            .replace(/[^a-zA-Z]/g, "")
            .toUpperCase();

          if (answer !== "YES" && answer !== "NO") {
            throw new Error(
              `Invalid model response. Content: "${raw.trim().slice(0, 100)}". Finish reason: ${choice?.finish_reason ?? "unknown"}`
            );
          }

          return {
            answer: answer as Answer,
            at: Date.now(),
          };
        }
      );

      trace.push({
        nodeId: node.id,
        answer: result.answer,
        at: result.at,
      });

      const edge = edges.find(
        (edge) =>
          edge.source === node.id &&
          edge.sourceHandle === result.answer.toLowerCase()
      );

      current = edge ? byId.get(edge.target) : undefined;
    }

    await step.run("finish", () => {
      updateRun(runId, {
        status: "done",
        activeNodeId: null,
        trace: [...trace],
      });
    });

    return {
      runId,
      trace,
    };
  }
);
