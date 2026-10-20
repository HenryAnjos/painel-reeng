"use client";
import { useState } from "react";
import Link from "next/link";
import AuthLayout, { Campo } from "../auth-layout";
import { api, limparMe } from "../ui";

export default function Cadastro() {
  const [f, setF] = useState({ nome: "", email: "", senha: "", workspace: "" });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function criar(e) {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    try {
      await api("/api/auth/cadastro", { method: "POST", body: f });
      limparMe();
      location.href = "/integracao";
    } catch (x) {
      setErro(x.message);
      setCarregando(false);
    }
  }

  return (
    <AuthLayout titulo="criar conta" icon="plus" rodape={<>Já tem conta? <Link href="/login">Entrar</Link></>}>
      <form onSubmit={criar}>
        <Campo label="Seu nome" autoFocus value={f.nome} onChange={set("nome")} />
        <Campo label="E-mail" type="email" autoComplete="email" value={f.email} onChange={set("email")} />
        <Campo label="Senha (mín. 8 caracteres)" type="password" autoComplete="new-password" value={f.senha} onChange={set("senha")} />
        <Campo label="Nome da empresa" value={f.workspace} onChange={set("workspace")} placeholder="vira o seu workspace" />
        <button disabled={carregando} className="full" style={{ marginTop: 18 }}>{carregando ? "Criando…" : "Criar conta"}</button>
        {erro && <div className="msg err" style={{ marginTop: 10 }}>{erro}</div>}
      </form>
    </AuthLayout>
  );
}
