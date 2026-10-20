// Cliente Supabase server-side via REST. Usa a service_role key, que NUNCA
// vai para o navegador: estas funcoes rodam so nas rotas de API.

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

export async function sbSelect(table, query = "") {
  const r = await fetch(`${URL}/rest/v1/${table}?${query}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Supabase select ${table}: ${r.status}`);
  return r.json();
}

export async function sbUpdate(table, matchQuery, data) {
  const r = await fetch(`${URL}/rest/v1/${table}?${matchQuery}`, {
    method: "PATCH",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Supabase update ${table}: ${r.status}`);
  return r.json();
}

export async function sbInsert(table, data) {
  const r = await fetch(`${URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`Supabase insert ${table}: ${r.status}`);
  return r.json();
}
