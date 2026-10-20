"use client";
import { useEffect, useState, useCallback } from "react";
import Nav from "../nav";

export default function Logs() {
  const [rows, setRows] = useState(null);
  const [fExpert, setFExpert] = useState("");
  const [fCanal, setFCanal] = useState("");
  const [fStatus, setFStatus] = useState("");

  const carregar = useCallback(async () => {
    const qs = new URLSearchParams();
    if (fExpert) qs.set("expert", fExpert);
    if (fCanal) qs.set("canal", fCanal);
    if (fStatus) qs.set("status", fStatus);
    const r = await fetch(`/api/logs?${qs.toString()}`);
    setRows(await r.json());
  }, [fExpert, fCanal, fStatus]);

  useEffect(() => { carregar(); }, [carregar]);

  const fmt = (ts) => new Date(ts).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return (
    <>
      <Nav />
      <div className="wrap">
        <h1>Logs de envio</h1>
        <div className="card">
          <div className="row">
            <input placeholder="expert" value={fExpert} onChange={(e) => setFExpert(e.target.value)} />
            <select value={fCanal} onChange={(e) => setFCanal(e.target.value)}>
              <option value="">canal (todos)</option>
              <option value="telegram">telegram</option>
              <option value="email">email</option>
            </select>
            <input placeholder="status" value={fStatus} onChange={(e) => setFStatus(e.target.value)} />
            <button onClick={carregar}>Filtrar</button>
          </div>
        </div>
        <div className="card">
          {!rows && <p className="muted">Carregando...</p>}
          {rows && rows.length === 0 && <p className="muted">Nenhum registro.</p>}
          {rows && rows.length > 0 && (
            <table>
              <thead>
                <tr><th>Quando</th><th>Expert</th><th>Canal</th><th>Destino</th><th>Status</th><th>Detalhe</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="muted">{fmt(r.criado_em)}</td>
                    <td>{r.expert}</td>
                    <td>{r.canal}</td>
                    <td>{r.canal === "email" ? r.email : (r.username || r.user_id)}</td>
                    <td><span className={`pill ${r.status}`}>{r.status}</span></td>
                    <td className="muted">{r.detalhe || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
