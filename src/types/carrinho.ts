import type { Produto } from "./api"

export interface ItemCarrinho {
  produto: Produto
  quantidade: number
  /** preço unitário em centavos */
  unitario: number
  /** `unitario × quantidade`, em centavos */
  subtotal: number
}
