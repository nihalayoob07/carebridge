// SQL pre-filter (skills ∩ needs, city, budget) then Groq re-ranks with a one-line reason each.
import { cors, json, userClient, groqJSON, TEXT_MODEL } from "../_shared/common.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const sb = userClient(req);
  const { patient_id, max_rate } = await req.json();

  const { data: patient } = await sb.from("patients")
    .select("name, dob, gender, conditions, needs, allergies, city, ai_summary").eq("id", patient_id).single();
  if (!patient) return json({ error: "patient not found" }, 404);

  const { data: candidates, error } = await sb.rpc("match_caregivers", { pid: patient_id, max_rate: max_rate ?? null, lim: 8 });
  if (error) return json({ error: error.message }, 500);
  if (!candidates?.length) return json({ matches: [] });

  try {
    const ranked = await groqJSON(TEXT_MODEL, [
      { role: "system", content: "You match elderly patients in India with home caregivers. Be concise and specific." },
      { role: "user", content: `Patient: ${JSON.stringify(patient)}
Caregivers: ${JSON.stringify(candidates.map((c: any) => ({ id: c.id, name: c.name, type: c.type, years_exp: c.years_exp, rating: c.rating_avg, skills: c.skills, languages: c.languages, hourly_rate: c.hourly_rate })))}
Rank the best 5 for this patient. Return {"matches":[{"id": string, "score": 0-100, "reason": "one sentence, max 18 words, naming the specific skills that fit"}]}` },
    ]);
    const byId = new Map(candidates.map((c: any) => [c.id, c]));
    const matches = (ranked.matches ?? []).filter((m: any) => byId.has(m.id))
      .map((m: any) => ({ ...(byId.get(m.id) as object), score: m.score, reason: m.reason }));
    return json({ matches, ai: true });
  } catch {
    // AI unavailable: fall back to the SQL ranking.
    return json({ matches: candidates.slice(0, 5).map((c: any) => ({ ...c, score: null,
      reason: c.overlap ? `Covers ${c.overlap} of ${patient.name.split(" ")[0]}'s care needs` : "Verified caregiver nearby" })), ai: false });
  }
});
