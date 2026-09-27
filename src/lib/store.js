// Leitura/escrita da lista de shows no Cloudflare KV.
//
// Guardamos tudo num único valor JSON (array de shows) sob a chave "shows"
// no namespace SHOWS_KV. Para o volume de dados de uma agenda de shows
// (algumas dezenas de datas, no máximo) isso é simples e suficiente —
// não precisa de um banco relacional pra isso.

const KV_KEY = "shows";

export async function readShows(env) {
  const raw = await env.SHOWS_KV.get(KV_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeShows(env, shows) {
  await env.SHOWS_KV.put(KV_KEY, JSON.stringify(shows));
}

/** Mantém só os campos esperados, com os tipos certos. */
export function sanitizeShow(input) {
  const str = (v) => (typeof v === "string" ? v.trim() : "");
  return {
    id: str(input.id),
    data: str(input.data), // formato "YYYY-MM-DD"
    horario: str(input.horario), // formato "HH:MM", opcional
    local: str(input.local),
    cidade: str(input.cidade),
    linkIngresso: str(input.linkIngresso),
    observacao: str(input.observacao),
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateShow(show) {
  if (!DATE_RE.test(show.data)) {
    return "Data inválida — use o formato AAAA-MM-DD.";
  }
  if (!show.local) {
    return "Informe o nome do local.";
  }
  return null;
}

export function isUpcoming(show, referenceDate) {
  if (!DATE_RE.test(show.data)) return false;
  // Comparação de strings "YYYY-MM-DD" funciona lexicograficamente como
  // comparação de datas, sem precisar de fuso horário.
  return show.data >= referenceDate;
}

export function sortByDateAsc(shows) {
  return [...shows].sort((a, b) => (a.data || "").localeCompare(b.data || ""));
}
