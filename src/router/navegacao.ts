export interface ItemNav {
  nome: string
  rotulo: string
  curto?: string
  papel?: "admin" | "comum"
  celular?: boolean
}

export const OPERACAO: ItemNav[] = [
  { nome: "vender", rotulo: "Registrar venda", curto: "Vender", celular: true },
  { nome: "contas", rotulo: "Contas em aberto", curto: "Contas", celular: true },
  { nome: "relatorio", rotulo: "Relatório", papel: "admin", celular: true },
  // sem papel: vendedor precisa saber o que ainda tem, mesmo sem poder ajustar
  { nome: "estoque", rotulo: "Estoque", celular: true },
]

export const CADASTROS: ItemNav[] = [
  { nome: "produtos", rotulo: "Produtos", papel: "admin" },
  // sem papel: o vendedor precisa cadastrar cliente na hora de fiar; editar e remover
  // continuam só do admin, e quem barra de verdade é o backend
  { nome: "clientes", rotulo: "Clientes" },
  { nome: "vendedores", rotulo: "Vendedores", papel: "admin" },
]

/** Item sem `papel` é de todo mundo; com `papel`, só de quem tem aquele papel. */
export function visivelPara(item: ItemNav, isAdmin: boolean): boolean {
  if (!item.papel) return true
  return item.papel === (isAdmin ? "admin" : "comum")
}
