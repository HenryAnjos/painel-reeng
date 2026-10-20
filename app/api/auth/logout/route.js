import { NextResponse } from "next/server";
import { COOKIE_SESSAO, COOKIE_WS } from "../../../../lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_SESSAO);
  res.cookies.delete(COOKIE_WS);
  return res;
}
