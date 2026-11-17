import { createClient } from "npm:@supabase/supabase-js@2";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Client that acts as the calling user, so RLS decides what they may touch.
export const userClient = (req: Request) =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

export const adminClient = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

export const TEXT_MODEL = "text";
export const VISION_MODEL = "vision";

// Groq retires models often, so pick from the live model list (env vars override).
const TEXT_PREFS = ["llama-3.3-70b", "gpt-oss-120b", "kimi-k2", "qwen3", "llama-4-maverick", "llama-4-scout", "gpt-oss-20b", "llama"];
const VISION_PREFS = ["llama-4-maverick", "llama-4-scout", "vision", "qwen2.5-vl", "qwen-vl", "gemma-3", "qwen"];
let models: string[] | null = null;
async function pickModel(kind: "text" | "vision", key: string) {
  const env = Deno.env.get(kind === "text" ? "GROQ_TEXT_MODEL" : "GROQ_VISION_MODEL");
  if (env) return env;
  if (!models) {
    const r = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${key}` } });
    models = ((await r.json()).data ?? []).filter((m: any) => m.active !== false).map((m: any) => m.id as string);
  }
  const usable = models!.filter((id) => !/whisper|tts|guard|playai|orpheus|compound|prompt/i.test(id));
  for (const p of kind === "text" ? TEXT_PREFS : VISION_PREFS) {
    const hit = usable.find((id) => id.toLowerCase().includes(p));
    if (hit) return hit;
  }
  throw new Error(`No Groq ${kind} model found. Available: ${usable.join(", ")}`);
}

// Groq is OpenAI-compatible. JSON mode returns a parsed object.
export async function groqJSON(kind: string, messages: unknown[]): Promise<any> {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) throw new Error("GROQ_API_KEY is not set on the Supabase project");
  const model = await pickModel(kind === VISION_MODEL ? "vision" : "text", key);
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    // JSON mode requires the word "json" in the prompt on some models.
    body: JSON.stringify({ model, messages: [...messages, { role: "system", content: "Respond with one valid JSON object only." }], temperature: 0.2, response_format: { type: "json_object" } }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status} (${model}): ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// Shared vocabulary so AI-extracted needs line up with caregiver skills.
export const SKILLS = [
  "medication management", "wound care", "diabetes management", "hypertension monitoring", "post-operative care",
  "catheter care", "palliative care", "respiratory care", "elderly companionship", "mobility assistance",
  "dementia care", "personal hygiene", "meal preparation", "physiotherapy", "stroke rehabilitation",
  "parkinsons care", "fall prevention", "night care",
];
