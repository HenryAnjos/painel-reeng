import { NextResponse } from "next/server";

// Protege tudo, exceto telas publicas (login, cadastro, setup, convite),
// as rotas de auth e assets. Aqui so confere a assinatura do cookie;
// usuario, workspace e papel sao validados em cada rota de API.
const PUBLICAS = ["/login", "/cadastro", "/setup", "/convite", "/api/auth/"];

async function tokenValido(token) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return false;
  const [uid, exp, sig] = token.split(".");
  if (!uid || !exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${uid}.${exp}`)));
  const b64 = btoa(String.fromCharCode(...mac)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b64 === sig;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (PUBLICAS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (await tokenValido(req.cookies.get("sessao")?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ erro: "nao autenticado" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
