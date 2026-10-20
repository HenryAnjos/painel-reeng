"use client";
import { useEffect, useState } from "react";
import AuthLayout, { Campo } from "../auth-layout";
import { api, limparMe } from "../ui";

// Primeiro acesso: cria o administrador da plataforma.
export default function Setup() {
  const [f, setF] = useState({ nome: "", email: "", senha: "" });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    api("/api/auth/setup").then((d) => !d.pendente && (location.href = "/login")).catch(() => {});
  }, []);

  async function criar(e) {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    try {
      await api("/api/auth/setup", { method: "POST", body: f });
      limparMe();
      location.href = "/";
    } catch (x) {
      setErro(x.message);
      setCarregando(false);
    }
  }

  return (
    <AuthLayout titulo="primeiro acesso" icon="shield" tag="// configure o administrador da plataforma">
      <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
        Esta conta será a dona do workspace atual e administradora da plataforma.
      </p>
      <form onSubmit={criar}>
        <Campo label="Seu nome" autoFocus value={f.nome} onChange={set("nome")} />
        <Campo label="E-mail" type="email" value={f.email} onChange={set("email")} />
        <Campo label="Senha (mín. 8 caracteres)" type="password" autoComplete="new-password" value={f.senha} onChange={set("senha")} />
        <button disabled={carregando} className="full" style={{ marginTop: 18 }}>{carregando ? "Criando…" : "Criar administrador"}</button>
        {erro && <div className="msg err" style={{ marginTop: 10 }}>{erro}</div>}
      </form>
    </AuthLayout>
  );
}
