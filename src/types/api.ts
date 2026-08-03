/** Espelha os schemas do backend (`app/schemas/`). */

export type Papel = "admin" | "comum"

export interface Usuario {
  id: number
  username: string
  email: string
  papel: Papel
}

export interface Vendedor {
  id: number
  nome: string
}

export interface Produto {
  id: number
  nome: string
  /** `Decimal` do backend, serializado como string ("6.00"). Nunca use em conta
   *  direto — passe por `paraCentavos()`. */
  preco: string
  /** dono da mercadoria (lição 44) */
  vendedor: Vendedor
}
