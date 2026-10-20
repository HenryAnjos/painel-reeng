# Painel Reengajamento

Painel web (Next.js) para configurar o fluxo de reengajamento de bloqueio:
experts, textos, credenciais do Telegram, canais e logs. Hospedado na Vercel.

Fala com o Supabase pelas rotas de API server-side (a service_role key nunca
vai para o navegador). O motor de envio (microserviço Python/Telethon) roda
separado, na Railway, e lê as mesmas tabelas do Supabase.

## Telas
- **Experts:** lista, criar, editar (nome, api_id, api_hash, session_string,
  texto, áudio), ligar/desligar canais e o expert.
- **Config:** espera, janela de dedup, limites por conta, remetente de e-mail.
- **Logs:** envios filtráveis por expert, canal e status.

## Deploy na Vercel
1. Suba este repositório no GitHub.
2. Na Vercel: New Project, importe o repo (framework detectado: Next.js).
3. Em **Environment Variables**, cadastre (valores do `.env.example`):
   - `PANEL_PASSWORD` — senha única de acesso
   - `AUTH_TOKEN` — string longa aleatória (token de sessão)
   - `SUPABASE_URL` — URL do projeto Supabase
   - `SUPABASE_SERVICE_KEY` — service_role key do Supabase
4. Deploy.

## Rodar local
```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev
```

## Segurança
- Login por senha única; cookie httpOnly de 7 dias.
- A service_role só existe no servidor (rotas /api). O navegador nunca a vê.
- Não commitar `.env`. O `.gitignore` já protege.
