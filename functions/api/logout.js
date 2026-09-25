import { buildLogoutCookie, json } from "../_lib/auth.js";

// POST /api/logout
export async function onRequestPost() {
  return json(
    { ok: true },
    { status: 200, headers: { "set-cookie": buildLogoutCookie() } },
  );
}
