"use client";
import Icon from "./icons";
import { Marca } from "./nav";

export default function AuthLayout({ titulo, icon = "lock", tag = "// trazendo leads de volta", rodape, children }) {
  return (
    <div className="login-page">
      <div className="login">
        <Marca />
        <div className="login-tag">{tag}</div>
        <div className="card">
          <div className="card-title"><Icon name={icon} size={14} />{titulo}</div>
          {children}
        </div>
        {rodape && <div className="login-rodape">{rodape}</div>}
      </div>
    </div>
  );
}

export function Campo({ label, ...props }) {
  return (
    <>
      <label>{label}</label>
      <input {...props} />
    </>
  );
}
