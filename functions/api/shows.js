import { isAdminRequest, json } from "../_lib/auth.js";
import { readShows, writeShows, sanitizeShow, validateShow, isUpcoming, sortByDateAsc } from "../_lib/store.js";

function todayInBrazil() {
  // "YYYY-MM-DD" no fuso de São Paulo, sem precisar de bibliotecas extras.
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

// GET /api/shows — pública: só datas de hoje pra frente.
// Se o pedido tiver uma sessão de admin válida, retorna tudo (inclusive
// datas passadas), pra dar pra administrar/limpar a lista.
export async function onRequestGet({ request, env }) {
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
export async function onRequestPost({ request, env }) {
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
export async function onRequestPut({ request, env }) {
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
export async function onRequestDelete({ request, env }) {
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
