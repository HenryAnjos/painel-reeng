import { NextResponse } from "next/server";

export async function POST(req) {
  const { senha } = await req.json();
  if (senha !== process.env.PANEL_PASSWORD) {
    return NextResponse.json({ erro: "senha incorreta" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth", process.env.AUTH_TOKEN, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
  return res;
}
