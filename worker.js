/**
 * EcoWast: buyurtmalarni Telegramga yuboruvchi Cloudflare Worker.
 * Kerakli o'zgaruvchilar (Settings > Variables and Secrets):
 *   BOT_TOKEN       - BotFather bergan token (Secret sifatida saqlang)
 *   CHAT_ID         - buyurtmalar keladigan chat ID
 *   ALLOWED_ORIGIN  - sayt manzili, masalan: https://ecowast.uz  (bir nechta bo'lsa, vergul bilan)
 */
const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const cut = (s, n) => String(s ?? "").trim().slice(0, n);

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
    const cors = {
      "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] || "",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    const reply = (status, body) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return reply(405, { ok: false });
    if (!allowed.includes(origin)) return reply(403, { ok: false });

    let d;
    try { d = await request.json(); } catch { return reply(400, { ok: false }); }

    const name = cut(d.name, 80);
    const phone = cut(d.phone, 25);
    if (!name || phone.replace(/\D/g, "").length < 9) return reply(400, { ok: false });

    const lines = [
      "🆕 <b>Yangi buyurtma (EcoWast)</b>",
      "👤 " + esc(name),
      "📞 " + esc(phone),
      "🧹 " + esc(cut(d.service, 60)),
      d.district ? "📍 " + esc(cut(d.district, 60)) : "",
      d.estimate ? "💰 " + esc(cut(d.estimate, 120)) : "",
      "📝 " + esc(cut(d.note, 600) || "izoh yo'q"),
    ].filter(Boolean);

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text: lines.join("\n"), parse_mode: "HTML" }),
    });
    return tg.ok ? reply(200, { ok: true }) : reply(502, { ok: false });
  },
};
