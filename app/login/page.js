"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AuthLayout, { Campo } from "../auth-layout";
import { api, limparMe } from "../ui";

export default function Login() {
  const [f, setF] = useState({ email: "", senha: "" });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // primeiro acesso do sistema: manda para o setup
  useEffect(() => {
    api("/api/auth/setup").then((d) => d.pendente && (location.href = "/setup")).catch(() => {});
  }, []);

  async function entrar(e) {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    try {
      await api("/api/auth/login", { method: "POST", body: f });
      limparMe();
      location.href = "/";
    } catch (x) {
      setErro(x.message);
      setCarregando(false);
    }
  }

  return (
    <AuthLayout titulo="acesso ao painel" rodape={<>Ainda não tem conta? <Link href="/cadastro">Criar conta</Link></>}>
      <form onSubmit={entrar}>
        <Campo label="E-mail" type="email" autoComplete="email" autoFocus value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })} />
        <Campo label="Senha" type="password" autoComplete="current-password" value={f.senha}
          onChange={(e) => setF({ ...f, senha: e.target.value })} />
        <button disabled={carregando} className="full" style={{ marginTop: 18 }}>{carregando ? "Entrando…" : "Entrar"}</button>
        {erro && <div className="msg err" style={{ marginTop: 10 }}>{erro}</div>}
      </form>
    </AuthLayout>
  );
}
