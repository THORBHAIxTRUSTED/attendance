import { ADMIN_PAGE } from "./admin_page.js";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const rand = (n) =>
  [...crypto.getRandomValues(new Uint8Array(n))].map((x) => ALPHA[x % 32]).join("");

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { "content-type": "application/json" },
  });

function safeEq(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function sign(secret, text) {
  const k = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(text));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(req, env) {
    const p = new URL(req.url).pathname;

    if (req.method === "GET" && (p === "/" || p === "/admin")) {
      return new Response(ADMIN_PAGE, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (req.method !== "POST") return json({ error: "not found" }, 404);
    const b = await req.json().catch(() => ({}));

    // ---------- ADMIN ----------
    if (p.startsWith("/admin/")) {
      const t = req.headers.get("x-admin") || "";
      if (!env.ADMIN_TOKEN || !safeEq(t, env.ADMIN_TOKEN))
        return json({ error: "forbidden" }, 403);

      if (p === "/admin/create") {
        const students = (b.students || []).slice(0, 300);
        const prefix = String(b.prefix || "STU").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8) || "STU";
        const out = [];
        const stmts = [];
        for (const s of students) {
          const key = `${prefix}-${rand(4)}-${rand(4)}-${rand(4)}`;
          const name = String(s.name || "").slice(0, 80);
          const roll = String(s.roll || "").slice(0, 40);
          stmts.push(env.DB.prepare("INSERT INTO keys(key,name,roll) VALUES(?,?,?)").bind(key, name, roll));
          out.push({ roll, name, key });
        }
        if (stmts.length) await env.DB.batch(stmts);
        return json(out);
      }
      if (p === "/admin/list") {
        const r = await env.DB.prepare(
          "SELECT key,name,roll,hwid,paused,created_at FROM keys ORDER BY created_at DESC, roll LIMIT 1000"
        ).all();
        return json({ keys: r.results });
      }
      if (p === "/admin/reset") {
        await env.DB.prepare("UPDATE keys SET hwid=NULL WHERE key=?").bind(b.key).run();
        return json({ ok: true });
      }
      if (p === "/admin/pause") {
        await env.DB.prepare("UPDATE keys SET paused=? WHERE key=?").bind(b.paused ? 1 : 0, b.key).run();
        return json({ ok: true });
      }
      if (p === "/admin/delete") {
        await env.DB.prepare("DELETE FROM keys WHERE key=?").bind(b.key).run();
        return json({ ok: true });
      }
      return json({ error: "not found" }, 404);
    }

    // ---------- APK LOGIN ----------
    if (p === "/auth") {
      const key = String(b.key || "").trim().toUpperCase();
      const hwid = String(b.hwid || "").trim();
      if (!key || !hwid || hwid.length > 128) return json({ ok: false, error: "bad request" }, 400);

      const r = await env.DB.prepare("SELECT * FROM keys WHERE key=?").bind(key).first();
      if (!r) return json({ ok: false, error: "invalid key" }, 401);
      if (r.paused) return json({ ok: false, error: "blocked" }, 403);

      if (!r.hwid) {
        const u = await env.DB.prepare("UPDATE keys SET hwid=? WHERE key=? AND hwid IS NULL")
          .bind(hwid, key).run();
        if (!u.meta.changes) return json({ ok: false, error: "device mismatch" }, 403);
      } else if (r.hwid !== hwid) {
        return json({ ok: false, error: "device mismatch" }, 403);
      }

      const payload = JSON.stringify({
        ok: true, name: r.name, roll: r.roll, hwid, ts: Math.floor(Date.now() / 1000),
      });
      const out = { ok: true, name: r.name, roll: r.roll, payload };
      if (env.SIGN_SECRET) out.sig = await sign(env.SIGN_SECRET, payload);
      return json(out);
    }

    return json({ error: "not found" }, 404);
  },
};
