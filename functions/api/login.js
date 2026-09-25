import { createSessionToken, buildSessionCookie, json } from "../_lib/auth.js";

// POST /api/login  { password: "..." }
export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json(
      { ok: false, error: "O site ainda não foi configurado (faltam as variáveis ADMIN_PASSWORD/SESSION_SECRET). Veja o README." },
      { status: 500 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password || password !== env.ADMIN_PASSWORD) {
    return json({ ok: false, error: "Senha incorreta." }, { status: 401 });
  }

  const token = await createSessionToken(env.SESSION_SECRET);
  return json(
    { ok: true },
    { status: 200, headers: { "set-cookie": buildSessionCookie(token) } },
  );
}
