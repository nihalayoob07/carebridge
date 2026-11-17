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

export const TEXT_MODEL = Deno.env.get("GROQ_TEXT_MODEL") ?? "llama-3.3-70b-versatile";
export const VISION_MODEL = Deno.env.get("GROQ_VISION_MODEL") ?? "meta-llama/llama-4-scout-17b-16e-instruct";

// Groq is OpenAI-compatible. JSON mode returns a parsed object.
export async function groqJSON(model: string, messages: unknown[]): Promise<any> {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) throw new Error("GROQ_API_KEY is not set on the Supabase project");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0.2, response_format: { type: "json_object" } }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
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
