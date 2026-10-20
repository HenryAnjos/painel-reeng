# reeng. — Painel de Reengajamento (SaaS)

Painel web (Next.js, na Vercel) para operar o fluxo de reengajamento de
bloqueio para **vários clientes**. Cada cliente é um *workspace* com seus
próprios experts, histórico, configurações, equipe e chave de API.

O motor de envio (microserviço Python/Telethon, repo `reeng-telegram`) roda
separado e lê as mesmas tabelas do Supabase. Ele descobre de qual cliente é
cada envio pela chave de API (`x-api-key`).

## Telas
- **Visão geral:** enviados/falhas/taxa do dia, 7 dias, ranking de experts.
- **Experts:** cadastro com limite por plano; credenciais do Telegram nunca
  voltam para o navegador depois de salvas.
- **Histórico:** paginado no servidor, com busca e filtros (expert, canal,
  status, período).
- **Equipe:** convites por link, papéis Dono / Admin / Leitor.
- **Integração:** chave de API do workspace (mostrada uma única vez) e o
  modelo do nó HTTP Request do n8n.
- **Configurações:** regras do motor (espera, dedup, limite diário,
  intervalo, e-mail) e uso do plano.
- **Plataforma:** só para o admin da plataforma — todos os clientes, uso e
  troca de plano.

## Planos
Definidos em `lib/planos.js` (Starter 3 experts / 3 pessoas, Pro 15 / 10,
Scale 100 / 50). O admin da plataforma troca o plano de cada cliente.

## Implantação
1. **Banco:** rode `supabase/schema.sql` no SQL Editor do Supabase. É
   idempotente e migra o schema antigo: experts, envios e a config global vão
   para o workspace "Principal".
2. **Vercel → Environment Variables** (ver `.env.example`):
   `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `AUTH_SECRET`, `MOTOR_URL`,
   `CADASTRO_ABERTO`. As antigas `PANEL_PASSWORD` e `AUTH_TOKEN` não são mais
   usadas.
3. Deploy. No primeiro acesso, `/setup` cria o administrador da plataforma
   (dono do workspace "Principal").
4. Em **Integração**, gere a chave do workspace e atualize o header
   `x-api-key` no n8n. (Para manter a chave antiga funcionando sem mexer no
   n8n, rode no SQL Editor:
   `update workspaces set api_key_hash = encode(sha256('CHAVE_ANTIGA'::bytea), 'hex'), api_key_prefixo = left('CHAVE_ANTIGA', 9) where nome = 'Principal';`)
5. Suba a versão nova do motor (`reeng-telegram`).

## Rodar local
```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev
```

## Segurança
- Senhas com scrypt; sessão em cookie httpOnly assinado (HMAC, 7 dias).
- Toda rota de API checa usuário, workspace e papel; todo acesso a dado filtra
  por `workspace_id`.
- RLS ligado em todas as tabelas: só a service_role (servidor) acessa.
- A chave de API do motor fica só como hash no banco.
- Não commitar `.env`. O `.gitignore` já protege.
