// Razorpay Payment Links (test mode). Without RAZORPAY_KEY_ID/SECRET set, runs in demo mode
// where "check" marks the booking paid immediately so the hackathon flow still works end to end.
import { cors, json, userClient, adminClient } from "../_shared/common.ts";

const KEY = Deno.env.get("RAZORPAY_KEY_ID");
const SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
const rzp = (path: string, init: RequestInit = {}) =>
  fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { Authorization: "Basic " + btoa(`${KEY}:${SECRET}`), "Content-Type": "application/json" },
  }).then((r) => r.json());

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const { action, booking_id, return_url } = await req.json();

  // Only the family that made the booking can see it through RLS.
  const sb = userClient(req);
  const { data: b } = await sb.from("bookings").select("*, patients(name), profiles!bookings_family_id_fkey(name, phone)")
    .eq("id", booking_id).single();
  if (!b) return json({ error: "booking not found" }, 404);
  const { data: { user } } = await sb.auth.getUser();
  if (b.family_id !== user?.id) return json({ error: "only the family can pay" }, 403);
  if (b.status === "cancelled") return json({ error: "booking cancelled" }, 400);

  const admin = adminClient();
  const markPaid = () => admin.from("bookings").update({ payment_status: "paid", status: "confirmed" }).eq("id", b.id);

  if (b.payment_status === "paid") return json({ paid: true });

  if (!KEY || !SECRET) {
    if (action === "check") { await markPaid(); return json({ paid: true, demo: true }); }
    return json({ demo: true });
  }

  if (action === "create") {
    if (b.rzp_link_url) return json({ url: b.rzp_link_url });
    const link = await rzp("/payment_links", {
      method: "POST",
      body: JSON.stringify({
        amount: b.amount_inr * 100,
        currency: "INR",
        description: `CareBridge booking: care for ${b.patients?.name}`,
        reference_id: b.id.slice(0, 40),
        customer: { name: b.profiles?.name },
        notify: { sms: false, email: false },
        ...(return_url ? { callback_url: return_url, callback_method: "get" } : {}),
      }),
    });
    if (!link.short_url) return json({ error: link.error?.description ?? "Razorpay error" }, 502);
    await admin.from("bookings").update({ rzp_link_id: link.id, rzp_link_url: link.short_url }).eq("id", b.id);
    return json({ url: link.short_url });
  }

  if (action === "check") {
    if (!b.rzp_link_id) return json({ paid: false });
    const link = await rzp(`/payment_links/${b.rzp_link_id}`);
    if (link.status === "paid") { await markPaid(); return json({ paid: true }); }
    return json({ paid: false, status: link.status });
  }
  return json({ error: "unknown action" }, 400);
});
