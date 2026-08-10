import { defineStore } from "pinia"
import { ref } from "vue"
import type { Cliente, OpcaoPagamento } from "../types/api"

/**
 * A venda em andamento. Mora fora da tela porque sair de Registrar venda para
 * consultar uma conta não pode desfazer o carrinho — só limpar desfaz.
 */
export const useCarrinhoStore = defineStore("carrinho", () => {
  // produtoId → quantidade. O produto inteiro não entra: preço e estoque vêm da
  // recarga da grade, e guardar uma cópia aqui seria guardar dado velho.
  const quantidades = ref(new Map<number, number>())
  const forma = ref<OpcaoPagamento | null>(null)
  const cliente = ref<Cliente | null>(null)

  function quantidade(produtoId: number): number {
    return quantidades.value.get(produtoId) ?? 0
  }

  function alterar(produtoId: number, delta: number) {
    const nova = quantidade(produtoId) + delta
    if (nova <= 0) quantidades.value.delete(produtoId)
    else quantidades.value.set(produtoId, nova)
  }

  function limpar() {
    quantidades.value.clear()
    forma.value = null
    cliente.value = null
  }

  return { quantidades, forma, cliente, quantidade, alterar, limpar }
})
