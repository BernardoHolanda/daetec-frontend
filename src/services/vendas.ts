import api from "./api"
import type { Venda, VendaCreate } from "../types/api"

export async function registrarVenda(dados: VendaCreate): Promise<Venda> {
  const { data } = await api.post<Venda>("/vendas", dados)
  return data
}
