/**
 * Descrição da navegação: quais rotas viram item de menu, para quem, e onde.
 * Fica junto do router porque é metadado de rota — o layout só desenha.
 */

export interface ItemNav {
  /** nome da rota (o mesmo do router) */
  nome: string
  rotulo: string
  /** rótulo da navegação inferior, onde só cabe uma palavra */
  curto?: string
  /** visível só pra este papel; ausente = todos */
  papel?: "admin" | "comum"
  /** também aparece na navegação inferior do celular */
  celular?: boolean
}

/** Grupo principal — o que se faz no dia a dia. */
export const OPERACAO: ItemNav[] = [
  { nome: "vender", rotulo: "Registrar venda", curto: "Vender", celular: true },
  {
    nome: "minhas-vendas",
    rotulo: "Minhas vendas",
    curto: "Vendas",
    papel: "comum",
    celular: true,
  },
  { nome: "contas", rotulo: "Contas em aberto", curto: "Contas", celular: true },
  // o admin não precisa de "minhas vendas": o relatório mostra tudo
  {
    nome: "relatorio",
    rotulo: "Relatório do dia",
    curto: "Relatório",
    papel: "admin",
    celular: true,
  },
]

/** Grupo "CADASTROS" — só admin, e nunca na navegação do celular. */
export const CADASTROS: ItemNav[] = [
  { nome: "produtos", rotulo: "Produtos" },
  { nome: "clientes", rotulo: "Clientes" },
  { nome: "vendedores", rotulo: "Vendedores" },
]
