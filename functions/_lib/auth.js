// Sessão de admin simples, sem dependências externas.
//
// Como funciona: depois de conferir a senha (ADMIN_PASSWORD), geramos um
// cookie assinado com HMAC-SHA256 usando um segredo próprio (SESSION_SECRET).
// O cookie guarda só a data de expiração + a assinatura — nada de dados
// sensíveis nele. A cada request no /api/shows, recalculamos a assinatura
// e comparamos; se bater e não tiver expirado, o pedido é tratado como admin.
//
// Isso NÃO é um sistema de contas de usuário — é uma senha única
// compartilhada (a mesma para qualquer pessoa que administrar o site).
// Para o caso de uso (o próprio Paulo Mayer gerenciando a agenda dele),
// é suficiente e evita ter que montar login com e-mail/conta.

export const SESSION_COOKIE = "pm_admin_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

function toBase64Url(bytes) {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSHA256(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toBase64Url(new Uint8Array(signature));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/** Gera o valor do cookie de sessão (sem o prefixo "nome=" nem atributos). */
export async function createSessionToken(secret) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const signature = await hmacSHA256(secret, `admin:${expiresAt}`);
  return `${expiresAt}.${signature}`;
}

/** Monta o header Set-Cookie completo para login. */
export function buildSessionCookie(token) {
  const maxAge = Math.floor(SESSION_DURATION_MS / 1000);
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

/** Header Set-Cookie para logout (expira o cookie imediatamente). */
export function buildLogoutCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  const match = header.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Confere se o request tem uma sessão de admin válida (cookie assinado, não expirado). */
export async function isAdminRequest(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return false;
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;
  const expiresAtStr = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  const expiresAt = Number(expiresAtStr);
  if (!expiresAt || Date.now() > expiresAt) return false;
  if (!env.SESSION_SECRET) return false;
  const expectedSignature = await hmacSHA256(env.SESSION_SECRET, `admin:${expiresAt}`);
  return timingSafeEqual(signature, expectedSignature);
}

export function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init && init.headers) },
  });
}
