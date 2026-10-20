import { NextResponse } from "next/server";

// Protege tudo, exceto a tela de login, as rotas de auth e assets.
export function middleware(req) {
  const { pathname } = req.nextUrl;

  const liberado =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/logout") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (liberado) return NextResponse.next();

  const cookie = req.cookies.get("auth")?.value;
  if (cookie && cookie === process.env.AUTH_TOKEN) {
    return NextResponse.next();
  }

  // API protegida -> 401; paginas -> redireciona pro login
  if (pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ erro: "nao autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
