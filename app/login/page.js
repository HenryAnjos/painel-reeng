"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../icons";

export default function Login() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function entrar(e) {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha }),
    });
    setCarregando(false);
    if (r.ok) {
      router.push("/");
    } else {
      setErro("Senha incorreta");
    }
  }

  return (
    <div className="login-page">
    <div className="login">
      <div className="brand">
        <span className="logo"><Icon name="bolt" size={16} /></span>
        <span>Reeng<b>Experts</b></span>
      </div>
    <div className="card">
      <div className="card-title"><Icon name="lock" size={14} />Acesso ao painel</div>
      <form onSubmit={entrar}>
        <label>Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoFocus
        />
        <div style={{ marginTop: 16 }}>
          <button disabled={carregando} style={{ width: "100%", justifyContent: "center" }}>{carregando ? "..." : "Entrar"}</button>
        </div>
        {erro && <div className="msg err" style={{ marginTop: 10 }}>{erro}</div>}
      </form>
    </div>
    </div>
    </div>
  );
}
