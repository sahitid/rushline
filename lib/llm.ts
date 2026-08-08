import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export function hasLLM(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function llmText(prompt: string, system?: string): Promise<string | null> {
  if (!hasLLM()) return null;
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system,
      prompt,
    });
    return text.trim();
  } catch {
    return null;
  }
}

export async function llmJSON<T>(prompt: string, system?: string): Promise<T | null> {
  const raw = await llmText(
    prompt +
      "\n\nRespond with ONLY valid minified JSON, no markdown fences, no prose.",
    system
  );
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}
