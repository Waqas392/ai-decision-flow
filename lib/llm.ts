import OpenAI from "openai";

export const MODEL = process.env.LLM_MODEL ?? "llama-3.3-70b-versatile";

let client: OpenAI | null = null;

export function getLLM(): OpenAI | null {
  const apiKey = process.env.LLM_API_KEY ?? process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  client ??= new OpenAI({
    apiKey,
    baseURL: process.env.LLM_BASE_URL ?? "https://api.groq.com/openai/v1",
  });
  return client;
}
