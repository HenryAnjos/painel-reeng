"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="login card">
      <h1>Entrar</h1>
      <form onSubmit={entrar}>
        <label>Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoFocus
        />
        <div style={{ marginTop: 16 }}>
          <button disabled={carregando}>{carregando ? "..." : "Entrar"}</button>
        </div>
        {erro && <div className="msg err">{erro}</div>}
      </form>
    </div>
  );
}
