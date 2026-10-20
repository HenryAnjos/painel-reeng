// Planos do SaaS e seus limites. Para mudar precos/limites, mexa so aqui.
export const PLANOS = {
  starter: { nome: "Starter", experts: 3, membros: 3 },
  pro: { nome: "Pro", experts: 15, membros: 10 },
  scale: { nome: "Scale", experts: 100, membros: 50 },
};

export function plano(id) {
  return PLANOS[id] || PLANOS.starter;
}
