// Cliente Supabase server-side via REST. Usa a service_role key, que NUNCA
// vai para o navegador: estas funcoes rodam so nas rotas de API.
// Todo acesso a dados de cliente deve filtrar por workspace_id.

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

function headers(extra = {}) {
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

// Monta a query string a partir de um objeto (valores sempre escapados).
// Aceita string pronta por compatibilidade.
function qs(query) {
  if (typeof query === "string") return query;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    for (const item of [].concat(v)) p.append(k, item);
  }
  return p.toString();
}

async function falha(r, op, table) {
  let corpo = "";
  try { corpo = await r.text(); } catch {}
  const e = new Error(`Supabase ${op} ${table}: ${r.status} ${corpo.slice(0, 200)}`);
  e.status = r.status;
  e.code = (() => { try { return JSON.parse(corpo).code; } catch { return undefined; } })();
  throw e;
}

export async function sbSelect(table, query = "") {
  const r = await fetch(`${URL}/rest/v1/${table}?${qs(query)}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!r.ok) await falha(r, "select", table);
  return r.json();
}

export async function sbSelectOne(table, query) {
  const rows = await sbSelect(table, { ...query, limit: 1 });
  return rows[0] || null;
}

// Select paginado com total: { rows, total }
export async function sbPage(table, query, offset, limit) {
  const r = await fetch(`${URL}/rest/v1/${table}?${qs(query)}`, {
    headers: headers({ Prefer: "count=exact", Range: `${offset}-${offset + limit - 1}`, "Range-Unit": "items" }),
    cache: "no-store",
  });
  if (!r.ok && r.status !== 416) await falha(r, "select", table);
  const total = Number((r.headers.get("content-range") || "").split("/")[1]) || 0;
  return { rows: r.status === 416 ? [] : await r.json(), total };
}

export async function sbCount(table, query, coluna = "id") {
  const r = await fetch(`${URL}/rest/v1/${table}?${qs({ ...query, select: coluna })}`, {
    method: "HEAD",
    headers: headers({ Prefer: "count=exact" }),
    cache: "no-store",
  });
  if (!r.ok) await falha(r, "count", table);
  return Number((r.headers.get("content-range") || "").split("/")[1]) || 0;
}

export async function sbUpdate(table, matchQuery, data) {
  const r = await fetch(`${URL}/rest/v1/${table}?${qs(matchQuery)}`, {
    method: "PATCH",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(data),
  });
  if (!r.ok) await falha(r, "update", table);
  return r.json();
}

export async function sbInsert(table, data) {
  const r = await fetch(`${URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(data),
  });
  if (!r.ok) await falha(r, "insert", table);
  return r.json();
}

export async function sbDelete(table, matchQuery) {
  const r = await fetch(`${URL}/rest/v1/${table}?${qs(matchQuery)}`, {
    method: "DELETE",
    headers: headers({ Prefer: "return=representation" }),
  });
  if (!r.ok) await falha(r, "delete", table);
  return r.json();
}

export async function sbRpc(fn, args = {}) {
  const r = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!r.ok) await falha(r, "rpc", fn);
  return r.json();
}
