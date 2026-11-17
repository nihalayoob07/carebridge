// Reads an uploaded medical document with Groq and merges the findings into the patient profile.
import { extractText, getDocumentProxy } from "npm:unpdf@1";
import { cors, json, userClient, groqJSON, TEXT_MODEL, VISION_MODEL, SKILLS } from "../_shared/common.ts";

const SCHEMA = `Return ONLY a JSON object with these keys:
{
 "kind": "prescription" | "lab_report" | "discharge" | "other",
 "diagnoses": string[],
 "medications": [{"name": string, "dose": string, "frequency": string}],
 "allergies": string[],
 "lab_values": [{"test": string, "value": string, "flag": "normal" | "high" | "low"}],
 "care_needs": string[],   // ONLY items from this list: ${JSON.stringify(SKILLS)}
 "summary_plain_english": string,  // 2-4 short sentences a worried family member can understand, no jargon
 "caregiver_notes": string[]       // practical do/don't instructions for a home caregiver
}
Use [] when something is not present. Never invent values that are not in the document. Do not use em dashes.`;

const SYSTEM = "You are a careful medical records assistant for an elderly-care platform in India. You extract facts from documents; you do not diagnose.";

const uniq = (a: string[]) => [...new Map(a.filter(Boolean).map((x) => [x.trim().toLowerCase(), x.trim()])).values()];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const sb = userClient(req);
  const { document_id } = await req.json();

  // RLS: only the patient's family can see/update this row.
  const { data: doc, error } = await sb.from("documents").select("*").eq("id", document_id).single();
  if (error || !doc) return json({ error: "document not found" }, 404);
  await sb.from("documents").update({ ai_status: "processing" }).eq("id", doc.id);

  try {
    const { data: file, error: dlErr } = await sb.storage.from("medical-docs").download(doc.storage_path);
    if (dlErr || !file) throw new Error("could not download file");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime = doc.mime ?? file.type ?? "";

    let result;
    if (mime.includes("pdf")) {
      const pdf = await getDocumentProxy(bytes);
      const { text } = await extractText(pdf, { mergePages: true });
      if (!text?.trim()) throw new Error("This PDF has no readable text (scanned?). Upload a photo of it instead.");
      result = await groqJSON(TEXT_MODEL, [
        { role: "system", content: SYSTEM },
        { role: "user", content: `${SCHEMA}\n\nDOCUMENT TEXT:\n${text.slice(0, 24000)}` },
      ]);
    } else {
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      result = await groqJSON(VISION_MODEL, [
        { role: "system", content: SYSTEM },
        { role: "user", content: [
          { type: "text", text: `Read this medical document image. ${SCHEMA}` },
          { type: "image_url", image_url: { url: `data:${mime || "image/jpeg"};base64,${btoa(bin)}` } },
        ] },
      ]);
    }

    const needs = (result.care_needs ?? []).filter((n: string) => SKILLS.includes(n));
    await sb.from("documents").update({
      ai_status: "done",
      ai_extracted: result,
      ai_summary: result.summary_plain_english ?? null,
      kind: ["prescription", "lab_report", "discharge", "other"].includes(result.kind) ? result.kind : doc.kind,
    }).eq("id", doc.id);

    // Merge into the patient profile.
    const { data: p } = await sb.from("patients").select("*").eq("id", doc.patient_id).single();
    if (p) {
      const meds = [...(p.medications ?? [])];
      for (const m of result.medications ?? []) {
        if (m?.name && !meds.some((x: any) => x.name?.toLowerCase() === m.name.toLowerCase())) meds.push(m);
      }
      const merged = {
        allergies: uniq([...(p.allergies ?? []), ...(result.allergies ?? [])]),
        conditions: uniq([...(p.conditions ?? []), ...(result.diagnoses ?? [])]),
        needs: uniq([...(p.needs ?? []), ...needs]),
        medications: meds,
      };
      // Refresh the overall patient summary from everything we know.
      const summary = await groqJSON(TEXT_MODEL, [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Write a warm, plain-English care summary (3-5 sentences, no em dashes) of this elderly patient for their family and a home caregiver. Mention age, conditions, daily medicines, allergies and what help they need. Also return the conditions list cleaned up: merge synonyms and duplicates (e.g. \"Type 2 diabetes\" and \"Type 2 Diabetes Mellitus\"), keep the most specific wording, sentence case. Return {"summary": string, "conditions": string[]}.\n${JSON.stringify({ name: p.name, dob: p.dob, ...merged, latest_document: result.summary_plain_english })}` },
      ]).catch(() => null);
      if (Array.isArray(summary?.conditions) && summary.conditions.length) merged.conditions = uniq(summary.conditions);
      await sb.from("patients").update({ ...merged, ...(summary?.summary ? { ai_summary: summary.summary } : {}) }).eq("id", p.id);
    }
    return json({ ok: true, result });
  } catch (e) {
    await sb.from("documents").update({ ai_status: "failed", ai_summary: String((e as Error).message) }).eq("id", doc.id);
    return json({ error: String((e as Error).message) }, 500);
  }
});
