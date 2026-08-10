import api from "./api"
import type { Venda, VendaCreate } from "../types/api"

export async function registrarVenda(dados: VendaCreate): Promise<Venda> {
  const { data } = await api.post<Venda>("/vendas", dados)
  return data
}

/** `dia` em ISO. Traz as canceladas junto: quem revisa precisa ver o que já desfez. */
export async function listarVendasDoDia(dia: string): Promise<Venda[]> {
  const { data } = await api.get<Venda[]>("/vendas", {
    params: { dia, incluir_canceladas: true },
  })
  return data
}

export async function cancelarVenda(id: number): Promise<Venda> {
  const { data } = await api.delete<Venda>(`/vendas/${id}`)
  return data
}
