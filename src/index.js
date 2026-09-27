// Worker principal: serve o site estático (pasta public/) e atende as
// rotas /api/* (login, logout, agenda de shows). Substitui o antigo
// modelo "Pages Functions" (pasta functions/), que esta conta do
// Cloudflare não está mais aceitando para projetos novos — a lógica é a
// mesma de antes, só que reunida aqui num único Worker com assets
// estáticos, que é o formato atual do Cloudflare.

import { isAdminRequest, createSessionToken, buildSessionCookie, buildLogoutCookie, json } from "./lib/auth.js";
import {
  readShows,
  writeShows,
  sanitizeShow,
  validateShow,
  isUpcoming,
  sortByDateAsc,
} from "./lib/store.js";

function todayInBrazil() {
  // "YYYY-MM-DD" no fuso de São Paulo, sem precisar de bibliotecas extras.
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

// GET /api/shows — pública: só datas de hoje pra frente.
// Se o pedido tiver uma sessão de admin válida, retorna tudo (inclusive
// datas passadas), pra dar pra administrar/limpar a lista.
async function handleShowsGet(request, env) {
  const admin = await isAdminRequest(request, env);
  let shows = await readShows(env);
  if (!admin) {
    const today = todayInBrazil();
    shows = shows.filter((s) => isUpcoming(s, today));
  }
  shows = sortByDateAsc(shows);
  return json({ ok: true, shows, admin });
}

// POST /api/shows — cria um show novo. Exige sessão de admin.
async function handleShowsPost(request, env) {
  if (!(await isAdminRequest(request, env))) {
    return json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }

  const show = sanitizeShow({ ...body, id: crypto.randomUUID() });
  const error = validateShow(show);
  if (error) return json({ ok: false, error }, { status: 400 });

  const shows = await readShows(env);
  shows.push(show);
  await writeShows(env, shows);
  return json({ ok: true, show });
}

// PUT /api/shows — atualiza um show existente (precisa de "id" no corpo).
async function handleShowsPut(request, env) {
  if (!(await isAdminRequest(request, env))) {
    return json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }
  if (!body.id) return json({ ok: false, error: "ID do show é obrigatório." }, { status: 400 });

  const shows = await readShows(env);
  const index = shows.findIndex((s) => s.id === body.id);
  if (index === -1) return json({ ok: false, error: "Show não encontrado." }, { status: 404 });

  const updated = sanitizeShow({ ...shows[index], ...body, id: shows[index].id });
  const error = validateShow(updated);
  if (error) return json({ ok: false, error }, { status: 400 });

  shows[index] = updated;
  await writeShows(env, shows);
  return json({ ok: true, show: updated });
}

// DELETE /api/shows — remove um show (precisa de "id" no corpo).
async function handleShowsDelete(request, env) {
  if (!(await isAdminRequest(request, env))) {
    return json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }
  if (!body.id) return json({ ok: false, error: "ID do show é obrigatório." }, { status: 400 });

  const shows = await readShows(env);
  const next = shows.filter((s) => s.id !== body.id);
  await writeShows(env, next);
  return json({ ok: true });
}

// POST /api/login  { password: "..." }
async function handleLogin(request, env) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json(
      {
        ok: false,
        error:
          "O site ainda não foi configurado (faltam as variáveis ADMIN_PASSWORD/SESSION_SECRET). Veja o README.",
      },
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
  return json({ ok: true }, { status: 200, headers: { "set-cookie": buildSessionCookie(token) } });
}

// POST /api/logout
async function handleLogout() {
  return json({ ok: true }, { status: 200, headers: { "set-cookie": buildLogoutCookie() } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    if (pathname === "/api/shows") {
      if (method === "GET") return handleShowsGet(request, env);
      if (method === "POST") return handleShowsPost(request, env);
      if (method === "PUT") return handleShowsPut(request, env);
      if (method === "DELETE") return handleShowsDelete(request, env);
      return json({ ok: false, error: "Método não permitido." }, { status: 405 });
    }

    if (pathname === "/api/login" && method === "POST") {
      return handleLogin(request, env);
    }

    if (pathname === "/api/logout" && method === "POST") {
      return handleLogout();
    }

    // Tudo o mais: serve os arquivos estáticos da pasta public/ (o site em si).
    return env.ASSETS.fetch(request);
  },
};
