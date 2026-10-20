"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AuthLayout, { Campo } from "../../auth-layout";
import { api, limparMe, PAPEIS } from "../../ui";

export default function Convite() {
  const { token } = useParams();
  const [c, setC] = useState(null);
  const [f, setF] = useState({ nome: "", senha: "" });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    api(`/api/auth/convite/${token}`).then(setC).catch((e) => setErro(e.message));
  }, [token]);

  async function aceitar(e) {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    try {
      await api(`/api/auth/convite/${token}`, { method: "POST", body: f });
      limparMe();
      location.href = "/";
    } catch (x) {
      setErro(x.message);
      setCarregando(false);
    }
  }

  return (
    <AuthLayout titulo="convite" icon="team" tag="// você foi convidado">
      {!c && !erro && <p className="muted">Carregando…</p>}
      {!c && erro && <p className="msg err">{erro}</p>}
      {c && (
        <form onSubmit={aceitar}>
          <p style={{ marginTop: 0 }}>
            Entrar em <b>{c.workspace}</b> como <span className="badge">{PAPEIS[c.papel]}</span>
          </p>
          {c.logado ? (
            <p className="muted" style={{ fontSize: 13 }}>Você está logado como {c.logado}.</p>
          ) : (
            <>
              <Campo label="E-mail" value={c.email} disabled />
              <Campo label="Seu nome" autoFocus value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
              <Campo label="Crie uma senha (mín. 8)" type="password" autoComplete="new-password" value={f.senha}
                onChange={(e) => setF({ ...f, senha: e.target.value })} />
            </>
          )}
          <button disabled={carregando} className="full" style={{ marginTop: 18 }}>{carregando ? "Entrando…" : "Aceitar convite"}</button>
          {erro && <div className="msg err" style={{ marginTop: 10 }}>{erro}</div>}
        </form>
      )}
    </AuthLayout>
  );
}
